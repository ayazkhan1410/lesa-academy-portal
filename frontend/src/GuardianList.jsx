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

const GuardianList = () => {
    const navigate = useNavigate();
    const [guardians, setGuardians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [exporting, setExporting] = useState(false);

    // Theme
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('dashboardTheme');
        return saved !== 'light';
    });
    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        localStorage.setItem('dashboardTheme', next ? 'dark' : 'light');
    };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 10;

    // Modals
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

            const response = await axios.get(`http://127.0.0.1:8000/api/guardian/?${params.toString()}`, {
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
        <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            <Sidebar isDark={isDark} />

            <main className="flex-1 overflow-y-auto relative custom-scrollbar">
                {/* Header Section */}
                <div className={`sticky top-0 z-10 p-8 ${isDark ? 'bg-slate-950/80' : 'bg-slate-50/80'} backdrop-blur-xl border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-500/20">
                                <UserCheck className="text-white" size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight tracking-tighter italic uppercase underline decoration-blue-500 decoration-4 underline-offset-8">Guardian Records</h1>
                                <p className={`text-[10px] font-black uppercase tracking-widest mt-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Managing {totalCount} guardian records
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                onClick={toggleTheme}
                                className={`p-4 rounded-3xl border transition-all hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-slate-900 text-yellow-400' : 'border-slate-200 bg-white text-slate-600 shadow-sm'}`}
                            >
                                {isDark ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            <button
                                onClick={exportToPDF}
                                disabled={exporting || guardians.length === 0}
                                className={`flex items-center gap-3 px-6 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 border ${isDark ? 'bg-slate-900 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 shadow-sm'}`}
                            >
                                {exporting ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />}
                                Export PDF
                            </button>

                            <button
                                onClick={handleAddGuardian}
                                className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/40 transition-all hover:scale-105 active:scale-95 ring-4 ring-blue-600/10"
                            >
                                <Plus size={16} strokeWidth={4} />
                                Add Guardian
                            </button>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="mt-12 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <Search className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-600 group-focus-within:text-blue-500' : 'text-slate-400 group-focus-within:text-blue-600'}`} size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, CNIC, or phone..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className={`w-full pl-16 pr-8 py-5 rounded-[2rem] border text-sm font-bold transition-all outline-none ${isDark ? 'bg-slate-900/50 border-white/5 focus:border-blue-500/50 focus:bg-slate-900 text-white placeholder:text-slate-700' : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 text-slate-900 shadow-sm'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-48 gap-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse" />
                                    <Loader2 className="animate-spin text-blue-500 relative" size={64} strokeWidth={3} />
                                </div>
                                <p className={`text-[11px] font-black uppercase tracking-[0.4em] animate-pulse ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Loading guardians...</p>
                            </motion.div>
                        ) : guardians.length === 0 ? (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`flex flex-col items-center justify-center py-48 rounded-[3.5rem] border-2 border-dashed ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-200 bg-slate-50'}`}>
                                <SearchSlash size={80} strokeWidth={1} className="text-slate-800 mb-8 opacity-20" />
                                <h3 className="text-2xl font-black mb-2 italic tracking-tighter uppercase text-slate-500">No Guardians Found</h3>
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>No guardians found matching your search</p>
                            </motion.div>
                        ) : (
                            <div className="relative group">
                                {/* Bottom Lighting Effect */}
                                <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 transition-opacity duration-1000 ${isDark ? 'bg-blue-600/20' : 'bg-blue-400/10'} blur-[60px] pointer-events-none`} />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent blur-[1px] z-10" />

                                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className={`relative z-0 rounded-[3.5rem] border overflow-hidden backdrop-blur-sm ${isDark ? 'bg-slate-900/30 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
                                    <div className="overflow-x-auto overflow-y-hidden">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className={`${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'} border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">ID</th>
                                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Guardian Name</th>
                                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">CNIC Number</th>
                                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Phone Number</th>
                                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {guardians.map((guardian, index) => (
                                                    <motion.tr
                                                        key={guardian.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.04 }}
                                                        className="group hover:bg-blue-600/[0.04] transition-all cursor-pointer"
                                                        onClick={() => navigate(`/guardians/${guardian.id}`)}
                                                    >
                                                        <td className="px-10 py-7">
                                                            <span className={`text-[12px] font-black font-mono transition-colors ${isDark ? 'text-slate-700 group-hover:text-blue-500' : 'text-slate-300 group-hover:text-blue-600'}`}>
                                                                #{guardian.id.toString().padStart(4, '0')}
                                                            </span>
                                                        </td>
                                                        <td className="px-10 py-7">
                                                            <div className="flex items-center gap-5">
                                                                <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center font-black text-sm transition-all shadow-xl ${isDark ? 'bg-slate-800 text-blue-400 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-blue-500/40' : 'bg-slate-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-blue-500/30'}`}>
                                                                    {guardian.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <span className="font-black text-base tracking-tight italic uppercase block">{guardian.name}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-7">
                                                            <span className={`text-xs font-black font-mono tracking-widest transition-colors ${isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-900'}`}>{guardian.cnic}</span>
                                                        </td>
                                                        <td className="px-10 py-7">
                                                            <div className="flex flex-col">
                                                                <span className={`text-xs font-black transition-colors ${isDark ? 'text-slate-300' : 'text-slate-700 underline underline-offset-4 decoration-blue-500/30'}`}>{guardian.phone_number}</span>
                                                                <span className={`text-[10px] font-black uppercase tracking-widest opacity-40`}>Mobile</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-7">
                                                            <div className="flex justify-center">
                                                                <button
                                                                    onClick={(e) => handleEditGuardian(e, guardian)}
                                                                    className={`p-3.5 rounded-2xl transition-all hover:scale-110 active:scale-90 ${isDark ? 'bg-white/5 text-blue-400 hover:bg-blue-500 hover:text-white hover:shadow-lg hover:shadow-blue-500/20' : 'bg-slate-100 text-blue-600 hover:bg-blue-600 hover:text-white shadow-sm'}`}
                                                                >
                                                                    <ArrowUpRight size={20} strokeWidth={4} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className={`px-10 py-8 border-t ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'} flex flex-col lg:flex-row items-center justify-between gap-8`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                            <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                Showing <span className={isDark ? 'text-white' : 'text-slate-900'}>{(currentPage - 1) * itemsPerPage + 1}</span> — <span className={isDark ? 'text-white' : 'text-slate-900'}>{Math.min(currentPage * itemsPerPage, totalCount)}</span> / Total {totalCount}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className={`p-4 rounded-[1.25rem] border transition-all disabled:opacity-20 disabled:hover:scale-100 hover:scale-110 active:scale-95 ${isDark ? 'border-white/10 bg-slate-950 hover:bg-slate-900' : 'border-slate-200 bg-white shadow-md hover:border-slate-400'}`}
                                            >
                                                <ChevronLeft size={18} strokeWidth={4} />
                                            </button>

                                            <div className="flex gap-2.5">
                                                {[...Array(totalPages)].map((_, i) => {
                                                    const pageNum = i + 1;
                                                    const isCurrent = currentPage === pageNum;
                                                    if (totalPages > 5 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                                                        if (pageNum === 2 || pageNum === totalPages - 1) return <span key={i} className="px-2 self-end pb-3 opacity-20 font-black">•••</span>;
                                                        return null;
                                                    }
                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => setCurrentPage(pageNum)}
                                                            className={`min-w-[48px] h-12 rounded-[1.25rem] font-black text-[11px] transition-all hover:scale-110 active:scale-95 ${isCurrent ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/40' : isDark ? 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10' : 'bg-white text-slate-400 border border-slate-200 shadow-sm hover:border-slate-400 hover:text-slate-900'}`}
                                                        >
                                                            {pageNum.toString().padStart(2, '0')}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                                className={`p-4 rounded-[1.25rem] border transition-all disabled:opacity-20 disabled:hover:scale-100 hover:scale-110 active:scale-95 ${isDark ? 'border-white/10 bg-slate-950 hover:bg-slate-900' : 'border-slate-200 bg-white shadow-md hover:border-slate-400'}`}
                                            >
                                                <ChevronRight size={18} strokeWidth={4} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
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
