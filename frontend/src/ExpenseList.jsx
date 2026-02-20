import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Search, FileDown, Plus,
    ChevronLeft, ChevronRight, Loader2, Wallet,
    Sun, Moon, ArrowUpRight, SearchSlash,
    Calendar, CreditCard, Filter, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Dashboard';
import ExpenseModal from './ExpenseModal';
import toast from 'react-hot-toast';

const ExpenseList = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortField, setSortField] = useState('-created_at');
    const [exporting, setExporting] = useState(false);

    // Theme
    const [isDark] = useState(() => {
        const saved = localStorage.getItem('dashboardTheme');
        return saved !== 'light';
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 10;

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const params = new URLSearchParams({
                page: currentPage,
                ...(searchTerm && { search: searchTerm }),
                ...(categoryFilter && { category: categoryFilter }),
                ...(statusFilter && { status: statusFilter }),
                ...(sortField && { sort: sortField }),
            });

            const response = await axios.get(`http://127.0.0.1:8000/api/expenses/?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.results) {
                setExpenses(response.data.results);
                setTotalCount(response.data.count);
            }
        } catch (err) {
            console.error("Error fetching expenses:", err);
            toast.error("Failed to sync expense records");
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, categoryFilter, statusFilter, sortField]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const exportToPDF = () => {
        setExporting(true);
        const doc = new jsPDF();
        doc.text("Academy Expense Ledger", 14, 15);
        autoTable(doc, {
            head: [['ID', 'Title', 'Category', 'Amount', 'Date', 'Status']],
            body: expenses.map((e) => [
                e.id,
                e.title,
                e.category_display || e.category,
                `Rs. ${e.amount}`,
                e.expense_date,
                e.status.toUpperCase()
            ]),
            startY: 20,
        });
        doc.save(`expense-report-${new Date().toISOString().split('T')[0]}.pdf`);
        setExporting(false);
    };

    const handleAddExpense = () => {
        setEditingExpense(null);
        setIsModalOpen(true);
    };

    const handleEditExpense = (expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm("Delete this expense record? This action is permanent.")) return;

        const toastId = toast.loading("Deleting record...");
        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`http://127.0.0.1:8000/api/expenses/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Record deleted successfully", { id: toastId });
            fetchExpenses();
        } catch (error) {
            toast.error("Failed to delete record", { id: toastId });
        }
    };

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortField(`-${field}`);
        } else {
            setSortField(field);
        }
        setCurrentPage(1);
    };

    return (
        <div className={`flex h-screen w-full max-w-full overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            <Sidebar isDark={isDark} />

            <main className="flex-1 min-w-0 h-full overflow-x-hidden overflow-y-auto relative custom-scrollbar">
                {/* Amber Glow Effects for Expenses */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className={`absolute top-[-10%] right-[-5%] w-[40%] h-[40%] blur-[120px] rounded-full opacity-10 ${isDark ? 'bg-amber-600' : 'bg-amber-400'}`} />
                </div>

                {/* Header Section */}
                <div className={`sticky top-0 z-10 p-8 ${isDark ? 'bg-slate-950/80' : 'bg-slate-50/80'} backdrop-blur-xl border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                    <div className="max-w-[1440px] mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="bg-amber-600 p-4 rounded-3xl shadow-lg shadow-amber-500/20">
                                    <Wallet className="text-white" size={32} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tighter italic uppercase underline decoration-amber-500 decoration-4 underline-offset-8">Expense Ledger</h1>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Tracking {totalCount} academy expenses
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <button
                                    onClick={exportToPDF}
                                    disabled={exporting || expenses.length === 0}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 border ${isDark ? 'bg-slate-900 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 shadow-sm'}`}
                                >
                                    {exporting ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />}
                                    Export PDF
                                </button>

                                <button
                                    onClick={handleAddExpense}
                                    className="flex items-center gap-3 bg-amber-600 hover:bg-amber-500 text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/40 transition-all hover:scale-105 active:scale-95 ring-4 ring-amber-600/10"
                                >
                                    <Plus size={16} strokeWidth={4} />
                                    Add Expense
                                </button>
                            </div>
                        </div>

                        {/* Filters & Search */}
                        <div className="mt-12 flex flex-col lg:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <Search className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-600 group-focus-within:text-amber-500' : 'text-slate-400 group-focus-within:text-amber-600'}`} size={20} />
                                <input
                                    type="text"
                                    placeholder="Search expenses..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className={`w-full pl-16 pr-8 py-5 rounded-[2rem] border text-sm font-bold transition-all outline-none ${isDark ? 'bg-slate-900/50 border-white/5 focus:border-amber-500/50 focus:bg-slate-900 text-white placeholder:text-slate-700' : 'bg-white border-slate-200 focus:border-amber-500 focus:ring-8 focus:ring-amber-500/5 text-slate-900 shadow-sm'}`}
                                />
                            </div>

                            <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0">
                                <div className="relative shrink-0">
                                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                                        className={`pl-10 pr-8 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest outline-none transition-all appearance-none ${isDark ? 'bg-slate-900 border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}
                                    >
                                        <option value="">All Categories</option>
                                        <option value="salary">Salary</option>
                                        <option value="rent">Rent</option>
                                        <option value="utilities">Utilities</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="relative shrink-0">
                                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                        className={`pl-10 pr-8 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest outline-none transition-all appearance-none ${isDark ? 'bg-slate-900 border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="paid">Paid</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                            <StatCard
                                label="Monthly Expenses"
                                value={`Rs. ${expenses.reduce((acc, curr) => acc + (curr.status === 'paid' ? parseFloat(curr.amount) : 0), 0).toLocaleString()}`}
                                icon={<Activity size={16} />}
                                color="amber"
                                isDark={isDark}
                            />
                            <StatCard
                                label="Pending"
                                value={`Rs. ${expenses.reduce((acc, curr) => acc + (curr.status === 'pending' ? parseFloat(curr.amount) : 0), 0).toLocaleString()}`}
                                icon={<CreditCard size={16} />}
                                color="rose"
                                isDark={isDark}
                            />
                            <StatCard
                                label="Total Recorded"
                                value={totalCount}
                                icon={<Wallet size={16} />}
                                color="blue"
                                isDark={isDark}
                            />
                            <StatCard
                                label="Average Expense"
                                value={`Rs. ${totalCount > 0 ? (expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0) / expenses.length || 0).toFixed(0).toLocaleString() : 0}`}
                                icon={<ArrowUpRight size={16} />}
                                color="slate"
                                isDark={isDark}
                            />
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="max-w-[1440px] mx-auto p-8 pb-32">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-48 gap-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20 animate-pulse" />
                                    <Loader2 className="animate-spin text-amber-500 relative" size={64} strokeWidth={3} />
                                </div>
                                <p className={`text-[11px] font-black uppercase tracking-[0.4em] animate-pulse ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Loading Expenses...</p>
                            </motion.div>
                        ) : expenses.length === 0 ? (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`flex flex-col items-center justify-center py-48 rounded-[3.5rem] border-2 border-dashed ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-200 bg-slate-50'}`}>
                                <SearchSlash size={80} strokeWidth={1} className="text-slate-800 mb-8 opacity-20" />
                                <h3 className="text-2xl font-black mb-2 italic tracking-tighter uppercase text-slate-500">No Expenses Found</h3>
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Clear the filters to see active records</p>
                            </motion.div>
                        ) : (
                            <div className="relative group">
                                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className={`relative z-0 rounded-[3.5rem] border overflow-hidden backdrop-blur-sm max-w-full ${isDark ? 'bg-slate-900/30 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className={`${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'} border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">ID</th>
                                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => toggleSort('title')}>
                                                        <div className="flex items-center gap-2">Title <ArrowUpDown size={10} /></div>
                                                    </th>
                                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Category</th>
                                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => toggleSort('amount')}>
                                                        <div className="flex items-center gap-2">Amount <ArrowUpDown size={10} /></div>
                                                    </th>
                                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => toggleSort('expense_date')}>
                                                        <div className="flex items-center gap-2">Date <ArrowUpDown size={10} /></div>
                                                    </th>
                                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">Status</th>
                                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {expenses.map((expense, index) => (
                                                    <motion.tr
                                                        key={expense.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.04 }}
                                                        className="group hover:bg-amber-600/[0.04] transition-all"
                                                    >
                                                        <td className="px-10 py-7">
                                                            <span className={`text-[12px] font-black font-mono transition-colors ${isDark ? 'text-slate-700 group-hover:text-amber-500' : 'text-slate-300 group-hover:text-amber-600'}`}>
                                                                #{expense.id.toString().padStart(4, '0')}
                                                            </span>
                                                        </td>
                                                        <td className="px-10 py-7">
                                                            <div
                                                                onClick={() => handleEditExpense(expense)}
                                                                className="cursor-pointer group/title"
                                                            >
                                                                <span className="font-black text-base tracking-tight italic uppercase block group-hover/title:text-amber-500 transition-colors underline-offset-4 decoration-amber-500/30 group-hover/title:underline">{expense.title}</span>
                                                                <span className="text-[10px] font-bold text-slate-500 truncate max-w-[200px] block">{expense.description || 'No additional notes'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-7">
                                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                                                {expense.category_display || expense.category}
                                                            </span>
                                                        </td>
                                                        <td className="px-10 py-7">
                                                            <span className="font-black text-base tracking-tighter text-rose-500">
                                                                -Rs. {parseFloat(expense.amount).toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td className="px-10 py-7">
                                                            <div className="flex items-center gap-2 text-xs font-black">
                                                                <Calendar size={12} className="text-slate-500" />
                                                                {expense.expense_date}
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-7 text-center">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${expense.status === 'paid'
                                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                                                                }`}>
                                                                {expense.status_display || expense.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-10 py-7">
                                                            <div className="flex justify-center gap-2">
                                                                <button
                                                                    onClick={() => handleEditExpense(expense)}
                                                                    className={`p-3 rounded-xl transition-all hover:scale-110 active:scale-90 ${isDark ? 'bg-white/5 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-slate-100 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                                                                >
                                                                    <ArrowUpRight size={16} strokeWidth={4} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                                    className={`p-3 rounded-xl transition-all hover:scale-110 active:scale-90 ${isDark ? 'bg-white/5 text-rose-400 hover:bg-rose-600 hover:text-white' : 'bg-slate-100 text-rose-600 hover:bg-rose-600 hover:text-white'}`}
                                                                >
                                                                    <LogOut size={16} strokeWidth={4} className="rotate-90" />
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
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
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
                                                {[...Array(totalPages)].map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentPage(i + 1)}
                                                        className={`min-w-[48px] h-12 rounded-[1.25rem] font-black text-[11px] transition-all hover:scale-110 active:scale-95 ${currentPage === i + 1 ? 'bg-amber-600 text-white shadow-xl shadow-amber-500/40' : isDark ? 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10' : 'bg-white text-slate-400 border border-slate-200 shadow-sm hover:border-slate-400 hover:text-slate-900'}`}
                                                    >
                                                        {(i + 1).toString().padStart(2, '0')}
                                                    </button>
                                                ))}
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
            </main >

            <ExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchExpenses}
                expenseToEdit={editingExpense}
            />
        </div >
    );
};

// Activity icon for status selector (simple placeholder if needed)
const Activity = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);

