import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sidebar } from './Dashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Save, BellRing, History, ShieldCheck, Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotificationSettings = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isDark] = useState(() => localStorage.getItem('dashboardTheme') !== 'light');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [preferences, setPreferences] = useState([]);
    const [selectedId, setSelectedId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        priority: 'MEDIUM',
        retention_period: 10,
        is_active: true
    });

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async (idToSelect = null) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get('http://127.0.0.1:8000/api/notification-preference/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const results = response.data.results || [];

            // Sort by priority weight
            const priorityWeight = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
            results.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);

            setPreferences(results);

            if (results.length > 0) {
                // If idToSelect is provided, find it, otherwise default to the first one
                const target = idToSelect ? results.find(r => r.id === idToSelect) : results[0];
                const active = target || results[0];

                setSelectedId(active.id);
                setFormData({
                    priority: active.priority,
                    retention_period: active.retention_period,
                    is_active: active.is_active
                });
            } else {
                setSelectedId(null);
            }
        } catch (error) {
            toast.error(t('teacher.loading_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (pref) => {
        setSelectedId(pref.id);
        setFormData({
            priority: pref.priority,
            retention_period: pref.retention_period,
            is_active: pref.is_active
        });
    };

    const handleSave = async () => {
        if (!selectedId) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('access_token');
            await axios.patch(`http://127.0.0.1:8000/api/notification-preference/${selectedId}/`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success(t('notice.updated_success'));
            fetchPreferences(selectedId);
        } catch (error) {
            toast.error(t('common.save_error') || "Error");
        } finally {
            setSaving(false);
        }
    };

    const handleCreateNew = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('access_token');
            // Create with defaults
            const defaults = {
                priority: 'MEDIUM',
                retention_period: 10,
                is_active: true
            };
            const response = await axios.post('http://127.0.0.1:8000/api/notification-preference/', defaults, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const newId = response.data.data.id;
            toast.success(t('notice.created_success'));
            // Refresh list and select the new one
            await fetchPreferences(newId);
        } catch (error) {
            toast.error(t('common.save_error'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedId || !window.confirm(t('teacher.delete_confirm', { name: `${t('notice.setting')} #${selectedId}` }))) return;
        setDeleting(true);
        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`http://127.0.0.1:8000/api/notification-preference/${selectedId}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success(t('notice.delete_success'));
            fetchPreferences();
        } catch (error) {
            toast.error(t('common.delete_error') || "Error");
        } finally {
            setDeleting(false);
        }
    };

    const inputClasses = `w-full px-3 py-2 rounded-xl text-sm font-bold outline-none border transition-all ${isDark
        ? 'bg-slate-950/50 border-white/5 text-white focus:border-blue-500/50'
        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400'}`;

    return (
        <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${isDark ? 'bg-[#0a0f1e] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <Toaster position="top-right" />
            <Sidebar isDark={isDark} />

            <main className="flex-1 overflow-y-auto relative z-10">
                <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto w-full">

                    {/* Header */}
                    <header className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate(-1)} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                                <ArrowLeft size={18} />
                            </button>
                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                <BellRing size={20} className="text-white" />
                            </div>
                            <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('notice.configuration')}</h1>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateNew}
                                disabled={saving}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] border transition-all ${isDark ? 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                {t('notice.new_setting')}
                            </button>
                            {selectedId && (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 rounded-xl shadow-lg text-white font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    {t('notice.update')}
                                </button>
                            )}
                        </div>
                    </header>

                    {loading && !saving ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 size={32} className="animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* Left Side: Setting List */}
                            <div className="lg:col-span-4 space-y-3">
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{t('notice.settings_list')}</h3>
                                {preferences.map((pref, index) => (
                                    <motion.div
                                        key={pref.id}
                                        onClick={() => handleSelect(pref)}
                                        whileHover={{ x: 4 }}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedId === pref.id
                                            ? 'bg-blue-600/10 border-blue-500/50 shadow-md'
                                            : isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-black tracking-widest ${pref.priority === 'HIGH' ? 'text-rose-500' : pref.priority === 'MEDIUM' ? 'text-amber-500' : 'text-blue-500'}`}>
                                                {t(`notice.${pref.priority.toLowerCase()}`)} {t('notice.priority')}
                                            </span>
                                            {pref.is_active ? <ShieldCheck size={14} className="text-emerald-500" /> : <ShieldCheck size={14} className="text-slate-500 opacity-20" />}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-sm">{t('notice.setting')} #{index + 1}</h4>
                                            <span className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{pref.retention_period} {t('notice.days')}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Right Side: Editor */}
                            <div className="lg:col-span-8">
                                <AnimatePresence mode="wait">
                                    {selectedId ? (
                                        <motion.div
                                            key={selectedId}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className={`p-6 rounded-[2rem] border ${isDark ? 'bg-slate-900/40 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <Settings size={18} className="text-blue-500" />
                                                    <h3 className="font-black uppercase tracking-wider text-sm">{t('notice.edit_setting')} #{preferences.findIndex(p => p.id === selectedId) + 1}</h3>
                                                </div>
                                                <button
                                                    onClick={handleDelete}
                                                    disabled={deleting}
                                                    className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-rose-500/10 text-slate-600 hover:text-rose-500' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'}`}
                                                >
                                                    {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className={`block text-[9px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('notice.priority')}</label>
                                                        <div className="flex gap-2">
                                                            {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                                                                <button
                                                                    key={p}
                                                                    onClick={() => setFormData({ ...formData, priority: p })}
                                                                    className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${formData.priority === p
                                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                                                        : isDark ? 'bg-slate-950/30 border-white/5 text-slate-500 hover:border-white/10'
                                                                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                                                >
                                                                    {t(`notice.${p.toLowerCase()}`)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className={`block text-[9px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('notice.retention')} ({t('notice.days')})</label>
                                                        <div className="relative">
                                                            <History className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                                            <input
                                                                type="number"
                                                                value={formData.retention_period}
                                                                onChange={(e) => setFormData({ ...formData, retention_period: parseInt(e.target.value) || 0 })}
                                                                className={`${inputClasses} pl-10`}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div>
                                                        <label className={`block text-[9px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('notice.status')}</label>
                                                        <div className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer ${formData.is_active ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-rose-500/5 border border-rose-500/20'}`}
                                                            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                                        >
                                                            <span className={`font-black uppercase tracking-widest text-[9px] ${formData.is_active ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {formData.is_active ? t('notice.enabled') : t('notice.disabled')}
                                                            </span>
                                                            <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.is_active ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.is_active ? 'right-1' : 'left-1'}`} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={`p-4 rounded-2xl border border-dashed ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-100 bg-slate-50'}`}>
                                                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                                                            {t('notice.description')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                            <Settings size={48} className="mb-4 opacity-10" />
                                            <p className="text-sm font-bold">{t('notice.create_setting')}</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>

                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default NotificationSettings;
