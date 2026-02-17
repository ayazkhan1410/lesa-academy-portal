import React, { useState } from 'react';
import axios from 'axios';
import { X, Loader2, Save, User, Shield, Wallet, Sparkles, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GRADE_OPTIONS = [
    { value: 'Nursery', label: 'Nursery' }, { value: 'Prep', label: 'Prep' },
    { value: '1', label: 'Grade 1' }, { value: '2', label: 'Grade 2' },
    { value: '3', label: 'Grade 3' }, { value: '4', label: 'Grade 4' },
    { value: '5', label: 'Grade 5' }, { value: '6', label: 'Grade 6' },
    { value: '7', label: 'Grade 7' }, { value: '8', label: 'Grade 8' },
    { value: '9', label: 'Grade 9' }, { value: '10', label: 'Grade 10' },
    { value: '11', label: '1st Year' }, { value: '12', label: '2nd Year' },
];

const StudentModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '', age: '', grade: '', date_joined: new Date().toISOString().split('T')[0],
        guardian_name: '', guardian_cnic: '', guardian_phone: '', address: '',
        initial_fee: '', fee_status: 'paid'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            await axios.post('http://127.0.0.1:8000/api/students/', formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                name: '', age: '', grade: '', date_joined: new Date().toISOString().split('T')[0],
                guardian_name: '', guardian_cnic: '', guardian_phone: '', address: '',
                initial_fee: '', fee_status: 'paid'
            });
        } catch (error) {
            console.error("Submission error:", error);
            alert("Failed to add student. Please check all fields.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[150] p-4 font-sans overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-indigo-600/10 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight italic">New Admission</h2>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Single Node Data Entry</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-slate-400 transition-all border border-white/5"><X size={20} /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                        {/* 1. Student Identity */}
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <User className="text-blue-400" size={18} />
                                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Student Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Full Legal Name</label>
                                    <input name="name" value={formData.name} onChange={handleChange} required placeholder="Student Name" className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Current Age</label>
                                    <input name="age" type="number" value={formData.age} onChange={handleChange} required placeholder="Years" className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Rank (Grade)</label>
                                    <select name="grade" value={formData.grade} onChange={handleChange} required className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-2xl text-slate-300 outline-none focus:border-blue-500/50 appearance-none font-bold text-sm">
                                        <option value="">Select Grade</option>
                                        {GRADE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* 2. Guardian Overseer */}
                        <section>
                            <div className="flex items-center gap-2 mb-6 pt-4 border-t border-white/5">
                                <Shield className="text-indigo-400" size={18} />
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Overseer Credentials</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Guardian Name</label>
                                    <input name="guardian_name" value={formData.guardian_name} onChange={handleChange} required placeholder="Full Name" className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">National ID (CNIC)</label>
                                    <input name="guardian_cnic" value={formData.guardian_cnic} onChange={handleChange} required placeholder="00000-0000000-0" className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 font-mono text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Contact Protocol</label>
                                    <input name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} required placeholder="Phone Number" className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 font-mono text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Resident Address</label>
                                    <input name="address" value={formData.address} onChange={handleChange} required placeholder="City, Area" className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50" />
                                </div>
                            </div>
                        </section>

                        {/* 3. Initial Liquidity */}
                        <section>
                            <div className="flex items-center gap-2 mb-6 pt-4 border-t border-white/5">
                                <Wallet className="text-emerald-400" size={18} />
                                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Financial Initialization</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Admission Amount</label>
                                    <input name="initial_fee" type="number" value={formData.initial_fee} onChange={handleChange} placeholder="Rs." className="w-full p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-emerald-400 outline-none focus:border-emerald-500/50 font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Transfer Status</label>
                                    <select name="fee_status" value={formData.fee_status} onChange={handleChange} className="w-full p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-emerald-400 outline-none focus:border-emerald-500/50 font-black uppercase text-xs">
                                        <option value="paid">PAID</option>
                                        <option value="pending">PENDING</option>
                                    </select>
                                </div>
                            </div>
                        </section>
                    </form>

                    {/* Actions */}
                    <div className="p-8 bg-slate-950/30 border-t border-white/5 flex justify-end gap-4 shrink-0">
                        <button onClick={onClose} className="px-8 py-3 rounded-2xl text-slate-500 hover:text-white font-black transition-all uppercase text-[10px] tracking-widest">Abort</button>
                        <button onClick={handleSubmit} disabled={loading} className="px-10 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Secure Record</>}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StudentModal;