const LogOut = ({ size, className, strokeWidth }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

// Utility Components
const StatCard = ({ label, value, icon, color, isDark }) => {
    const bgColors = {
        amber: 'bg-amber-500/10 border-amber-500/20',
        rose: 'bg-rose-500/10 border-rose-500/20',
        blue: 'bg-blue-500/10 border-blue-500/20',
        emerald: 'bg-emerald-500/10 border-emerald-500/20',
        slate: 'bg-slate-500/10 border-slate-500/20'
    };

    const iconColors = {
        amber: 'text-amber-500',
        rose: 'text-rose-500',
        blue: 'text-blue-500',
        emerald: 'text-emerald-500',
        slate: 'text-slate-400'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-[2rem] border transition-all relative overflow-hidden group ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}
        >
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 transition-opacity group-hover:opacity-40 pointer-events-none rounded-full ${bgColors[color].split(' ')[0]}`} />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-4 rounded-2xl border ${bgColors[color]} ${iconColors[color]} shadow-lg transition-transform group-hover:scale-110`}>
                    {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
                </div>
            </div>
            <div className="space-y-1 relative z-10">
                <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
                <h4 className="text-xl font-black italic tracking-tight">{value}</h4>
            </div>
        </motion.div>
    );
};

export default ExpenseList;
