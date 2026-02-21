import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Dashboard';
import {
    Sun, Moon, Users, Search, Loader2, Save,
    CheckCircle2, XCircle, Clock, AlertTriangle, UserX
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const AttendanceDashboard = () => {
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('dashboardTheme');
        return saved !== 'light';
    });

    const toggleTheme = () => {
        const newState = !isDark;
        setIsDark(newState);
        localStorage.setItem('dashboardTheme', newState ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', newState);
    };

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [grade, setGrade] = useState('Nursery');
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, [date, grade]);

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_BASE_URL}/attendance/by-class/`, {
                params: { grade, date },
                headers: { Authorization: `Bearer ${token}` }
            });
            // The backend returns an array of students with { "student_id", "student_name", "status", "remarks", ... }
            if (response.data && response.data.students) {
                // Store initial status to track if changed
                const studentsWithInitial = response.data.students.map(s => ({
                    ...s,
                    initialStatus: s.status
                }));
                setStudents(studentsWithInitial);
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to fetch students. ' + (error.response?.data?.message || ''));
            setStudents([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (studentId, newStatus) => {
        // Update local state immediately for snappy UI
        setStudents(prev => prev.map(student =>
            student.student_id === studentId
                ? { ...student, status: newStatus }
                : student
        ));

        // Auto-save this specific student
        const student = students.find(s => s.student_id === studentId);
        if (student) {
            await saveAttendance({
                student_id: studentId,
                status: newStatus,
                remarks: student.remarks || ''
            });
        }
    };

    const handleRemarksChange = (studentId, remarks) => {
        setStudents(prev => prev.map(student =>
            student.student_id === studentId
                ? { ...student, remarks }
                : student
        ));
    };

    const saveAttendance = async (individualStudent = null, studentsOverride = null) => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('access_token');

            let recordsToSave;
            if (individualStudent) {
                recordsToSave = [individualStudent];
            } else if (studentsOverride) {
                recordsToSave = studentsOverride.map(s => ({
                    student_id: s.student_id,
                    status: s.status,
                    remarks: s.remarks || ''
                }));
            } else {
                recordsToSave = students.map(s => ({
                    student_id: s.student_id,
                    status: s.status,
                    remarks: s.remarks || ''
                }));
            }

            if (recordsToSave.length === 0) {
                setIsSaving(false);
                return;
            }

            const payload = {
                date,
                records: recordsToSave
            };

            const response = await axios.post(`${API_BASE_URL}/attendance/bulk/`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(individualStudent
                ? `Updated ${students.find(s => s.student_id === individualStudent.student_id)?.student_name}`
                : response.data.message || 'Attendance saved successfully!'
            );

            if (individualStudent) {
                setStudents(prev => prev.map(s =>
                    s.student_id === individualStudent.student_id ? { ...s, initialStatus: s.status } : s
                ));
            } else {
                setStudents(prev => prev.map(s => ({ ...s, initialStatus: s.status })));
            }
        } catch (error) {
            console.error('Error saving attendance:', error);
            toast.error('Failed to save attendance. ' + (error.response?.data?.error || ''));
        } finally {
            setIsSaving(false);
        }
    };

    const markAll = async (status) => {
        const updatedStudents = students.map(s => ({
            ...s,
            status,
            remarks: status === 'none' ? '' : s.remarks
        }));

        setStudents(updatedStudents);

        if (status !== 'none') {
            // Bulk save all students using the fresh data
            await saveAttendance(null, updatedStudents);
            toast.success(`Marked everyone as ${status}`);
        } else {
            toast.success('Roster unmarked/reset');
        }
    };

    // Status mapping for beautiful UI elements
    const statusOptions = [
        { value: 'present', label: 'Present', icon: CheckCircle2, color: 'text-emerald-500', bgDark: 'bg-emerald-500/10', bgLight: 'bg-emerald-100', border: 'border-emerald-500/30' },
        { value: 'absent', label: 'Absent', icon: XCircle, color: 'text-rose-500', bgDark: 'bg-rose-500/10', bgLight: 'bg-rose-100', border: 'border-rose-500/30' },
        { value: 'leave', label: 'Leave', icon: Clock, color: 'text-blue-500', bgDark: 'bg-blue-500/10', bgLight: 'bg-blue-100', border: 'border-blue-500/30' },
        { value: 'late', label: 'Late', icon: AlertTriangle, color: 'text-amber-500', bgDark: 'bg-amber-500/10', bgLight: 'bg-amber-100', border: 'border-amber-500/30' }
    ];

    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <Sidebar isDark={isDark} />

            <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative">
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

                    {/* Header section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight`}>
                                Daily Roll Call
                            </h1>
                            <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Record and monitor student attendance rapidly.
                            </p>
                        </motion.div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleTheme}
                                className={`p-3 rounded-2xl border transition-all ${isDark ? 'bg-slate-900/50 border-slate-800 text-yellow-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
                            >
                                {isDark ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            <button
                                onClick={() => saveAttendance()}
                                disabled={isSaving || students.length === 0}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white transition-all shadow-lg hover:shadow-xl ${isSaving || students.length === 0 ? 'bg-blue-500/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'}`}
                            >
                                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                {isSaving ? 'Saving...' : 'Save All Records'}
                            </button>
                        </div>
                    </div>

                    {/* Controls Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-[2rem] border backdrop-blur-xl mb-8 flex flex-col sm:flex-row gap-6 items-end ${isDark ? 'bg-slate-900/40 border-slate-800/50 shadow-xl' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}
                    >
                        <div className="flex-1 w-full relative">
                            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 pl-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Select Class</label>
                            <select
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                className={`w-full pl-6 pr-4 py-4 rounded-2xl transition-all outline-none font-bold ${isDark ? 'bg-slate-950/50 border-white/5 text-white focus:border-blue-500 focus:bg-slate-900' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white border'}`}
                            >
                                <option value="Nursery">Nursery</option>
                                <option value="Prep">Prep</option>
                                <option value="1">Class 1</option>
                                <option value="2">Class 2</option>
                                <option value="3">Class 3</option>
                                <option value="4">Class 4</option>
                                <option value="5">Class 5</option>
                                <option value="6">Class 6</option>
                                <option value="7">Class 7</option>
                                <option value="8">Class 8</option>
                                <option value="9">Class 9</option>
                                <option value="10">Class 10</option>
                                <option value="11">1st Year</option>
                                <option value="12">2nd Year</option>
                            </select>
                        </div>

                        <div className="flex-1 w-full relative">
                            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 pl-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Attendance Date</label>
                            <input
                                type="date"
                                value={date}
                                max={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setDate(e.target.value)}
                                style={{ colorScheme: isDark ? 'dark' : 'light' }}
                                className={`w-full pl-6 pr-4 py-4 rounded-2xl transition-all outline-none font-bold ${isDark ? 'bg-slate-950/50 border-white/5 text-white focus:border-blue-500 focus:bg-slate-900' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white border text-[14px]'}`}
                            />
                        </div>

                        <div className="w-full sm:w-auto">
                            <button
                                onClick={fetchStudents}
                                className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${isDark ? 'bg-white text-slate-900 hover:bg-blue-50' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
                            >
                                <Search size={18} /> Load Roster
                            </button>
                        </div>
                    </motion.div>

                    {/* Bulk Actions */}
                    {students.length > 0 && (
                        <div className={`flex items-center gap-2 mb-4 p-4 rounded-2xl border ${isDark ? 'bg-slate-900/30 border-slate-800/50' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <span className={`text-sm font-bold mr-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Mark Everyone As:</span>
                            <button onClick={() => markAll('present')} className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>Present</button>
                            <button onClick={() => markAll('absent')} className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>Absent</button>
                            <button onClick={() => markAll('leave')} className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>Leave</button>
                            <button onClick={() => markAll('late')} className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>Late</button>
                            <button onClick={() => markAll('none')} className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'} ml-2`}>Reset/Unmark</button>
                        </div>
                    )}

                    {/* Student Grid */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                            <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading class roster...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center h-64 rounded-3xl border-2 border-dashed ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                            <UserX size={48} className={isDark ? 'text-slate-700 mb-4' : 'text-slate-300 mb-4'} />
                            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No Students Found</h3>
                            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'} max-w-sm text-center`}>No students are currently enrolled in this class. Try adjusting the search filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {students.map((student, idx) => (
                                    <motion.div
                                        key={student.student_id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`p-5 rounded-3xl border flex flex-col gap-4 transition-all ${isDark ? 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-900/60 shadow-xl' : 'bg-white border-slate-200 hover:shadow-lg shadow-slate-200/50'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xl font-black text-slate-400 border border-slate-300 dark:border-slate-700">
                                                {student.student_image ? (
                                                    <img src={`http://127.0.0.1:8000${student.student_image}`} className="w-full h-full object-cover" alt="Student" />
                                                ) : (
                                                    student.student_name.charAt(0)
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`font-bold text-lg truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.student_name}</h3>
                                                    {student.initialStatus !== 'none' && (
                                                        <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border border-emerald-500/20">
                                                            <CheckCircle2 size={10} /> Saved
                                                        </div>
                                                    )}
                                                </div>
                                                <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>ID: {student.student_id}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 w-full">
                                            {statusOptions.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => handleStatusChange(student.student_id, option.value)}
                                                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all ${student.status === option.value
                                                        ? `${isDark ? option.bgDark : option.bgLight} ${option.border} ${option.color} ring-1 ring-inset ring-current`
                                                        : `${isDark ? 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`
                                                        }`}
                                                >
                                                    <option.icon size={18} className="mb-1" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wide">{option.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Remarks Input (Only highly prominent if not Present) */}
                                        <div className={`transition-all duration-300 overflow-hidden ${student.status === 'present' || student.status === 'none' ? 'h-0 opacity-0' : 'h-12 opacity-100 mt-2'}`}>
                                            <input
                                                type="text"
                                                placeholder="Add remarks (optional) - Press Enter to Save"
                                                value={student.remarks || ''}
                                                onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        saveAttendance({
                                                            student_id: student.student_id,
                                                            status: student.status,
                                                            remarks: student.remarks
                                                        });
                                                    }
                                                }}
                                                className={`w-full h-10 px-4 rounded-xl text-sm font-medium outline-none transition-colors border ${isDark ? 'bg-slate-950/50 border-slate-800 text-slate-300 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500'}`}
                                            />
                                        </div>

                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default AttendanceDashboard;
