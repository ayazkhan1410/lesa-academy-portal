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
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const BASE_URL = 'http://127.0.0.1:8000';
const API_BASE_URL = `${BASE_URL}/api`;

const AttendanceDashboard = () => {
    const { t } = useTranslation();
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
    const [savingIds, setSavingIds] = useState(new Set());

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
        // Find the student
        const student = students.find(s => s.student_id === studentId);
        if (!student || student.status === newStatus) return;

        // Update local state immediately for snappy UI
        setStudents(prev => prev.map(s =>
            s.student_id === studentId ? { ...s, status: newStatus } : s
        ));

        // Add to saving set
        setSavingIds(prev => new Set(prev).add(studentId));

        try {
            await saveAttendance({
                student_id: studentId,
                status: newStatus,
                remarks: student.remarks || ''
            }, null, true); // silent flag to avoid global loading/toast spam
        } finally {
            setSavingIds(prev => {
                const next = new Set(prev);
                next.delete(studentId);
                return next;
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

    const saveAttendance = async (individualStudent = null, studentsOverride = null, silent = false) => {
        if (!silent) setIsSaving(true);
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
                if (!silent) setIsSaving(false);
                return;
            }

            const payload = { date, records: recordsToSave };
            const response = await axios.post(`${API_BASE_URL}/attendance/bulk/`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!silent) {
                toast.success(individualStudent
                    ? `Updated ${students.find(s => s.student_id === individualStudent.student_id)?.student_name}`
                    : response.data.message || 'Attendance saved successfully!'
                );
            }

            if (individualStudent) {
                setStudents(prev => prev.map(s =>
                    s.student_id === individualStudent.student_id ? { ...s, initialStatus: s.status } : s
                ));
            } else if (studentsOverride) {
                setStudents(studentsOverride.map(s => ({ ...s, initialStatus: s.status })));
            } else {
                setStudents(prev => prev.map(s => ({ ...s, initialStatus: s.status })));
            }
        } catch (error) {
            console.error('Error saving attendance:', error);
            if (!silent) toast.error('Failed to save attendance. ' + (error.response?.data?.error || ''));
        } finally {
            if (!silent) setIsSaving(false);
        }
    };

    const markAll = async (status) => {
        // Only mark students who haven't been marked yet (status is 'none')
        const updatedStudents = students.map(s => (s.status === 'none' || status === 'none') ? {
            ...s,
            status,
            remarks: (status === 'none' || status === 'present') ? '' : s.remarks
        } : s);

        setStudents(updatedStudents);

        if (status !== 'none') {
            // Bulk save all students using the fresh data
            await saveAttendance(null, updatedStudents);
        } else {
            toast.success('Roster unmarked/reset');
        }
    };

    // Status mapping for beautiful UI elements
    const statusOptions = [
        { value: 'present', label: t('attendance.present'), icon: CheckCircle2, color: 'text-emerald-500', bgDark: 'bg-emerald-500/10', bgLight: 'bg-emerald-100', border: 'border-emerald-500/30' },
        { value: 'absent', label: t('attendance.absent'), icon: XCircle, color: 'text-rose-500', bgDark: 'bg-rose-500/10', bgLight: 'bg-rose-100', border: 'border-rose-500/30' },
        { value: 'leave', label: t('attendance.leave'), icon: Clock, color: 'text-blue-500', bgDark: 'bg-blue-500/10', bgLight: 'bg-blue-100', border: 'border-blue-500/30' },
        { value: 'late', label: t('attendance.late'), icon: AlertTriangle, color: 'text-amber-500', bgDark: 'bg-amber-500/10', bgLight: 'bg-amber-100', border: 'border-amber-500/30' }
    ];

    const remarkOptions = [
        "Sick",
        "Family Emergency",
        "Out of Station",
        "No Information",
        "Other"
    ];

    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <Sidebar isDark={isDark} />

            <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative">
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tighter italic uppercase underline decoration-blue-500 decoration-4 underline-offset-8`}>
                                {t('attendance.daily_roll_call')}
                            </h1>
                            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                {t('attendance.record_monitor')}
                            </p>
                        </motion.div>

                        <div className="flex flex-wrap items-center gap-4">
                            <LanguageSwitcher isDark={isDark} />
                            <button
                                onClick={toggleTheme}
                                className={`p-4 rounded-3xl border transition-all hover:scale-105 active:scale-95 ${isDark ? 'bg-slate-900/50 border-white/10 text-yellow-400' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}
                            >
                                {isDark ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            <button
                                onClick={() => saveAttendance()}
                                disabled={isSaving || students.length === 0}
                                className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest text-white transition-all shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 ${isSaving || students.length === 0 ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 ring-4 ring-blue-600/10'}`}
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={3} />}
                                {isSaving ? t('common.loading') : t('attendance.save_all')}
                            </button>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-8 rounded-[3rem] border backdrop-blur-xl mb-10 flex flex-col md:flex-row gap-6 items-end transition-all ${isDark ? 'bg-slate-900/30 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}
                    >
                        <div className="flex-1 w-full relative group">
                            <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-4 ${isDark ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'}`}>
                                <Users size={12} className="inline mr-2" /> {t('attendance.select_class')}
                            </label>
                            <select
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                className={`w-full pl-6 pr-4 py-5 rounded-2xl transition-all outline-none font-black text-sm uppercase italic tracking-tight ${isDark ? 'bg-slate-950/50 border-white/5 text-white focus:border-blue-500/50 focus:bg-slate-900' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white border'}`}
                            >
                                {["Nursery", "Prep", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(g => (
                                    <option key={g} value={g}>{isNaN(g) ? g : `Class ${g}`}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 w-full relative group">
                            <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-4 ${isDark ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'}`}>
                                <Clock size={12} className="inline mr-2" /> {t('attendance.attendance_date')}
                            </label>
                            <input
                                type="date"
                                value={date}
                                max={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setDate(e.target.value)}
                                style={{ colorScheme: isDark ? 'dark' : 'light' }}
                                className={`w-full pl-6 pr-4 py-5 rounded-2xl transition-all outline-none font-black text-sm ${isDark ? 'bg-slate-950/50 border-white/5 text-white focus:border-blue-500/50 focus:bg-slate-900' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white border'}`}
                            />
                        </div>

                        <div className="w-full md:w-auto">
                            <button
                                onClick={fetchStudents}
                                className={`w-full md:w-auto px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 ${isDark ? 'bg-white text-slate-900 hover:bg-blue-50' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
                            >
                                <Search size={16} strokeWidth={3} /> {t('attendance.load_roster')}
                            </button>
                        </div>
                    </motion.div>

                    {/* Bulk Actions */}
                    {students.length > 0 && (
                        <div className={`flex items-center gap-3 mb-6 p-4 rounded-3xl border ${isDark ? 'bg-slate-900/20 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest mr-4 ml-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{t('attendance.mark_everyone')}:</span>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => markAll('present')} className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>{t('attendance.present')}</button>
                                <button onClick={() => markAll('absent')} className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 border ${isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>{t('attendance.absent')}</button>
                                <button onClick={() => markAll('leave')} className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 border ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>{t('attendance.leave')}</button>
                                <button onClick={() => markAll('late')} className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 border ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>{t('attendance.late')}</button>
                                <button onClick={() => markAll('none')} className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 border ${isDark ? 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}>{t('attendance.reset')}</button>
                            </div>
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
                            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('attendance.no_students')}</h3>
                            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'} max-w-sm text-center`}>{t('attendance.record_monitor')}</p>
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
                                        className={`p-6 rounded-[2.5rem] border flex flex-col gap-6 transition-all duration-300 relative overflow-hidden group/card ${isDark ? 'bg-slate-900/30 border-white/5 hover:bg-slate-900/50 shadow-2xl' : 'bg-white border-slate-100 hover:shadow-2xl shadow-slate-200/40'}`}
                                    >
                                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl pointer-events-none transition-all group-hover/card:bg-blue-600/10" />

                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-2xl font-black text-slate-400 border-2 border-white/10 shadow-lg">
                                                {student.student_image ? (
                                                    <img src={`${BASE_URL}${student.student_image}`} className="w-full h-full object-cover transition-transform group-hover/card:scale-110" alt="Student" />
                                                ) : (
                                                    <span className="italic uppercase tracking-tighter">{student.student_name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className={`font-black text-lg italic tracking-tight uppercase truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.student_name}</h3>
                                                    {savingIds.has(student.student_id) ? (
                                                        <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-500/20">
                                                            <Loader2 size={10} className="animate-spin" /> {t('common.loading')}
                                                        </div>
                                                    ) : student.initialStatus !== 'none' && (
                                                        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                            <CheckCircle2 size={10} /> {t('attendance.marked') || 'Marked'}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>ID: {student.student_id?.toString().padStart(4, '0')}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 w-full relative z-10">
                                            {statusOptions.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => handleStatusChange(student.student_id, option.value)}
                                                    className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${student.status === option.value
                                                        ? `${isDark ? option.bgDark : option.bgLight} ${option.border} ${option.color} ring-4 ring-current/10 font-black`
                                                        : `${isDark ? 'bg-slate-800/40 border-slate-700/30 text-slate-600 hover:text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`
                                                        }`}
                                                >
                                                    <option.icon size={20} className="mb-2 transition-transform group-hover/status:scale-110" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{option.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Remarks Section */}
                                        <div className={`transition-all duration-500 relative z-10 ${student.status === 'present' || student.status === 'none' ? 'h-0 opacity-0 pointer-events-none' : 'opacity-100 mt-2'}`}>
                                            <div className="flex flex-col gap-3">
                                                <div className="h-px bg-gradient-to-r from-transparent via-slate-700/30 to-transparent mb-1" />
                                                <select
                                                    value={remarkOptions.includes(student.remarks) ? student.remarks : (student.remarks ? "Other" : "")}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        handleRemarksChange(student.student_id, val === "Other" ? "" : val);
                                                        if (val !== "Other") {
                                                            saveAttendance({
                                                                student_id: student.student_id,
                                                                status: student.status,
                                                                remarks: val
                                                            }, null, true);
                                                        }
                                                    }}
                                                    className={`w-full h-12 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none transition-all border italic ${isDark ? 'bg-slate-950/50 border-white/5 text-slate-400 focus:border-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500'}`}
                                                >
                                                    <option value="">Select Reason...</option>
                                                    {remarkOptions.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>

                                                {(student.remarks === "Other" || (!remarkOptions.includes(student.remarks) && student.remarks)) && (
                                                    <input
                                                        type="text"
                                                        placeholder="Custom remark..."
                                                        value={student.remarks}
                                                        onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                saveAttendance({
                                                                    student_id: student.student_id,
                                                                    status: student.status,
                                                                    remarks: student.remarks
                                                                }, null, true);
                                                            }
                                                        }}
                                                        className={`w-full h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none transition-all border italic ${isDark ? 'bg-slate-950/50 border-white/5 text-slate-400 focus:border-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500'}`}
                                                    />
                                                )}
                                            </div>
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
