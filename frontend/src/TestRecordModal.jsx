import React, { useState } from 'react';
import axios from 'axios';
import { X, Plus, Trash2, Loader2, Save, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const TestRecordModal = ({ isOpen, onClose, studentId, studentName, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([
        { test_date: new Date().toISOString().slice(0, 10), test_name: '', subject: '', obtained_marks: '', total_marks: '', remarks: '' }
    ]);

    const handleAddRow = () => {
        setRecords([...records, { test_date: new Date().toISOString().slice(0, 10), test_name: '', subject: '', obtained_marks: '', total_marks: '', remarks: '' }]);
    };

    const handleRemoveRow = (index) => {
        if (records.length > 1) {
            setRecords(records.filter((_, i) => i !== index));
        }
    };

    const handleChange = (index, field, value) => {
        const updatedRecords = [...records];
        updatedRecords[index][field] = value;
        setRecords(updatedRecords);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        const isValid = records.every(r => r.test_name && r.subject && r.obtained_marks && r.total_marks);
        if (!isValid) {
            toast.error("Please fill in all required fields for each record.");
            return;
        }

        setLoading(true);
        const loadingToast = toast.loading("Saving academic records...");

        try {
            const token = localStorage.getItem('access_token');
            const payload = {
                records: records.map(r => ({
                    ...r,
                    obtained_marks: parseFloat(r.obtained_marks),
                    total_marks: parseFloat(r.total_marks)
                }))
            };

            await axios.post(`http://127.0.0.1:8000/api/students/${studentId}/test-records-bulk/`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            toast.success("Test records saved successfully!", { id: loadingToast });
            onSuccess();
            onClose();
            // Reset records
            setRecords([{ test_date: new Date().toISOString().slice(0, 10), test_name: '', subject: '', obtained_marks: '', total_marks: '', remarks: '' }]);
        } catch (error) {
            console.error("Error saving records:", error);
            toast.error(error.response?.data?.error || "Failed to save records.", { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[250] p-4 font-sans overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-5xl shadow-2xl my-auto"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 bg-blue-600/5 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600/20 p-3 rounded-2xl text-blue-400">
                                <Award size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white italic tracking-tight uppercase">Bulk Academic Entry</h2>
                                <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">Student: {studentName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                            {records.map((record, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-6 gap-4 p-5 bg-slate-950/50 border border-white/5 rounded-2xl items-end group hover:border-blue-500/20 transition-all"
                                >
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Date</label>
                                        <input
                                            type="date"
                                            value={record.test_date}
                                            onChange={(e) => handleChange(index, 'test_date', e.target.value)}
                                            className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-blue-500/50"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Subject</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Science"
                                            value={record.subject}
                                            onChange={(e) => handleChange(index, 'subject', e.target.value)}
                                            className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-blue-500/50"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Test Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Unit 1"
                                            value={record.test_name}
                                            onChange={(e) => handleChange(index, 'test_name', e.target.value)}
                                            className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-blue-500/50"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Obtained</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="20"
                                            value={record.obtained_marks}
                                            onChange={(e) => handleChange(index, 'obtained_marks', e.target.value)}
                                            className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-blue-500/50 font-mono"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Total</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="30"
                                            value={record.total_marks}
                                            onChange={(e) => handleChange(index, 'total_marks', e.target.value)}
                                            className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-blue-500/50 font-mono"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-1 flex items-center justify-end h-full pt-6">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRow(index)}
                                            className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                            title="Remove Row"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-8">
                            <button
                                type="button"
                                onClick={handleAddRow}
                                className="flex items-center gap-3 px-6 py-4 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest border border-white/5"
                            >
                                <Plus size={18} /> Add Another Row
                            </button>

                            <div className="flex gap-4 w-full md:w-auto">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-8 py-4 bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-blue-600 text-white hover:bg-blue-500 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Records</>}
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TestRecordModal;
