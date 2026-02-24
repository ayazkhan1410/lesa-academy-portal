import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationTray from './NotificationTray';
import toast from 'react-hot-toast';

const NotificationBell = ({ isDark }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const response = await axios.get('http://127.0.0.1:8000/api/notification/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // API returns results in paginated format from user's implementation
            const data = response.data.results || [];
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Polling every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkRead = async (id) => {
        try {
            const token = localStorage.getItem('access_token');
            await axios.patch(`http://127.0.0.1:8000/api/notification/${id}/`, { is_read: true }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            toast.error("Failed to mark as read");
        }
    };

    const handleMarkAllRead = async () => {
        // Since backend doesn't have mark_all_read yet, we loop through unread locally
        // or just mark them one by one. But let's keep it simple for now.
        const unread = notifications.filter(n => !n.is_read);
        if (unread.length === 0) return;

        try {
            const token = localStorage.getItem('access_token');
            await Promise.all(unread.map(n =>
                axios.patch(`http://127.0.0.1:8000/api/notification/${n.id}/`, { is_read: true }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ));
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast.success("All marked as read");
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`http://127.0.0.1:8000/api/notification/${id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
            const wasUnread = !notifications.find(n => n.id === id)?.is_read;
            if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            toast.error("Failed to delete notification");
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(true)}
                className={`relative p-2.5 rounded-xl border transition-all ${isDark
                        ? 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                    }`}
            >
                <Bell size={20} className={unreadCount > 0 ? "animate-swing" : ""} />

                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white border-2 border-slate-950 ring-2 ring-rose-500/20"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            <NotificationTray
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
                onDelete={handleDelete}
                isDark={isDark}
                loading={loading}
            />
        </div>
    );
};

export default NotificationBell;
