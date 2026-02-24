import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Trash2, CheckCircle2, Clock, Inbox, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const NotificationTray = ({ isOpen, onClose, notifications, onMarkRead, onMarkAllRead, onDelete, isDark, loading }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleNotificationClick = (notif) => {
        if (!notif.is_read) {
            onMarkRead(notif.id);
        }

        if (notif.student) {
            navigate(`/students/${notif.student.id}`);
            onClose();
        } else if (notif.teacher) {
            navigate(`/teachers/${notif.teacher.id}`);
            onClose();
        }
    };

    const getPriorityStyles = (priority) => {
        switch (priority) {
            case 'HIGH': return 'border-l-rose-500 bg-rose-500/[0.03]';
            case 'MEDIUM': return 'border-l-amber-500 bg-amber-500/[0.03]';
            default: return 'border-l-blue-500 bg-blue-500/[0.03]';
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return t('notice.just_now');
        if (diffInSeconds < 3600) return t('notice.minute_ago', { count: Math.floor(diffInSeconds / 60) });
        if (diffInSeconds < 86400) return t('notice.hour_ago', { count: Math.floor(diffInSeconds / 3600) });
        return t('notice.day_ago', { count: Math.floor(diffInSeconds / 86400) });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Tray */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={`fixed top-0 right-0 h-full w-full max-w-md z-[70] shadow-2xl flex flex-col ${isDark ? 'bg-slate-950 border-l border-white/5' : 'bg-white border-l border-slate-200'
                            }`}
                    >
                        {/* Header */}
                        <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                                    <Bell size={20} />
                                </div>
                                <h2 className="font-black uppercase tracking-widest text-sm">{t('notice.notifications')}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onMarkAllRead}
                                    title={t('notice.mark_all_read')}
                                    className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-slate-500 hover:text-blue-400' : 'hover:bg-slate-50 text-slate-400 hover:text-blue-500'}`}
                                >
                                    <CheckCircle2 size={18} />
                                </button>
                                <button
                                    onClick={onClose}
                                    className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-50 text-slate-400'}`}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loading && notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-50">
                                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                                </div>
                            ) : notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <motion.div
                                        key={notif.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.02, x: -4 }}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`relative group p-4 rounded-2xl border-l-[4px] transition-all border cursor-pointer ${getPriorityStyles(notif.priority)
                                            } ${notif.is_read ? 'opacity-60 border-transparent' : isDark ? 'border-white/5 bg-slate-900/40 shadow-lg shadow-blue-500/5' : 'border-slate-100 bg-white shadow-sm'}`}
                                    >
                                        {!notif.is_read && (
                                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)] z-20" />
                                        )}
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-sm line-clamp-1">{notif.title}</h3>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notif.is_read && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onMarkRead(notif.id);
                                                        }}
                                                        className="p-1 hover:text-blue-500 transition-colors"
                                                    >
                                                        <CheckCircle2 size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(notif.id);
                                                    }}
                                                    className="p-1 hover:text-rose-500 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className={`text-xs mb-3 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {notif.message}
                                        </p>
                                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock size={10} />
                                                {formatTime(notif.created_at)}
                                            </span>
                                            {notif.student && (
                                                <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
                                                    {notif.student.name}
                                                </span>
                                            )}
                                            {notif.teacher && (
                                                <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">
                                                    {notif.teacher.name}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full opacity-20 py-20 text-center">
                                    <Inbox size={64} className="mb-4" />
                                    <p className="font-black uppercase tracking-[0.2em] text-sm">{t('notice.no_notifications')}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className={`p-4 border-t flex items-center justify-between ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {notifications.filter(n => !n.is_read).length} {t('notice.unread_count', { count: notifications.filter(n => !n.is_read).length })}
                                </p>
                                <button
                                    onClick={() => notifications.forEach(n => onDelete(n.id))}
                                    className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors"
                                >
                                    {t('notice.clear_all')}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationTray;
