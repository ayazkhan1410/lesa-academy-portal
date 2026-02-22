import React, { useState } from 'react';
import axios from 'axios';
import { X, Banknote, Calendar, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const BASE_URL = 'http://127.0.0.1:8000';

const SalaryModal = ({ isOpen, onClose, teacherId, teacherName, monthlySalary, onSuccess }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        amount: monthlySalary || '',
        month: '',
        salary_slip: null,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || !form.month) {
            toast.error(t('teacher.amount_month_required') || 'Amount aur Month required hain');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const formData = new FormData();
            formData.append('amount', form.amount);
            formData.append('month', form.month);
            if (form.salary_slip) formData.append('salary_slip', form.salary_slip);

            await axios.post(`${BASE_URL}/api/teachers/${teacherId}/salary/`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });
            toast.success(t('teacher.salary_posted_success') || 'Salary posted successfully!');
            setForm({ amount: monthlySalary || '', month: '', salary_slip: null });
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.errors
                ? JSON.stringify(err.response.data.errors)
                : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-600/20 p-2.5 rounded-xl text-emerald-400">
                                    <Banknote size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-white italic tracking-tight uppercase">
                                        {t('teacher.post_salary')}
                                    </h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        {teacherName}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Monthly salary badge */}
                        {monthlySalary && (
                            <div className="mx-6 mt-5 p-4 bg-emerald-600/5 border border-emerald-500/20 rounded-2xl flex justify-between items-center">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t('teacher.salary')}</span>
                                <span className="text-xl font-black text-white italic">Rs. {monthlySalary}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Amount */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    <Banknote size={10} className="inline mr-1" /> {t('teacher.amount')} (Rs.)
                                </label>
                                <input
                                    type="number" value={form.amount}
                                    onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                    placeholder="e.g. 25000"
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
                                />
                            </div>

                            {/* Month */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    <Calendar size={10} className="inline mr-1" /> {t('teacher.month')}
                                </label>
                                <input
                                    type="date" value={form.month}
                                    onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-all"
                                />
                                <p className="text-[9px] text-slate-600 mt-1 font-bold">
                                    {t('teacher.date_hint') || 'Jis month ki salary ha uska pehla din select karen (e.g. 2024-02-01)'}
                                </p>
                            </div>

                            {/* Salary Slip */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    <FileText size={10} className="inline mr-1" /> {t('teacher.view_slip')} (Optional)
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={e => setForm(p => ({ ...p, salary_slip: e.target.files[0] }))}
                                        className="w-full bg-slate-800 border border-slate-700 text-slate-400 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-all file:mr-3 file:bg-slate-700 file:text-slate-300 file:rounded-lg file:border-0 file:text-xs file:px-3 file:py-1 file:font-bold file:cursor-pointer"
                                    />
                                </div>
                                {form.salary_slip && (
                                    <p className="text-[9px] text-emerald-400 mt-1 font-bold">
                                        ✓ {form.salary_slip.name}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={onClose}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest transition-all border border-white/5">
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" disabled={loading}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50">
                                    {loading ? t('common.loading') : t('teacher.post_salary')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SalaryModal;
