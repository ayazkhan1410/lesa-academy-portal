import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2, Save, User, Shield, Activity, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const GRADE_OPTIONS = [
    { value: 'Nursery', label: 'Nursery' }, { value: 'Prep', label: 'Prep' },
    { value: '1', label: 'Grade 1' }, { value: '2', label: 'Grade 2' },
    { value: '3', label: 'Grade 3' }, { value: '4', label: 'Grade 4' },
    { value: '5', label: 'Grade 5' }, { value: '6', label: 'Grade 6' },
    { value: '7', label: 'Grade 7' }, { value: '8', label: 'Grade 8' },
    { value: '9', label: 'Grade 9' }, { value: '10', label: 'Grade 10' },
    { value: '11', label: '1st Year' }, { value: '12', label: '2nd Year' },
];

const StudentModal = ({ isOpen, onClose, onSuccess, studentToEdit = null }) => {
    const [loading, setLoading] = useState(false);

    // ✅ Flat Form State for UI
    const [formData, setFormData] = useState({
        name: '', age: '', grade: '',
        guardian_name: '', guardian_cnic: '', guardian_phone: '', address: '',
        initial_fee: '', fee_status: 'paid', is_active: true
    });

    useEffect(() => {
        if (studentToEdit) {
            setFormData({
                name: studentToEdit.name || '',
                age: studentToEdit.age || '',
                grade: studentToEdit.grade || '',
                guardian_name: studentToEdit.guardian?.name || '',
                guardian_cnic: studentToEdit.guardian?.cnic || '',
                guardian_phone: studentToEdit.guardian?.phone_number || '',
                address: studentToEdit.guardian?.address || '',
                initial_fee: '',
                fee_status: studentToEdit.latest_fee_status || 'paid',
                is_active: studentToEdit.is_active ?? true
            });
        } else {
            setFormData({
                name: '', age: '', grade: '',
                guardian_name: '', guardian_cnic: '', guardian_phone: '', address: '',
                initial_fee: '', fee_status: 'paid', is_active: true
            });
        }
    }, [studentToEdit, isOpen]);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading(studentToEdit ? "Updating student..." : "Registering student...");
        setLoading(true);

        try {
            const token = localStorage.getItem('access_token');

            // ✅ TRANSFORM: Map flat form data to the required nested BE structure
            const payload = {
                name: formData.name,
                age: parseInt(formData.age, 10),
                grade: formData.grade,
                date_joined: new Date().toISOString().split('T')[0],
                is_active: formData.is_active,
                guardian: {
                    name: formData.guardian_name,
                    cnic: formData.guardian_cnic,
                    phone_number: formData.guardian_phone,
                    address: formData.address,
                },
                initial_fee: {
                    amount: parseFloat(formData.initial_fee || 0),
                    month_paid_for: new Date().toISOString().slice(0, 7) + "-01",
                    status: formData.fee_status,
                }
            };

            if (studentToEdit) {
                // Update mode
                await axios.patch(`http://127.0.0.1:8000/api/students/${studentToEdit.id}/`, payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success("Record updated successfully!", { id: toastId });
            } else {
                // Creation mode
                await axios.post('http://127.0.0.1:8000/api/students/', payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                toast.success("Student registered successfully!", { id: toastId });
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error("❌ BE Error:", error.response?.data);
            const errorData = error.response?.data;
            const errorMsg = errorData?.error || "Check your input data.";
            toast.error(`Failed: ${errorMsg}`, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[150] p-4 font-sans overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-blue-600/5">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white italic">
                                    {studentToEdit ? `Edit: ${studentToEdit.name}` : "New Admission"}
                                </h2>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                                    {studentToEdit ? "Updating Database Node" : "Registering New Entry"}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* 1. Student Identity */}
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <User className="text-blue-400" size={18} />
                                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Student Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label htmlFor="name" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Student Name</label>
                                    <input id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full p-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold" />
                                </div>
                                <div>
                                    <label htmlFor="age" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Age</label>
                                    <input id="age" name="age" type="number" value={formData.age} onChange={handleChange} required className="w-full p-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 transition-all" />
                                </div>
                                <div>
                                    <label htmlFor="grade" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Grade</label>
                                    <select id="grade" name="grade" value={formData.grade} onChange={handleChange} required className="w-full p-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 appearance-none font-bold">
                                        <option value="">Select Grade</option>
                                        {GRADE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* 2. Guardian Information */}
                        <section className="pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 mb-6">
                                <Shield className="text-indigo-400" size={18} />
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Guardian Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="guardian_name" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Guardian Name</label>
                                    <input id="guardian_name" name="guardian_name" value={formData.guardian_name} onChange={handleChange} required className="w-full p-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-bold" />
                                </div>
                                <div>
                                    <label htmlFor="guardian_cnic" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">CNIC Number</label>
                                    <input id="guardian_cnic" name="guardian_cnic" value={formData.guardian_cnic} onChange={handleChange} className="w-full p-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-mono" />
                                </div>
                                <div>
                                    <label htmlFor="guardian_phone" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Phone Number</label>
                                    <input id="guardian_phone" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} required className="w-full p-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-mono" />
                                </div>
                                <div>
                                    <label htmlFor="address" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Home Address</label>
                                    <input id="address" name="address" value={formData.address} onChange={handleChange} className="w-full p-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500" />
                                </div>
                            </div>
                        </section>

                        {/* 3. Finance */}
                        <section className="pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 mb-6">
                                <Activity className="text-emerald-400" size={18} />
                                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Financial Setup</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {!studentToEdit && (
                                    <div>
                                        <label htmlFor="initial_fee" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Admission Fee</label>
                                        <input id="initial_fee" name="initial_fee" type="number" value={formData.initial_fee} onChange={handleChange} required className="w-full p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-emerald-400 outline-none focus:border-emerald-500 font-bold" />
                                    </div>
                                )}
                                <div className="flex items-center gap-4 bg-slate-950/30 p-4 rounded-2xl border border-white/5 h-fit mt-auto">
                                    <label htmlFor="is_active" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Enrollment</label>
                                    <input id="is_active" type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-6 h-6 rounded bg-slate-800 text-emerald-500 focus:ring-emerald-500" />
                                </div>
                            </div>
                        </section>
                    </form>

                    <div className="p-8 bg-slate-950/30 border-t border-white/5 flex justify-end gap-4">
                        <button onClick={onClose} className="px-8 py-3 rounded-2xl text-slate-500 hover:text-white font-black uppercase text-[10px] tracking-widest">Abort</button>
                        <button onClick={handleSubmit} disabled={loading} className="px-10 py-3 rounded-2xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> {studentToEdit ? "Update Node" : "Register Node"}</>}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StudentModal;
