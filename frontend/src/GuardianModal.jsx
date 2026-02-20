import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2, Save, User, Shield, MapPin, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const GuardianModal = ({ isOpen, onClose, onSuccess, guardianToEdit = null }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        cnic: '',
        phone_number: '',
        address: ''
    });

    useEffect(() => {
        if (guardianToEdit) {
            setFormData({
                name: guardianToEdit.name || '',
                cnic: guardianToEdit.cnic || '',
                phone_number: guardianToEdit.phone_number || '',
                address: guardianToEdit.address || ''
            });
        } else {
            setFormData({
                name: '',
                cnic: '',
                phone_number: '',
                address: ''
            });
        }
    }, [guardianToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'phone_number') {
            // Restrict to digits only and cap at 11 characters
            const digitsOnly = value.replace(/[^\d]/g, '');
            const capped = digitsOnly.slice(0, 11);
            setFormData({ ...formData, [name]: capped });
            return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading(guardianToEdit ? "Updating guardian..." : "Creating guardian...");

        try {
            const token = localStorage.getItem('access_token');
            const url = guardianToEdit
                ? `http://127.0.0.1:8000/api/guardian/${guardianToEdit.id}/`
                : 'http://127.0.0.1:8000/api/guardian/';

            const method = guardianToEdit ? 'put' : 'post';

            const response = await axios({
                method,
                url,
                data: formData,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            toast.success(guardianToEdit ? "Guardian updated!" : "Guardian created successfully!", { id: toastId });
            onSuccess(response.data);
            onClose();
        } catch (error) {
            console.error("error submitting guardian:", error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || "An error occurred";
            toast.error(errorMsg, { id: toastId });
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
                        {/* Bottom Lighting Effect */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-blue-600/20 blur-[40px] pointer-events-none" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent blur-[1px] z-10" />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative z-0 w-full bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-white/5 bg-gradient-to-br from-blue-600/10 to-transparent">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-black text-white italic tracking-tight">
                                            {guardianToEdit ? 'Edit Guardian' : 'Add New Guardian'}
                                        </h2>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Enter guardian details below</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    {/* Name */}
                                    <div className="space-y-2 group">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                            <User size={12} className="text-blue-500" /> Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-blue-500/50 focus:bg-slate-950 transition-all placeholder:text-slate-700"
                                            placeholder="e.g. Ahmed Khan"
                                        />
                                    </div>

                                    {/* CNIC */}
                                    <div className="space-y-2 group">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                            <Shield size={12} className="text-blue-500" /> CNIC Number
                                        </label>
                                        <input
                                            type="text"
                                            name="cnic"
                                            required
                                            value={formData.cnic}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-blue-500/50 focus:bg-slate-950 transition-all placeholder:text-slate-700"
                                            placeholder="e.g. 31202-1234567-1"
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2 group">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                <Phone size={12} className="text-blue-500" /> Phone Number
                                            </label>
                                            <span className="text-[8px] font-black text-blue-500/50 uppercase tracking-tighter italic">Format: 03130753830</span>
                                        </div>
                                        <input
                                            type="text"
                                            name="phone_number"
                                            required
                                            value={formData.phone_number}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-blue-500/50 focus:bg-slate-950 transition-all placeholder:text-slate-700 font-mono"
                                            placeholder="03130753830"
                                        />
                                    </div>

                                    {/* Address */}
                                    <div className="space-y-2 group">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                            <MapPin size={12} className="text-blue-500" /> Address
                                        </label>
                                        <textarea
                                            name="address"
                                            rows="3"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-blue-500/50 focus:bg-slate-950 transition-all placeholder:text-slate-700 resize-none"
                                            placeholder="Complete residential address..."
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-3 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-black py-4 px-10 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        {guardianToEdit ? 'Update Guardian' : 'Add Guardian'}
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

export default GuardianModal;
