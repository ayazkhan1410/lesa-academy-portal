import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2, Save, Receipt, CreditCard, Calendar, FileText, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CATEGORY_OPTIONS = [
    { value: 'salary', label: 'Salary' },
    { value: 'rent', label: 'Rent' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
    { value: 'paid', label: 'PAID' },
    { value: 'pending', label: 'PENDING' },
];

const ExpenseModal = ({ isOpen, onClose, onSuccess, expenseToEdit = null }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: 'other',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        status: 'paid',
        description: ''
    });

    useEffect(() => {
        if (expenseToEdit) {
            setFormData({
                title: expenseToEdit.title || '',
                category: expenseToEdit.category || 'other',
                amount: expenseToEdit.amount || '',
                expense_date: expenseToEdit.expense_date || new Date().toISOString().split('T')[0],
                status: expenseToEdit.status || 'paid',
                description: expenseToEdit.description || ''
            });
        } else {
            setFormData({
                title: '',
                category: 'other',
                amount: '',
                expense_date: new Date().toISOString().split('T')[0],
                status: 'paid',
                description: ''
            });
        }
    }, [expenseToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'amount') {
            // Restrict to digits and decimal point only
            const sanitized = value.replace(/[^\d.]/g, '');
            // Prevent multiple decimal points
            const parts = sanitized.split('.');
            const finalValue = parts.length > 2 ? `${parts[0]}.${parts[1]}` : sanitized;
            setFormData({ ...formData, [name]: finalValue });
            return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading(expenseToEdit ? "Updating expense..." : "Adding expense...");

        try {
            const token = localStorage.getItem('access_token');
            const url = expenseToEdit
                ? `http://127.0.0.1:8000/api/expenses/${expenseToEdit.id}`
                : 'http://127.0.0.1:8000/api/expenses/';

            const method = expenseToEdit ? 'patch' : 'post';

            const response = await axios({
                method,
                url,
                data: formData,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            toast.success(expenseToEdit ? "Expense updated!" : "Expense added successfully!", { id: toastId });
            onSuccess(response.data);
            onClose();
        } catch (error) {
            console.error("Error submitting expense:", error);
            const errorMsg = error.response?.data?.error || "Failed to save expense";
            toast.error(typeof errorMsg === 'object' ? "Validation Error" : errorMsg, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                    />

                    <div className="relative group w-full max-w-lg">
                        {/* Amber Lighting Effect for Expenses (Outflow) */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-amber-600/20 blur-[40px] pointer-events-none" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent blur-[1px] z-10" />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative z-0 w-full bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-white/5 bg-gradient-to-br from-amber-600/10 to-transparent">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-amber-600/20 p-3 rounded-2xl border border-amber-500/20">
                                            <Receipt size={24} className="text-amber-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white italic tracking-tight">
                                                {expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
                                            </h2>
                                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Expense Record Details</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Title */}
                                    <div className="space-y-2 group md:col-span-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                            <FileText size={12} className="text-amber-500" /> Title
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            required
                                            value={formData.title}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-amber-500/50 focus:bg-slate-950 transition-all placeholder:text-slate-700"
                                            placeholder="e.g. Monthly Electricity Bill"
                                        />
                                    </div>

                                    {/* Category */}
                                    <div className="space-y-2 group">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                            <Activity size={12} className="text-amber-500" /> Category
                                        </label>
                                        <select
                                            name="category"
                                            required
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-amber-500/50 focus:bg-slate-950 transition-all appearance-none"
                                        >
                                            {CATEGORY_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Amount */}
                                    <div className="space-y-2 group">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                            <CreditCard size={12} className="text-amber-500" /> Amount (PKR)
                                        </label>
                                        <input
                                            type="text"
                                            name="amount"
                                            required
                                            value={formData.amount}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-amber-500/50 focus:bg-slate-950 transition-all placeholder:text-slate-700 font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {/* Date */}
                                    <div className="space-y-2 group">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                            <Calendar size={12} className="text-amber-500" /> Transaction Date
                                        </label>
                                        <input
                                            type="date"
                                            name="expense_date"
                                            required
                                            value={formData.expense_date}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-amber-500/50 focus:bg-slate-950 transition-all [color-scheme:dark]"
                                        />
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-2 group">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                            <Activity size={12} className="text-amber-500" /> Payment Status
                                        </label>
                                        <select
                                            name="status"
                                            required
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:border-amber-500/50 focus:bg-slate-950 transition-all appearance-none"
                                        >
                                            {STATUS_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2 group md:col-span-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                            <FileText size={12} className="text-amber-500" /> Description / Notes
                                        </label>
                                        <textarea
                                            name="description"
                                            rows="3"
                                            value={formData.description}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-amber-500/50 focus:bg-slate-950 transition-all placeholder:text-slate-700 resize-none"
                                            placeholder="Optional additional context..."
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all border border-white/5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] flex items-center justify-center gap-3 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-600/50 text-white font-black py-4 px-10 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        {expenseToEdit ? 'Save Changes' : 'Add Expense'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ExpenseModal;
