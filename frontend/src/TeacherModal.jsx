import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, User, Phone, DollarSign, Calendar, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const BASE_URL = 'http://127.0.0.1:8000';

const TeacherModal = ({ isOpen, onClose, teacher = null, onSuccess }) => {
    const isEdit = !!teacher;
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        phone_number: '',
        salary: '',
        date_joined: '',
        subject_ids: [],
    });

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        axios.get(`${BASE_URL}/api/subjects/`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => setSubjects(r.data)).catch(() => { });
    }, []);

    useEffect(() => {
        if (teacher) {
            setForm({
                name: teacher.name || '',
                phone_number: teacher.phone_number || '',
                salary: teacher.salary || '',
                date_joined: teacher.date_joined || '',
                subject_ids: (teacher.subjects || []).map(s => s.id),
            });
        } else {
            setForm({ name: '', phone_number: '', salary: '', date_joined: '', subject_ids: [] });
        }
    }, [teacher, isOpen]);

    const toggleSubject = (id) => {
        setForm(prev => ({
            ...prev,
            subject_ids: prev.subject_ids.includes(id)
                ? prev.subject_ids.filter(s => s !== id)
                : [...prev.subject_ids, id]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const payload = { ...form, salary: form.salary || null };
            if (isEdit) {
                await axios.patch(`${BASE_URL}/api/teachers/${teacher.id}/`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Teacher updated successfully!');
            } else {
                await axios.post(`${BASE_URL}/api/teachers/`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Teacher created successfully!');
            }
            onSuccess();
            onClose();
        } catch (err) {
            const msg = err.response?.data?.errors
                ? JSON.stringify(err.response.data.errors)
                : 'Something went wrong';
            toast.error(msg);
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
                        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="bg-violet-600/20 p-2.5 rounded-xl text-violet-400">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-white italic tracking-tight uppercase">
                                        {isEdit ? 'Edit Teacher' : 'Add Teacher'}
                                    </h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        {isEdit ? 'Update teacher record' : 'Create new teacher'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Name */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    <User size={10} className="inline mr-1" /> Full Name
                                </label>
                                <input
                                    type="text" value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Ahmed Khan"
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    <Phone size={10} className="inline mr-1" /> Phone Number
                                </label>
                                <input
                                    type="text" value={form.phone_number}
                                    onChange={e => setForm(p => ({ ...p, phone_number: e.target.value }))}
                                    placeholder="e.g. 0300-1234567"
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all"
                                />
                            </div>

                            {/* Salary + Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        <DollarSign size={10} className="inline mr-1" /> Monthly Salary
                                    </label>
                                    <input
                                        type="number" value={form.salary}
                                        onChange={e => setForm(p => ({ ...p, salary: e.target.value }))}
                                        placeholder="e.g. 25000"
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        <Calendar size={10} className="inline mr-1" /> Date Joined
                                    </label>
                                    <input
                                        type="date" value={form.date_joined}
                                        onChange={e => setForm(p => ({ ...p, date_joined: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-violet-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Subjects */}
                            {subjects.length > 0 && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        <BookOpen size={10} className="inline mr-1" /> Subjects
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {subjects.map(sub => (
                                            <button
                                                key={sub.id} type="button"
                                                onClick={() => toggleSubject(sub.id)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${form.subject_ids.includes(sub.id)
                                                        ? 'bg-violet-600/20 text-violet-300 border-violet-500/40'
                                                        : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500'
                                                    }`}
                                            >
                                                {sub.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={onClose}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest transition-all border border-white/5">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading}
                                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50">
                                    {loading ? 'Saving...' : isEdit ? 'Update Teacher' : 'Add Teacher'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TeacherModal;
