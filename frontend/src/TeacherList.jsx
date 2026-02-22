import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Search, Plus, Phone, BookOpen, Banknote,
    Calendar, ChevronLeft, ChevronRight, GraduationCap,
    Sun, Moon, Loader2, SearchSlash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Sidebar } from './Dashboard';
import TeacherModal from './TeacherModal';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const BASE_URL = 'http://127.0.0.1:8000';

const TeacherList = () => {
    const { t } = useTranslation();
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

    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const pageSize = 10;
    const totalPages = Math.ceil(totalCount / pageSize);

    const fetchSubjects = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            const r = await axios.get(`${BASE_URL}/api/subjects/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubjects(r.data);
        } catch { }
    }, []);

    const fetchTeachers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const params = { page };
            if (search) params.search = search;
            if (selectedSubject) params.subject_id = selectedSubject;

            const r = await axios.get(`${BASE_URL}/api/teachers/`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setTeachers(r.data.results || []);
            setTotalCount(r.data.count || 0);
            setSummary(r.data.summary || {});
        } catch {
            toast.error(t('teacher.loading_error') || 'Teachers load nahi ho sake');
        } finally {
            setLoading(false);
        }
    }, [search, selectedSubject]);

    useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

    useEffect(() => {
        const t = setTimeout(() => {
            setCurrentPage(1);
            fetchTeachers(1);
        }, 400);
        return () => clearTimeout(t);
    }, [search, selectedSubject, fetchTeachers]);

    const getStatusBadge = (s) => {
        if (s === 'paid') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (s === 'pending') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        return 'bg-slate-700/50 text-slate-500 border-slate-700';
    };
    const getStatusLabel = (s) => {
        if (s === 'paid') return t('attendance.present'); // Present here acts as 'Paid/Present' or we can add specific ones
        if (s === 'pending') return t('dashboard.attention_needed');
        return t('attendance.reset');
    };

    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            <Sidebar isDark={isDark} />

            <main className="flex-1 overflow-y-auto relative custom-scrollbar">
                {/* Header */}
                <div className={`sticky top-0 z-10 p-8 ${isDark ? 'bg-slate-950/80' : 'bg-slate-50/80'} backdrop-blur-xl border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="bg-violet-600 p-4 rounded-3xl shadow-lg shadow-violet-500/20">
                                <GraduationCap className="text-white" size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tighter italic uppercase underline decoration-violet-500 decoration-4 underline-offset-8">
                                    {t('common.teachers')}
                                </h1>
                                <p className={`text-[10px] font-black uppercase tracking-widest mt-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {t('teacher.managing', { count: totalCount }) || `Managing ${totalCount} teachers`}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <LanguageSwitcher isDark={isDark} />
                            {/* Theme toggle */}
                            <button onClick={toggleTheme}
                                className={`p-4 rounded-3xl border transition-all hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-slate-900 text-yellow-400' : 'border-slate-200 bg-white text-slate-600 shadow-sm'}`}>
                                {isDark ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            {/* Add Teacher */}
                            <button onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-3 bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-violet-500/40 transition-all hover:scale-105 active:scale-95 ring-4 ring-violet-600/10">
                                <Plus size={16} strokeWidth={4} /> {t('teacher.add_teacher')}
                            </button>
                        </div>
                    </div>

                    {/* Summary pills */}
                    <div className="mt-6 flex flex-wrap gap-3">
                        <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-widest ${isDark ? 'bg-violet-600/10 border-violet-500/20 text-violet-400' : 'bg-violet-50 border-violet-200 text-violet-600'}`}>
                            <GraduationCap size={14} /> {summary.total_teachers || 0} {t('common.teachers')}
                        </div>
                        <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-widest ${isDark ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                            <Banknote size={14} /> Rs. {(summary.total_monthly_salary || 0).toLocaleString()} {t('teacher.monthly_bill')}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mt-6 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <Search className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-600 group-focus-within:text-violet-500' : 'text-slate-400 group-focus-within:text-violet-600'}`} size={20} />
                            <input
                                type="text" value={search}
                                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                                placeholder={t('teacher.search_placeholder')}
                                className={`w-full pl-16 pr-8 py-5 rounded-[2rem] border text-sm font-bold transition-all outline-none ${isDark ? 'bg-slate-900/50 border-white/5 focus:border-violet-500/50 text-white placeholder:text-slate-700' : 'bg-white border-slate-200 focus:border-violet-500 text-slate-900 shadow-sm'}`}
                            />
                        </div>
                        <select
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                            className={`px-6 py-5 rounded-[2rem] border text-sm font-bold outline-none transition-all ${isDark ? 'bg-slate-900/50 border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'}`}
                        >
                            <option value="">{t('teacher.all_subjects')}</option>
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-48 gap-8">
                                <Loader2 className="animate-spin text-violet-500" size={64} strokeWidth={3} />
                                <p className={`text-[11px] font-black uppercase tracking-[0.4em] animate-pulse ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{t('teacher.loading')}</p>
                            </motion.div>
                        ) : teachers.length === 0 ? (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                                className={`flex flex-col items-center justify-center py-48 rounded-[3.5rem] border-2 border-dashed ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-200 bg-slate-50'}`}>
                                <SearchSlash size={80} strokeWidth={1} className="text-slate-800 mb-8 opacity-20" />
                                <h3 className="text-2xl font-black mb-2 italic tracking-tighter uppercase text-slate-500">{t('teacher.no_teachers')}</h3>
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{t('teacher.try_adjusting')}</p>
                            </motion.div>
                        ) : (
                            <div className="relative group">
                                <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 transition-opacity duration-1000 ${isDark ? 'bg-violet-600/20' : 'bg-violet-400/10'} blur-[60px] pointer-events-none`} />

                                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                                    className={`relative z-0 rounded-[3.5rem] border overflow-hidden backdrop-blur-sm ${isDark ? 'bg-slate-900/30 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className={`${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'} border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                                    {[t('teacher.id'), t('common.teachers'), t('teacher.phone'), t('teacher.total_subjects'), t('teacher.salary'), t('teacher.hire_date'), 'Status'].map(h => (
                                                        <th key={h} className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {teachers.map((t, i) => (
                                                    <motion.tr
                                                        key={t.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.04 }}
                                                        onClick={() => navigate(`/teachers/${t.id}`)}
                                                        className={`group hover:bg-violet-600/[0.04] transition-all cursor-pointer`}
                                                    >
                                                        <td className="px-10 py-7">
                                                            <span className={`text-[12px] font-black font-mono transition-colors ${isDark ? 'text-slate-700 group-hover:text-violet-500' : 'text-slate-300 group-hover:text-violet-600'}`}>
                                                                #{t.id?.toString().padStart(4, '0')}
                                                            </span>
                                                        </td>
                                                        <td className="px-10 py-7">
                                                            <div className="flex items-center gap-5">
                                                                <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center font-black text-sm transition-all shadow-xl ${isDark ? 'bg-slate-800 text-violet-400 group-hover:bg-violet-600 group-hover:text-white group-hover:shadow-violet-500/40' : 'bg-slate-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white'}`}>
                                                                    {t.name ? t.name.charAt(0).toUpperCase() : '?'}
                                                                </div>
                                                                <span className="font-black text-base tracking-tight italic uppercase">{t.name || '—'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-7">
                                                            <div className="flex items-center gap-2 text-sm font-bold">
                                                                <Phone size={12} className="text-slate-500" />
                                                                {t.phone_number || '—'}
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-7">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {(t.subjects || []).length > 0
                                                                    ? t.subjects.map(s => (
                                                                        <span key={s.id} className="px-2.5 py-1 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                                                            {s.name}
                                                                        </span>
                                                                    ))
                                                                    : <span className="text-slate-600 text-xs italic">—</span>
                                                                }
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-7">
                                                            <div className="flex items-center gap-1.5 text-sm font-black">
                                                                <Banknote size={12} className="text-emerald-500" />
                                                                Rs. {t.salary ? parseFloat(t.salary).toLocaleString() : '—'}
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-7">
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                                <Calendar size={12} />
                                                                {t.date_joined || '—'}
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-7">
                                                            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(t.latest_salary_status)}`}>
                                                                {getStatusLabel(t.latest_salary_status)}
                                                            </span>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className={`px-10 py-8 border-t ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'} flex items-center justify-between`}>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                Page {currentPage} of {totalPages} — {totalCount} total
                                            </p>
                                            <div className="flex gap-2">
                                                <button disabled={currentPage === 1}
                                                    onClick={() => { setCurrentPage(p => p - 1); fetchTeachers(currentPage - 1); }}
                                                    className={`p-4 rounded-[1.25rem] border transition-all disabled:opacity-20 hover:scale-110 active:scale-95 ${isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white shadow-md'}`}>
                                                    <ChevronLeft size={18} strokeWidth={4} />
                                                </button>
                                                <button disabled={currentPage === totalPages}
                                                    onClick={() => { setCurrentPage(p => p + 1); fetchTeachers(currentPage + 1); }}
                                                    className={`p-4 rounded-[1.25rem] border transition-all disabled:opacity-20 hover:scale-110 active:scale-95 ${isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white shadow-md'}`}>
                                                    <ChevronRight size={18} strokeWidth={4} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <TeacherModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => fetchTeachers(currentPage)}
            />
        </div>
    );
};

export default TeacherList;
