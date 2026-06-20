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
import {
    shellCls, mainCls, headerCls, bodyCls, titleCls, subtitleCls,
    iconBoxCls, iconBtnCls, btnPrimaryCls, searchWrapCls, searchInputCls, selectCls,
    tableShellCls, tableHeadRowCls, tableThCls, tableTdCls, avatarCls,
    paginationBarCls, navBtnCls, emptyStateCls, loadingStateCls,
} from './components/layout/layoutClasses';

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
        <div className={shellCls(isDark)}>
            <Sidebar isDark={isDark} />

            <main className={mainCls}>
                <div className={headerCls(isDark)}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={iconBoxCls('violet')}>
                                <GraduationCap className="text-white" size={18} />
                            </div>
                            <div className="min-w-0">
                                <h1 className={titleCls(isDark)}>{t('common.teachers')}</h1>
                                <p className={subtitleCls(isDark)}>
                                    {t('teacher.managing', { count: totalCount }) || `Managing ${totalCount} teachers`}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <LanguageSwitcher isDark={isDark} />
                            <button onClick={toggleTheme} className={iconBtnCls(isDark)}>
                                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                            </button>
                            <button onClick={() => setIsModalOpen(true)} className={btnPrimaryCls('violet')}>
                                <Plus size={14} strokeWidth={3} /> {t('teacher.add_teacher')}
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wide ${isDark ? 'bg-violet-600/10 border-violet-500/20 text-violet-400' : 'bg-violet-50 border-violet-200 text-violet-600'}`}>
                            <GraduationCap size={12} /> {summary.total_teachers || 0} {t('common.teachers')}
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wide ${isDark ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                            <Banknote size={12} /> Rs. {(summary.total_monthly_salary || 0).toLocaleString()} {t('teacher.monthly_bill')}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <div className={searchWrapCls}>
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={16} />
                            <input
                                type="text" value={search}
                                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                                placeholder={t('teacher.search_placeholder')}
                                className={searchInputCls(isDark, 'violet')}
                            />
                        </div>
                        <select
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                            className={selectCls(isDark)}
                        >
                            <option value="">{t('teacher.all_subjects')}</option>
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={bodyCls}>
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={loadingStateCls}>
                                <Loader2 className="animate-spin text-violet-500" size={36} strokeWidth={2.5} />
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{t('teacher.loading')}</p>
                            </motion.div>
                        ) : teachers.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={emptyStateCls(isDark)}>
                                <SearchSlash size={40} strokeWidth={1.5} className="text-slate-500 mb-3 opacity-40" />
                                <h3 className="text-base font-bold mb-1 text-slate-500">{t('teacher.no_teachers')}</h3>
                                <p className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{t('teacher.try_adjusting')}</p>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={tableShellCls(isDark)}>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[900px]">
                                            <thead>
                                                <tr className={tableHeadRowCls(isDark)}>
                                                    {[t('teacher.id'), t('common.teachers'), t('teacher.phone'), t('teacher.total_subjects'), t('teacher.salary'), t('teacher.hire_date'), 'Status'].map(h => (
                                                        <th key={h} className={tableThCls}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                                                {teachers.map((t, i) => (
                                                    <motion.tr
                                                        key={t.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.02 }}
                                                        onClick={() => navigate(`/teachers/${t.id}`)}
                                                        className="group hover:bg-violet-600/[0.04] transition-colors cursor-pointer"
                                                    >
                                                        <td className={tableTdCls}>
                                                            <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-500 group-hover:text-violet-400' : 'text-slate-400 group-hover:text-violet-600'}`}>
                                                                #{t.id?.toString().padStart(4, '0')}
                                                            </span>
                                                        </td>
                                                        <td className={tableTdCls}>
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className={`${avatarCls(isDark)} !text-violet-400 group-hover:!bg-violet-600 group-hover:!text-white`}>
                                                                    {t.name ? t.name.charAt(0).toUpperCase() : '?'}
                                                                </div>
                                                                <span className="font-semibold text-sm truncate">{t.name || '—'}</span>
                                                            </div>
                                                        </td>
                                                        <td className={tableTdCls}>
                                                            <div className="flex items-center gap-1.5 text-xs font-medium">
                                                                <Phone size={12} className="text-slate-500 shrink-0" />
                                                                {t.phone_number || '—'}
                                                            </div>
                                                        </td>
                                                        <td className={tableTdCls}>
                                                            <div className="flex flex-wrap gap-1">
                                                                {(t.subjects || []).length > 0
                                                                    ? t.subjects.map(s => (
                                                                        <span key={s.id} className="px-2 py-0.5 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded text-[9px] font-bold uppercase">
                                                                            {s.name}
                                                                        </span>
                                                                    ))
                                                                    : <span className="text-slate-500 text-xs">—</span>
                                                                }
                                                            </div>
                                                        </td>
                                                        <td className={tableTdCls}>
                                                            <div className="flex items-center gap-1 text-xs font-semibold">
                                                                <Banknote size={12} className="text-emerald-500 shrink-0" />
                                                                Rs. {t.salary ? parseFloat(t.salary).toLocaleString() : '—'}
                                                            </div>
                                                        </td>
                                                        <td className={tableTdCls}>
                                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                                <Calendar size={12} className="shrink-0" />
                                                                {t.date_joined || '—'}
                                                            </div>
                                                        </td>
                                                        <td className={tableTdCls}>
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusBadge(t.latest_salary_status)}`}>
                                                                {getStatusLabel(t.latest_salary_status)}
                                                            </span>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {totalPages > 1 && (
                                        <div className={paginationBarCls(isDark)}>
                                            <p className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                Page {currentPage} of {totalPages} — {totalCount} total
                                            </p>
                                            <div className="flex gap-2">
                                                <button disabled={currentPage === 1}
                                                    onClick={() => { setCurrentPage(p => p - 1); fetchTeachers(currentPage - 1); }}
                                                    className={navBtnCls(isDark)}>
                                                    <ChevronLeft size={16} strokeWidth={2.5} />
                                                </button>
                                                <button disabled={currentPage === totalPages}
                                                    onClick={() => { setCurrentPage(p => p + 1); fetchTeachers(currentPage + 1); }}
                                                    className={navBtnCls(isDark)}>
                                                    <ChevronRight size={16} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                            </motion.div>
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
