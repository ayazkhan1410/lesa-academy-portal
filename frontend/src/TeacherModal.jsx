import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, User, Phone, Banknote, Calendar, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const BASE_URL = 'http://127.0.0.1:8000';

const COMMON_SUBJECTS = [
    "Mathematics", "English", "Urdu", "Science", "Islamiyat",
    "Physics", "Chemistry", "Biology", "Computer", "Pakistan Studies"
];

const TeacherModal = ({ isOpen, onClose, teacher = null, onSuccess }) => {
    const { t } = useTranslation();
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
        }).then(r => setSubjects(r.data)).catch((err) => {
            console.error("Failed to fetch subjects:", err);
            toast.error(t('teacher.subjects_load_error') || "Subjects load hone mein masla hua");
        });
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

    const toggleSubject = async (subName) => {
        // Find if subject already exists in fetched list
        let subject = subjects.find(s => s.name.toLowerCase() === subName.toLowerCase());

        if (!subject) {
            // Create the subject on the fly
            try {
                const token = localStorage.getItem('access_token');
                const resp = await axios.post(`${BASE_URL}/api/subjects/`, { name: subName }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                subject = resp.data.data;
                setSubjects(prev => [...prev, subject]);
            } catch (err) {
                toast.error(`Could not create subject: ${subName}`);
                return;
            }
        }

        const id = subject.id;
        setForm(prev => ({
            ...prev,
            subject_ids: prev.subject_ids.includes(id)
                ? prev.subject_ids.filter(s => s !== id)
                : [...prev.subject_ids, id]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.subject_ids.length === 0) {
            toast.error(t('teacher.subject_required') || 'At least one subject is required');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const payload = { ...form, salary: form.salary || null };
            if (isEdit) {
                await axios.patch(`${BASE_URL}/api/teachers/${teacher.id}/`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success(t('teacher.updated_success') || 'Teacher updated successfully!');
            } else {
                await axios.post(`${BASE_URL}/api/teachers/`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success(t('teacher.created_success') || 'Teacher created successfully!');
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
                                        {isEdit ? t('teacher.edit_teacher') || 'Edit Teacher' : t('teacher.add_teacher')}
                                    </h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        {isEdit ? t('teacher.update_record') || 'Update teacher record' : t('teacher.create_new') || 'Create new teacher'}
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
                                    <User size={10} className="inline mr-1" /> {t('teacher.name')}
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
                                    <Phone size={10} className="inline mr-1" /> {t('teacher.phone')}
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
                                        <Banknote size={10} className="inline mr-1" /> {t('teacher.salary')}
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
                                        <Calendar size={10} className="inline mr-1" /> {t('teacher.hire_date')}
                                    </label>
                                    <input
                                        type="date" value={form.date_joined}
                                        onChange={e => setForm(p => ({ ...p, date_joined: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-violet-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                                    <span><BookOpen size={10} className="inline mr-1" /> {t('teacher.subjects')}</span>
                                    <span className="text-violet-500 text-[8px] font-black">* Required</span>
                                </label>

                                {/* Common Pakistani Subjects */}
                                <div className="mb-4">
                                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-2">{t('teacher.common_subjects') || 'Common Pakistani Subjects'}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {COMMON_SUBJECTS.map(name => {
                                            const isSelected = form.subject_ids.some(id =>
                                                subjects.find(s => s.id === id)?.name.toLowerCase() === name.toLowerCase()
                                            );
                                            return (
                                                <button
                                                    key={name} type="button"
                                                    onClick={() => toggleSubject(name)}
                                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isSelected
                                                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                                                        : 'bg-slate-800/50 text-slate-500 border-slate-700 hover:border-slate-500'
                                                        }`}
                                                >
                                                    {name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Dynamic/Other Subjects */}
                                {subjects.filter(s => !COMMON_SUBJECTS.map(c => c.toLowerCase()).includes(s.name.toLowerCase())).length > 0 && (
                                    <div>
                                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-2">{t('teacher.other_subjects') || 'Other Subjects'}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {subjects.filter(s => !COMMON_SUBJECTS.map(c => c.toLowerCase()).includes(s.name.toLowerCase())).map(sub => (
                                                <button
                                                    key={sub.id} type="button"
                                                    onClick={() => toggleSubject(sub.name)}
                                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${form.subject_ids.includes(sub.id)
                                                        ? 'bg-violet-600/20 text-violet-300 border-violet-500/40'
                                                        : 'bg-slate-800/50 text-slate-500 border-slate-700 hover:border-slate-500'
                                                        }`}
                                                >
                                                    {sub.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={onClose}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest transition-all border border-white/5">
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" disabled={loading}
                                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50">
                                    {loading ? t('common.loading') : isEdit ? t('common.save') : t('common.add')}
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
