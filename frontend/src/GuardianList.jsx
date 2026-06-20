import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Search, FileDown, Plus,
    ChevronLeft, ChevronRight, Loader2, UserCheck,
    Sun, Moon, ArrowUpRight, SearchSlash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Dashboard';
import GuardianModal from './GuardianModal';
import {
    shellCls, mainCls, headerCls, bodyCls, titleCls, subtitleCls,
    iconBoxCls, iconBtnCls, btnSecondaryCls, btnPrimaryCls,
    searchWrapCls, searchInputCls, tableShellCls, tableHeadRowCls,
    tableThCls, tableTdCls, tableRowCls, avatarCls, paginationBarCls,
    pageBtnCls, navBtnCls, emptyStateCls, loadingStateCls,
} from './components/layout/layoutClasses';

const GuardianList = () => {
    const navigate = useNavigate();
    const [guardians, setGuardians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [exporting, setExporting] = useState(false);

    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('dashboardTheme');
        return saved !== 'light';
    });
    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        localStorage.setItem('dashboardTheme', next ? 'dark' : 'light');
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGuardian, setEditingGuardian] = useState(null);

    const fetchGuardians = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const params = new URLSearchParams({
                page: currentPage,
                ...(searchTerm && { search: searchTerm }),
            });

            const response = await axios.get(`/api/guardian/?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.results) {
                setGuardians(response.data.results);
                setTotalCount(response.data.count);
            }
        } catch (err) {
            console.error("Error fetching guardians:", err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm]);

    useEffect(() => {
        fetchGuardians();
    }, [fetchGuardians]);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const exportToPDF = () => {
        setExporting(true);
        const doc = new jsPDF();
        doc.text("Guardian List", 14, 15);
        autoTable(doc, {
            head: [['ID', 'Name', 'CNIC', 'Phone Number', 'Address']],
            body: guardians.map((g) => [
                g.id,
                g.name,
                g.cnic,
                g.phone_number,
                g.address
            ]),
            startY: 20,
        });
        doc.save('guardian-list.pdf');
        setExporting(false);
    };

    const handleAddGuardian = () => {
        setEditingGuardian(null);
        setIsModalOpen(true);
    };

    const handleEditGuardian = (e, guardian) => {
        e.stopPropagation();
        setEditingGuardian(guardian);
        setIsModalOpen(true);
    };

    return (
        <div className={shellCls(isDark)}>
            <Sidebar isDark={isDark} />

            <main className={mainCls}>
                <div className={headerCls(isDark)}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={iconBoxCls('blue')}>
                                <UserCheck className="text-white" size={18} />
                            </div>
                            <div className="min-w-0">
                                <h1 className={titleCls(isDark)}>Guardian Records</h1>
                                <p className={subtitleCls(isDark)}>
                                    Managing {totalCount} guardian records
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button onClick={toggleTheme} className={iconBtnCls(isDark)}>
                                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                            </button>
                            <button
                                onClick={exportToPDF}
                                disabled={exporting || guardians.length === 0}
                                className={btnSecondaryCls(isDark)}
                            >
                                {exporting ? <Loader2 className="animate-spin" size={14} /> : <FileDown size={14} />}
                                Export PDF
                            </button>
                            <button onClick={handleAddGuardian} className={btnPrimaryCls('blue')}>
                                <Plus size={14} strokeWidth={3} />
                                Add Guardian
                            </button>
                        </div>
                    </div>

                    <div className="mt-3">
                        <div className={searchWrapCls}>
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={16} />
                            <input
                                type="text"
                                placeholder="Search by name, CNIC, or phone..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className={searchInputCls(isDark, 'blue')}
                            />
                        </div>
                    </div>
                </div>

                <div className={bodyCls}>
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={loadingStateCls}>
                                <Loader2 className="animate-spin text-blue-500" size={36} strokeWidth={2.5} />
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Loading guardians...</p>
                            </motion.div>
                        ) : guardians.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={emptyStateCls(isDark)}>
                                <SearchSlash size={40} strokeWidth={1.5} className="text-slate-500 mb-3 opacity-40" />
                                <h3 className="text-base font-bold mb-1 text-slate-500">No Guardians Found</h3>
                                <p className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>No guardians match your search</p>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={tableShellCls(isDark)}>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[640px]">
                                        <thead>
                                            <tr className={tableHeadRowCls(isDark)}>
                                                <th className={tableThCls}>ID</th>
                                                <th className={tableThCls}>Guardian Name</th>
                                                <th className={tableThCls}>CNIC Number</th>
                                                <th className={tableThCls}>Phone Number</th>
                                                <th className={`${tableThCls} text-center`}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                                            {guardians.map((guardian) => (
                                                <tr
                                                    key={guardian.id}
                                                    className={tableRowCls}
                                                    onClick={() => navigate(`/guardians/${guardian.id}`)}
                                                >
                                                    <td className={tableTdCls}>
                                                        <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-600'}`}>
                                                            #{guardian.id.toString().padStart(4, '0')}
                                                        </span>
                                                    </td>
                                                    <td className={tableTdCls}>
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className={avatarCls(isDark)}>
                                                                {guardian.name ? guardian.name.charAt(0) : '?'}
                                                            </div>
                                                            <span className="font-semibold text-sm truncate">{guardian.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className={tableTdCls}>
                                                        <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{guardian.cnic}</span>
                                                    </td>
                                                    <td className={tableTdCls}>
                                                        <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{guardian.phone_number}</span>
                                                    </td>
                                                    <td className={tableTdCls}>
                                                        <div className="flex justify-center">
                                                            <button
                                                                onClick={(e) => handleEditGuardian(e, guardian)}
                                                                className={`p-1.5 rounded-md transition-colors ${isDark ? 'bg-white/5 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-slate-100 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                                                            >
                                                                <ArrowUpRight size={16} strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className={paginationBarCls(isDark)}>
                                    <p className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className={navBtnCls(isDark)}
                                        >
                                            <ChevronLeft size={16} strokeWidth={2.5} />
                                        </button>

                                        <div className="flex gap-1">
                                            {[...Array(totalPages)].map((_, i) => {
                                                const pageNum = i + 1;
                                                const isCurrent = currentPage === pageNum;
                                                if (totalPages > 5 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                                                    if (pageNum === 2 || pageNum === totalPages - 1) return <span key={i} className="px-1 text-slate-500">…</span>;
                                                    return null;
                                                }
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={pageBtnCls(isDark, isCurrent)}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className={navBtnCls(isDark)}
                                        >
                                            <ChevronRight size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <GuardianModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchGuardians}
                guardianToEdit={editingGuardian}
            />
        </div>
    );
};

export default GuardianList;
