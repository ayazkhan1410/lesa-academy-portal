import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Users, User, Phone, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const MessageModal = ({ isOpen, onClose, students = [], onSuccess }) => {
    const [message, setMessage] = useState('');
    const [sendToAll, setSendToAll] = useState(false);
    const [sending, setSending] = useState(false);

    const isBulk = students.length > 1 || sendToAll;

    const quickTemplates = [
        { label: 'Fee Reminder', text: 'Dear Parent, this is a reminder that your child\'s monthly fee is pending. Please pay at your earliest convenience. — LESA Academy' },
        { label: 'Fee Received', text: 'Dear Parent, we have received the fee payment for your child. Thank you for your timely payment. — LESA Academy' },
        { label: 'General Notice', text: 'Dear Parent, this is an important notice from The Learning & Educational Science Academy, Bahawalnagar. ' },
    ];

    const handleSend = async () => {
        if (!message.trim()) {
            toast.error('Please enter a message');
            return;
        }

        setSending(true);
        try {
            const token = localStorage.getItem('access_token');
            const payload = sendToAll
                ? { send_to_all: true, message: message.trim() }
                : { student_ids: students.map(s => s.id), message: message.trim() };

            const response = await axios.post('http://127.0.0.1:8000/api/send-message/', payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            toast.success(`${response.data.messages_sent || 'All'} message(s) sent successfully!`, { duration: 5000 });
            setMessage('');
            setSendToAll(false);
            if (onSuccess) onSuccess(response.data);
            onClose();
        } catch (error) {
            console.error('Message send error:', error);
            const errMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to send messages';
            toast.error(errMsg);
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        if (!sending) {
            setMessage('');
            setSendToAll(false);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                        className="relative w-full max-w-lg bg-[#0f172a] border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-600/10 rounded-xl">
                                    <MessageSquare size={20} className="text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-white">Send Message</h2>
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                                        {sendToAll ? 'Broadcasting to all parents' : `${students.length} recipient${students.length !== 1 ? 's' : ''}`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={sending}
                                className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">

                            {/* Recipients Preview */}
                            {!sendToAll && students.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Recipients</p>
                                    <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {students.map((s) => (
                                            <div key={s.id} className="flex items-center gap-3 p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0">
                                                    {s.name?.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white truncate">{s.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">
                                                        Guardian: {s.guardian_name || s.guardian?.name || '—'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-500">
                                                    <Phone size={10} />
                                                    <span className="text-[10px] font-mono">{s.guardian_phone || s.guardian?.phone_number || '—'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Send to All Toggle */}
                            {students.length > 1 && (
                                <button
                                    onClick={() => setSendToAll(!sendToAll)}
                                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${sendToAll
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                        : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Users size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Send to ALL parents</span>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full transition-all relative ${sendToAll ? 'bg-amber-500' : 'bg-slate-700'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${sendToAll ? 'left-5' : 'left-0.5'}`} />
                                    </div>
                                </button>
                            )}

                            {sendToAll && (
                                <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                    <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-amber-400/80 font-medium">
                                        This will send the message to <span className="font-black">every parent</span> in the system. Make sure your message is correct.
                                    </p>
                                </div>
                            )}

                            {/* Quick Templates */}
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Quick Templates</p>
                                <div className="flex flex-wrap gap-2">
                                    {quickTemplates.map((t, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setMessage(t.text)}
                                            className="px-3 py-1.5 bg-slate-800/60 hover:bg-blue-600/10 text-slate-400 hover:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-700/50 hover:border-blue-500/30 transition-all"
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message Input */}
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Message</p>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message here..."
                                    rows={4}
                                    maxLength={500}
                                    className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors resize-none font-medium"
                                />
                                <div className="flex justify-between mt-1.5">
                                    <p className="text-[10px] text-slate-600 font-mono">{message.length}/500 characters</p>
                                    {message.length > 0 && (
                                        <button onClick={() => setMessage('')} className="text-[10px] text-slate-600 hover:text-red-400 font-bold uppercase transition-colors">
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-0 flex gap-3">
                            <button
                                onClick={handleClose}
                                disabled={sending}
                                className="flex-1 py-3.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800 font-bold text-xs uppercase tracking-wider transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={sending || !message.trim()}
                                className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${sending || !message.trim()
                                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                    : sendToAll
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/20'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
                                    }`}
                            >
                                {sending ? (
                                    <><Loader2 size={14} className="animate-spin" /> Sending...</>
                                ) : (
                                    <><Send size={14} /> Send Message</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MessageModal;
