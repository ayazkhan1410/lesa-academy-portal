import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DeleteModal = ({ isOpen, onClose, onConfirm, studentName }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-slate-900/60 backdrop-blur-2xl border border-rose-500/20 rounded-[2rem] w-full max-w-md overflow-hidden shadow-[0_20px_60px_rgba(225,29,72,0.3)]"
                >
                    <div className="p-8 text-center">
                        <div className="mx-auto w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                            <AlertTriangle size={40} className="text-rose-500" />
                        </div>

                        <h2 className="text-2xl font-black text-white tracking-tight mb-2">Delete Node?</h2>
                        <p className="text-slate-400 font-medium">
                            You are about to remove <span className="text-white font-bold">"{studentName}"</span> from the database. This action cannot be undone.
                        </p>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-all"
                            >
                                Abort
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} /> Confirm Delete
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DeleteModal;
