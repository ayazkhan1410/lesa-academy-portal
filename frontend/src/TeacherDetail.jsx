import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    User, Phone, BookOpen, DollarSign,
    Calendar, Edit, Trash2, BadgeCheck, Clock, AlertCircle,
    Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Sidebar } from './Dashboard';
import TeacherModal from './TeacherModal';
import SalaryModal from './SalaryModal';

const BASE_URL = 'http://127.0.0.1:8000';

const InfoField = ({ label, value, icon: Icon, isDark }) => (
    <div className={`border rounded-2xl p-5 ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-2 mb-2">
            {Icon && <Icon size={12} className="text-slate-500" />}
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        </div>
        <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{value || '—'}</p>
    </div>
);

const TeacherDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('dashboardTheme');
        return saved !== 'light';
    });
    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        localStorage.setItem('dashboardTheme', next ? 'dark' : 'light');
    };

    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchTeacher = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const r = await axios.get(`${BASE_URL}/api/teachers/${id}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeacher(r.data);
        } catch {
            toast.error('Teacher data load nahi ho saka');
            navigate('/teachers');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => { fetchTeacher(); }, [fetchTeacher]);

    const handleDelete = async () => {
        if (!window.confirm(`"${teacher.name}" ko delete karna chahte hain?`)) return;
        setDeleting(true);
        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`${BASE_URL}/api/teachers/${id}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Teacher deleted!');
            navigate('/teachers');
        } catch {
            toast.error('Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className={`flex h-screen overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <Sidebar isDark={isDark} />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-slate-400 font-bold italic animate-pulse text-xl">Loading...</p>
                </div>
            </div>
        );
    }
    if (!teacher) return null;

    const salaryStatus = teacher.latest_salary_status;
    const statusBadge = salaryStatus === 'paid'
        ? { bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', label: 'Paid This Month', icon: BadgeCheck }
        : salaryStatus === 'pending'
            ? { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', label: 'Salary Pending', icon: Clock }
            : { bg: 'bg-slate-700/50 border-slate-700 text-slate-500', label: 'No Payment Yet', icon: AlertCircle };

    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            <Sidebar isDark={isDark} />

            <main className="flex-1 overflow-y-auto relative custom-scrollbar">
                {/* Header */}
                <div className={`sticky top-0 z-10 p-8 ${isDark ? 'bg-slate-950/80' : 'bg-slate-50/80'} backdrop-blur-xl border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                        <button onClick={() => navigate('/teachers')}
                            className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}>
                            ← Back to Teachers
                        </button>
                        <button onClick={toggleTheme}
                            className={`p-3 rounded-2xl border transition-all ${isDark ? 'border-white/10 bg-slate-900 text-yellow-400' : 'border-slate-200 bg-white text-slate-600 shadow-sm'}`}>
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </div>

                <div className="p-8 max-w-5xl">
                    {/* Hero Card */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        className={`relative overflow-hidden rounded-[2.5rem] border p-8 mb-6 ${isDark ? 'bg-violet-600/5 border-violet-500/10' : 'bg-violet-50 border-violet-200'}`}>
                        <div className="absolute -top-16 -right-16 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-violet-800 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-violet-900/50 shrink-0">
                                    {teacher.name ? teacher.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                    <h1 className={`text-3xl font-black italic tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                        {teacher.name || '—'}
                                    </h1>
                                    <p className={`font-bold text-sm mt-1 flex items-center gap-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        <Phone size={12} /> {teacher.phone_number || 'No phone'}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {(teacher.subjects || []).map(s => (
                                            <span key={s.id} className="px-2.5 py-1 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                                {s.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <span className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusBadge.bg}`}>
                                    <statusBadge.icon size={12} /> {statusBadge.label}
                                </span>
                                <button onClick={() => setIsEditModalOpen(true)}
                                    className={`p-2.5 rounded-xl border transition-all ${isDark ? 'bg-slate-800 hover:bg-violet-600/20 text-slate-400 hover:text-violet-300 border-white/5' : 'bg-white hover:bg-violet-50 text-slate-400 hover:text-violet-600 border-slate-200 shadow-sm'}`}>
                                    <Edit size={16} />
                                </button>
                                <button onClick={handleDelete} disabled={deleting}
                                    className={`p-2.5 rounded-xl border transition-all disabled:opacity-50 ${isDark ? 'bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 border-white/5' : 'bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border-slate-200 shadow-sm'}`}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Tabs */}
                    <div className={`flex gap-2 mb-6 p-1.5 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                        {['overview', 'salary'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                        : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                                    }`}>
                                {tab === 'overview' ? '📋 Overview' : '💰 Salary'}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Overview */}
                        {activeTab === 'overview' && (
                            <motion.div key="overview"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="space-y-6">

                                {/* Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Monthly Salary', value: `Rs. ${teacher.salary ? parseFloat(teacher.salary).toLocaleString() : '—'}`, icon: DollarSign, color: 'emerald' },
                                        { label: 'Total Paid', value: `Rs. ${parseFloat(teacher.total_salary_paid || 0).toLocaleString()}`, icon: DollarSign, color: 'violet' },
                                        { label: 'Subjects', value: (teacher.subjects || []).length, icon: BookOpen, color: 'blue' },
                                    ].map(c => (
                                        <div key={c.label} className={`${isDark ? `bg-${c.color}-600/5 border-${c.color}-500/10` : `bg-${c.color}-50 border-${c.color}-200`} border rounded-2xl p-6 flex items-center gap-4`}>
                                            <div className={`bg-${c.color}-600/20 p-3 rounded-2xl text-${c.color}-400`}><c.icon size={22} /></div>
                                            <div>
                                                <p className={`text-[9px] font-black text-${c.color}-400 uppercase tracking-widest mb-1`}>{c.label}</p>
                                                <p className={`text-2xl font-black italic ${isDark ? 'text-white' : 'text-slate-800'}`}>{c.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Details */}
                                <section>
                                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Details</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <InfoField label="Full Name" value={teacher.name} icon={User} isDark={isDark} />
                                        <InfoField label="Phone" value={teacher.phone_number} icon={Phone} isDark={isDark} />
                                        <InfoField label="Date Joined" value={teacher.date_joined} icon={Calendar} isDark={isDark} />
                                        <InfoField label="Monthly Salary" value={teacher.salary ? `Rs. ${parseFloat(teacher.salary).toLocaleString()}` : '—'} icon={DollarSign} isDark={isDark} />
                                    </div>
                                </section>

                                {(teacher.subjects || []).length > 0 && (
                                    <section>
                                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Subjects</h2>
                                        <div className="flex flex-wrap gap-2">
                                            {teacher.subjects.map(s => (
                                                <span key={s.id} className={`px-4 py-2 border rounded-2xl text-xs font-black uppercase tracking-widest ${isDark ? 'bg-blue-600/10 text-blue-300 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                                    <BookOpen size={12} className="inline mr-1.5" />{s.name}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </motion.div>
                        )}

                        {/* Salary */}
                        {activeTab === 'salary' && (
                            <motion.div key="salary"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="space-y-5">

                                <div className="flex items-center justify-between">
                                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Salary Payment History</h2>
                                    <button onClick={() => setIsSalaryModalOpen(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all">
                                        <DollarSign size={14} /> Post Salary
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`border rounded-2xl p-5 text-center ${isDark ? 'bg-emerald-600/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-200'}`}>
                                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Paid</p>
                                        <p className={`text-2xl font-black italic ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                            Rs. {parseFloat(teacher.total_salary_paid || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className={`border rounded-2xl p-5 text-center ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Payments Count</p>
                                        <p className={`text-2xl font-black italic ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                            {(teacher.salary_payments || []).length}
                                        </p>
                                    </div>
                                </div>

                                <div className={`border rounded-[2rem] overflow-hidden ${isDark ? 'bg-slate-900/30 border-white/5' : 'bg-white border-slate-200 shadow-md'}`}>
                                    {(teacher.salary_payments || []).length === 0 ? (
                                        <div className="py-16 text-center text-slate-500 font-bold italic">No salary payments yet</div>
                                    ) : (
                                        <table className="w-full">
                                            <thead>
                                                <tr className={`border-b text-[9px] font-black uppercase tracking-widest text-slate-500 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                                                    <th className="text-left px-8 py-5">#</th>
                                                    <th className="text-left px-8 py-5">Month</th>
                                                    <th className="text-left px-8 py-5">Amount</th>
                                                    <th className="text-left px-8 py-5">Paid On</th>
                                                    <th className="text-right px-8 py-5">Slip</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {teacher.salary_payments.map((p, i) => (
                                                    <motion.tr key={p.id}
                                                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.04 }}
                                                        className={`transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                                        <td className="px-8 py-5 text-slate-600 text-xs font-bold">{i + 1}</td>
                                                        <td className={`px-8 py-5 font-black text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                                            {p.month ? new Date(p.month).toLocaleDateString('en', { year: 'numeric', month: 'long' }) : '—'}
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <span className="text-emerald-500 font-black text-sm">
                                                                Rs. {parseFloat(p.amount || 0).toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td className={`px-8 py-5 text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{p.paid_on || '—'}</td>
                                                        <td className="px-8 py-5 text-right">
                                                            {p.salary_slip ? (
                                                                <a href={p.salary_slip} target="_blank" rel="noreferrer"
                                                                    className="text-violet-400 text-xs font-black uppercase tracking-widest hover:text-violet-300 underline">
                                                                    View
                                                                </a>
                                                            ) : <span className="text-slate-600 text-xs italic">—</span>}
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <TeacherModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                teacher={teacher}
                onSuccess={fetchTeacher}
            />
            <SalaryModal
                isOpen={isSalaryModalOpen}
                onClose={() => setIsSalaryModalOpen(false)}
                teacherId={id}
                teacherName={teacher.name}
                monthlySalary={teacher.salary}
                onSuccess={fetchTeacher}
            />
        </div>
    );
};

export default TeacherDetail;
