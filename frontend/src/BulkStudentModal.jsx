import React, { useState } from 'react';
import axios from 'axios';
import { X, Loader2, Save, UserPlus, Trash2, CheckCircle, Search, Sparkles, ShieldCheck, Camera, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage } from './utils/imageUtils';

const GRADE_OPTIONS = [
    { value: 'Nursery', label: 'Nursery' }, { value: 'Prep', label: 'Prep' },
    { value: '1', label: 'Grade 1' }, { value: '2', label: 'Grade 2' },
    { value: '3', label: 'Grade 3' }, { value: '4', label: 'Grade 4' },
    { value: '5', label: 'Grade 5' }, { value: '6', label: 'Grade 6' },
    { value: '7', label: 'Grade 7' }, { value: '8', label: 'Grade 8' },
    { value: '9', label: 'Grade 9' }, { value: '10', label: 'Grade 10' },
    { value: '11', label: '1st Year' }, { value: '12', label: '2nd Year' },
];

const BulkStudentModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false); // ✅ Restored search state
    const [suggestions, setSuggestions] = useState([]); // ✅ Restored suggestions state
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [guardian, setGuardian] = useState({ name: '', cnic: '', phone_number: '', address: '' });
    const [students, setStudents] = useState([
        { name: '', age: '', grade: '', date_joined: new Date().toISOString().split('T')[0], initial_fee: { amount: '', status: 'pending' }, student_image: null, imagePreview: null }
    ]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'phone_number') {
            const digitsOnly = value.replace(/[^\d]/g, '');
            const capped = digitsOnly.slice(0, 11);
            setGuardian(prev => ({ ...prev, [name]: capped }));
            return;
        }

        setGuardian({ ...guardian, [name]: value });
    };

    const handleCnicSearch = async (value) => {
        setGuardian(prev => ({ ...prev, cnic: value }));

        if (value.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            setIsSearching(true);
            const token = localStorage.getItem('access_token');
            // Querying your Django backend
            const response = await axios.get(`http://127.0.0.1:8000/api/guardian/?search=${value}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.results && response.data.results.length > 0) {
                setSuggestions(response.data.results);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } catch (error) {
            console.error("Search error", error);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSuggestion = (foundGuardian) => {
        setGuardian({
            cnic: foundGuardian.cnic,
            name: foundGuardian.name,
            phone_number: foundGuardian.phone_number,
            address: foundGuardian.address || ''
        });
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleStudentChange = (index, field, value) => {
        const updatedStudents = [...students];
        if (field.includes('fee_')) {
            const feeField = field.split('_')[1];
            updatedStudents[index].initial_fee[feeField] = value;
        } else {
            updatedStudents[index][field] = value;
        }
        setStudents(updatedStudents);
    };

    const handleImageChange = async (index, file) => {
        if (!file) return;
        try {
            const compressed = await compressImage(file, { maxWidth: 500, maxHeight: 500, quality: 0.8 });
            const updatedStudents = [...students];
            updatedStudents[index].student_image = compressed;
            const reader = new FileReader();
            reader.onloadend = () => {
                updatedStudents[index].imagePreview = reader.result;
                setStudents([...updatedStudents]);
            };
            reader.readAsDataURL(compressed);
        } catch (err) {
            console.error("Image processing error", err);
        }
    };

    const addStudentRow = () => {
        setStudents([...students, { name: '', age: '', grade: '', date_joined: new Date().toISOString().split('T')[0], initial_fee: { amount: '', status: 'pending' }, student_image: null, imagePreview: null }]);
    };

    const removeStudentRow = (index) => {
        if (students.length > 1) {
            setStudents(students.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // ✅ Revert to original JSON structure as requested
        const payload = {
            guardian: guardian,
            students: students.map(s => ({
                name: s.name,
                age: s.age,
                grade: s.grade,
                date_joined: s.date_joined,
                student_image: s.imagePreview, // Send base64 string
                initial_fee: s.initial_fee.amount ? {
                    ...s.initial_fee,
                    month_paid_for: new Date().toISOString().split('T')[0]
                } : null
            }))
        };

        try {
            const token = localStorage.getItem('access_token');
            await axios.post('http://127.0.0.1:8000/api/bulk-enroll-students', payload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Back to application/json default
                }
            });

            onSuccess();
            onClose();
            // Reset state
            setStudents([{ name: '', age: '', grade: '', date_joined: new Date().toISOString().split('T')[0], initial_fee: { amount: '', status: 'pending' }, student_image: null, imagePreview: null }]);
            setGuardian({ name: '', cnic: '', phone_number: '', address: '' });
        } catch (error) {
            console.error("Bulk upload failed:", error);
            alert("Failed to enroll students.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl shadow-black"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-purple-600/10 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight italic">Batch Enrollment</h2>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Processing Multi-Node Identity</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-slate-400 transition-all border border-white/5"><X size={20} /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                        {/* Guardian Section */}
                        <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] relative z-[110]">
                            <div className="flex items-center gap-2 mb-6">
                                <ShieldCheck className="text-blue-400" size={18} />
                                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Overseer Credentials (Guardian)</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="relative">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">CNIC Search</label>
                                    <div className="relative group">
                                        <input
                                            value={guardian.cnic}
                                            placeholder="00000-0000000-0"
                                            autoComplete="off"
                                            onChange={(e) => handleCnicSearch(e.target.value)}
                                            className="w-full p-4 pl-12 bg-slate-950/50 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono text-sm"
                                        />
                                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                        {isSearching && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />}
                                    </div>

                                    {/* ✅ RESTORED SUGGESTIONS DROPDOWN */}
                                    {showSuggestions && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[120]">
                                            {suggestions.map((s, i) => (
                                                <div key={i} onClick={() => selectSuggestion(s)} className="p-4 hover:bg-blue-500/10 cursor-pointer border-b border-white/5 flex items-center gap-3 transition-colors">
                                                    <CheckCircle size={16} className="text-emerald-400" />
                                                    <div>
                                                        <div className="text-sm font-bold text-white">{s.name}</div>
                                                        <div className="text-[10px] text-slate-500 font-mono tracking-tighter">{s.cnic}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Full Identity Name</label>
                                    <input value={guardian.name} placeholder="Overseer Name" required onChange={(e) => setGuardian({ ...guardian, name: e.target.value })} className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold" />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2 ml-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Contact String</label>
                                        <span className="text-[8px] font-black text-blue-500/50 uppercase italic tracking-tighter">Format: 03130753830</span>
                                    </div>
                                    <input
                                        name="phone_number"
                                        value={guardian.phone_number}
                                        placeholder="03130753830"
                                        required
                                        onChange={handleChange}
                                        className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono text-sm"
                                    />
                                </div>

                                {/* ✅ ADDED: Residential Address (Full Width Row) */}
                                <div className="col-span-1 md:col-span-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Residential Address</label>
                                    <input
                                        value={guardian.address}
                                        placeholder="House #, Street, Area, City"
                                        required
                                        onChange={(e) => setGuardian({ ...guardian, address: e.target.value })}
                                        className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Students List */}
                        <div className="space-y-6 relative z-0">
                            {students.map((student, index) => (
                                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={index} className="bg-white/[0.03] border border-white/5 p-8 rounded-[2rem] relative group/row">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Identity Node #{index + 1}</h3>
                                        {students.length > 1 && (
                                            <button type="button" onClick={() => removeStudentRow(index)} className="p-2 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500 transition-all hover:text-white border border-rose-500/20 md:opacity-0 md:group-hover/row:opacity-100">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                        {/* Image Preview / Upload Small */}
                                        <div className="md:col-span-1">
                                            <label className="relative group/img cursor-pointer block">
                                                <div className={`w-12 h-12 rounded-xl border border-dashed flex items-center justify-center overflow-hidden transition-all ${student.imagePreview ? 'border-blue-500/50' : 'border-white/10 group-hover/img:border-blue-500/30'}`}>
                                                    {student.imagePreview ? (
                                                        <img src={student.imagePreview} alt="S" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon size={14} className="text-slate-600" />
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-lg shadow-lg opacity-0 group-hover/img:opacity-100 transition-all scale-75">
                                                    <Camera size={10} />
                                                </div>
                                                <input type="file" accept="image/*" onChange={(e) => handleImageChange(index, e.target.files[0])} className="hidden" />
                                            </label>
                                        </div>

                                        <div className="md:col-span-3">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 block">Legal Name</label>
                                            <input value={student.name} onChange={(e) => handleStudentChange(index, 'name', e.target.value)} required className="w-full p-2.5 bg-slate-950/30 border border-white/5 rounded-xl text-white outline-none focus:border-blue-500/50 font-bold text-sm" placeholder="Name" />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 block">Age</label>
                                            <input type="number" value={student.age} onChange={(e) => handleStudentChange(index, 'age', e.target.value)} required className="w-full p-2.5 bg-slate-950/30 border border-white/5 rounded-xl text-white outline-none focus:border-blue-500/50 text-sm" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 block">Rank</label>
                                            <select value={student.grade} onChange={(e) => handleStudentChange(index, 'grade', e.target.value)} required className="w-full p-2.5 bg-slate-950/30 border border-white/5 rounded-xl text-slate-300 outline-none focus:border-blue-500/50 appearance-none text-xs">
                                                <option value="">Select</option>
                                                {GRADE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest mb-1 block">Fee</label>
                                            <input type="number" value={student.initial_fee.amount} onChange={(e) => handleStudentChange(index, 'fee_amount', e.target.value)} className="w-full p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-400 outline-none focus:border-emerald-500/50 font-bold text-sm" placeholder="Rs." />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest mb-1 block">Status</label>
                                            <select value={student.initial_fee.status} onChange={(e) => handleStudentChange(index, 'fee_status', e.target.value)} className="w-full p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-400 outline-none focus:border-emerald-500/50 appearance-none font-black text-xs">
                                                <option value="paid">PAID</option>
                                                <option value="pending">PENDING</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex justify-center pb-4">
                            <button type="button" onClick={addStudentRow} className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all transform hover:scale-105 active:scale-95">
                                <UserPlus size={18} className="text-blue-400" /> Add Identity Node
                            </button>
                        </div>
                    </form>

                    <div className="p-8 bg-slate-950/30 border-t border-white/5 flex justify-end gap-4 shrink-0">
                        <button onClick={onClose} className="px-8 py-3 rounded-2xl text-slate-500 hover:text-white font-black transition-all uppercase text-[10px] tracking-widest">Abort</button>
                        <button onClick={handleSubmit} disabled={loading} className="px-10 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Commit Data</>}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BulkStudentModal;
