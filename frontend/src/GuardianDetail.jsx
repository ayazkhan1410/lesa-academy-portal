import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, User, Phone, MapPin,
    CreditCard, LayoutDashboard, UserCheck,
    Users, ArrowUpRight, Loader2, Mail
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Sidebar } from './Dashboard';

const GuardianDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [guardian, setGuardian] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: '',
        cnic: '',
        phone_number: '',
        address: ''
    });
    const [updating, setUpdating] = useState(false);

    // Theme (consistent with Dashboard and StudentList)
    const [isDark] = useState(() => {
        const saved = localStorage.getItem('dashboardTheme');
        return saved !== 'light';
    });

    const fetchGuardian = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`http://127.0.0.1:8000/api/guardian/${id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setGuardian(response.data);
            setEditData({
                name: response.data.name || '',
                cnic: response.data.cnic || '',
                phone_number: response.data.phone_number || '',
                address: response.data.address || ''
            });
        } catch (error) {
            console.error("Error fetching guardian data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone_number') {
            const digitsOnly = value.replace(/[^\d]/g, '');
            const capped = digitsOnly.slice(0, 11);
            setEditData(prev => ({ ...prev, [name]: capped }));
            return;
        }
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
        setUpdating(true);
        const toastId = toast.loading("Updating records...");
        try {
            const token = localStorage.getItem('access_token');
            // Using PATCH as provided in user cURL for partial updates
            await axios.patch(`http://127.0.0.1:8000/api/guardian/${id}/`, editData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Re-fetch the full guardian data to ensure nested students and all fields are synced
            await fetchGuardian();

            setIsEditing(false);
            toast.success("Guardian records updated", { id: toastId });
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Failed to update records", { id: toastId });
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => {
        fetchGuardian();
    }, [id]);

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                    <p className="font-bold animate-pulse">Accessing Guardian Node...</p>
                </div>
            </div>
        );
    }

    if (!guardian) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
                <div className="text-center p-8 rounded-3xl border border-dashed border-red-500/30 bg-red-500/5">
                    <h2 className="text-2xl font-black text-red-500 mb-2">Guardian Not Found</h2>
                    <p className="text-slate-500 mb-6">The requested identity node does not exist or has been removed.</p>
                    <button onClick={() => navigate('/guardians')} className="bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-700 transition-all">
                        Return to Directory
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex h-screen overflow-hidden ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            <Toaster position="top-right" />
            <Sidebar isDark={isDark} />

            <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Navigation */}
                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={() => navigate('/')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider border ${isDark ? 'bg-slate-900 border-white/5 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 shadow-sm'}`}
                        >
                            <LayoutDashboard size={16} /> Dashboard
                        </button>

                        <button
                            onClick={() => navigate('/guardians')}
                            className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 px-5 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider border border-blue-500/20"
                        >
                            <UserCheck size={16} /> Back to Directory
                        </button>
                    </div>

                    {/* Header Perspective */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border ${isDark ? 'bg-slate-900/50 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-blue-500/20">
                                {guardian?.name ? guardian.name.charAt(0) : '?'}
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tight mb-2 italic">{guardian.name}</h1>
                                <div className="flex flex-wrap gap-3">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${isDark ? 'bg-slate-800 text-slate-400 border-white/5' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                        <CreditCard size={12} /> ID: {guardian.cnic}
                                    </span>
                                    <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center gap-2">
                                        <Users size={12} /> {guardian.students?.length || 0} Registered Students
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Guardian Profile Details & Update Section */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className={`lg:col-span-1 p-8 rounded-3xl border flex flex-col transition-all duration-500 ${isDark ? 'bg-slate-900/50 border-white/5 shadow-xl' : 'bg-white border-slate-200 shadow-lg'}`}>
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-3">
                                    <User size={16} /> Identity Specs
                                </h3>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isEditing ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-105'}`}
                                >
                                    {isEditing ? 'Cancel Edit' : 'Modify Record'}
                                </button>
                            </div>

                            {isEditing ? (
                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Legal Name</label>
                                        <input
                                            name="name"
                                            value={editData.name}
                                            onChange={handleEditChange}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div className="group">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Phone Node</label>
                                            <span className="text-[8px] font-black text-blue-500/50 uppercase italic tracking-tighter">03130753830</span>
                                        </div>
                                        <input
                                            name="phone_number"
                                            value={editData.phone_number}
                                            onChange={handleEditChange}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all font-mono"
                                            placeholder="03130753830"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">CNIC Node</label>
                                        <input
                                            name="cnic"
                                            value={editData.cnic}
                                            onChange={handleEditChange}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all font-mono"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Domicile Address</label>
                                        <textarea
                                            name="address"
                                            value={editData.address}
                                            onChange={handleEditChange}
                                            rows="2"
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all resize-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleUpdate}
                                        disabled={updating}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/10 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        {updating ? <Loader2 className="animate-spin" size={16} /> : <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                        Save Changes
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="group">
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 transition-colors ${isDark ? 'text-slate-600 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-500'}`}>Legal Designation</p>
                                        <p className="font-bold text-lg tracking-tight">{guardian.name}</p>
                                    </div>
                                    <div className="group">
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 transition-colors ${isDark ? 'text-slate-600 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-500'}`}>Government ID (CNIC)</p>
                                        <p className="font-mono font-bold text-lg tracking-widest">{guardian.cnic}</p>
                                    </div>
                                    <div className="group">
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 transition-colors ${isDark ? 'text-slate-600 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-500'}`}>Primary Communication</p>
                                        <div className="flex items-center gap-3">
                                            <Phone size={18} className="text-blue-500" />
                                            <p className="font-bold text-lg">{guardian.phone_number}</p>
                                        </div>
                                    </div>
                                    <div className="group pt-4 border-t border-white/5">
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-2.5 transition-colors ${isDark ? 'text-slate-600 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-500'}`}>Registered Domicile</p>
                                        <div className="flex items-start gap-3">
                                            <MapPin size={20} className="text-slate-500 shrink-0 mt-0.5" />
                                            <p className={`text-sm font-bold leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{guardian.address || 'No address provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Associated Student Nodes (Siblings) */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={`lg:col-span-2 p-8 rounded-3xl border ${isDark ? 'bg-slate-900/50 border-white/5 shadow-xl' : 'bg-white border-slate-200 shadow-lg'}`}>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-3">
                                    <Users size={18} /> Connected Student Nodes
                                </h3>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                                    SIBLING CLUSTER
                                </span>
                            </div>

                            {!guardian.students || guardian.students.length === 0 ? (
                                <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-100 bg-slate-50'}`}>
                                    <p className="text-slate-500 font-bold italic">No child nodes linked to this identity.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {guardian.students.map((student, idx) => (
                                        <motion.div
                                            key={student.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 + (idx * 0.1) }}
                                            onClick={() => navigate(`/students/${student.id}`)}
                                            className={`p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${isDark ? 'bg-slate-900 border-white/5 hover:border-blue-500/30 hover:bg-slate-800' : 'bg-white border-slate-100 shadow-sm hover:border-blue-500/30 hover:shadow-md'}`}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center font-black text-lg overflow-hidden border border-blue-500/20 transition-transform group-hover:scale-110">
                                                    {student.student_image ? (
                                                        <img src={student.student_image.startsWith('http') ? student.student_image : `http://127.0.0.1:8000${student.student_image}`} alt={student.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        student.name?.charAt(0) || 'S'
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-md tracking-tight">{student.name}</p>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Grade: {student.grade} • ID: #{student.id}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className={`p-2 rounded-lg transition-all ${isDark ? 'bg-white/5 text-slate-500 group-hover:text-blue-400' : 'bg-slate-50 text-slate-400 group-hover:text-blue-600'}`}>
                                                    <ArrowUpRight size={20} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default GuardianDetail;
