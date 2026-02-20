import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, User, Phone, MapPin, CreditCard, Calendar,
    Hash, FileText, LayoutDashboard, Users, Edit2, Image as ImageIcon,
    ChevronLeft, ChevronRight, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import PaymentModal from './PaymentModal';
import MessageModal from './MessageModal';

const StudentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

    // Refactored fetch function with pagination support
    const fetchStudent = async (page = 1) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`http://127.0.0.1:8000/api/students/${id}/?page=${page}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStudent(response.data);

            // Update pagination state if backend returns paginated payments
            if (response.data.payments_paginated) {
                setTotalPages(Math.ceil(response.data.payments_paginated.count / 10));
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle page changes
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        fetchStudent(newPage);
    };

    useEffect(() => {
        fetchStudent();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white font-bold">Loading Record...</div>;
    if (!student) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-red-500 font-bold">Student Not Found</div>;

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-6 md:p-10">
            <div className="max-w-6xl mx-auto">

                {/* ✅ UPDATED: Dual Navigation Buttons */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white px-5 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider border border-white/5"
                    >
                        <LayoutDashboard size={16} /> Dashboard
                    </button>

                    <button
                        onClick={() => navigate('/students')}
                        className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 px-5 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider border border-blue-500/20"
                    >
                        <Users size={16} /> Back to Student List
                    </button>
                </div>

                {/* Header Card */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-900/50 overflow-hidden shrink-0">
                            {student.student_image ? (
                                <img src={student.student_image.startsWith('http') ? student.student_image : `http://127.0.0.1:8000${student.student_image}`} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                                student.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{student.name}</h1>
                            <div className="flex gap-3">
                                <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-2">
                                    <Hash size={12} /> Student ID: {student.id}
                                </span>
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-2 ${student.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                    <div className={`w-2 h-2 rounded-full ${student.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    {student.is_active ? 'Active Student' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 px-6 py-4 rounded-2xl border border-slate-700 text-right">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Current Class</p>
                        <p className="text-2xl font-black text-white">Grade {student.grade}</p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Personal & Guardian Info */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Section 1: Personal Details */}
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                                <User className="text-blue-500" size={20} />
                                <h3 className="text-lg font-bold text-white">Student Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                <InfoField label="Full Name" value={student.name} />
                                <InfoField label="Age" value={`${student.age} Years`} />
                                <InfoField label="Date of Admission" value={student.date_joined} />
                                <InfoField label="Current Grade" value={`Class ${student.grade}`} />
                            </div>
                        </motion.div>

                        {/* Section 2: Guardian Details */}
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <User className="text-indigo-500" size={20} />
                                    <h3 className="text-lg font-bold text-white">Guardian / Father Details</h3>
                                </div>
                                <button
                                    onClick={() => setIsMessageModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl transition-all text-xs font-bold uppercase tracking-wider border border-blue-500/20 hover:border-blue-600"
                                >
                                    <MessageSquare size={14} /> Send Message
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                <InfoField label="Father Name" value={student.guardian?.name || student.guardian_name} />
                                <InfoField label="CNIC Number" value={student.guardian?.cnic || student.guardian_cnic} icon={<FileText size={14} className="inline mr-1" />} />
                                <div className="md:col-span-1">
                                    <InfoField
                                        label="Last SMS Sent"
                                        value={student.last_message_send ? new Date(student.last_message_send).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : "Never Sent"}
                                        icon={<MessageSquare size={14} className="inline mr-1 text-indigo-400" />}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Phone Number</p>
                                    <div className="flex items-center gap-3 text-lg font-bold text-indigo-300">
                                        <Phone size={18} /> {student.guardian?.phone_number || student.guardian_phone}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Home Address</p>
                                    <div className="flex items-center gap-3 text-base font-medium text-slate-300">
                                        <MapPin size={18} /> {student.guardian?.address || student.address}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Fees */}
                    <div className="lg:col-span-1">
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 h-full">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="text-emerald-500" size={20} />
                                    <h3 className="text-lg font-bold text-white">Fee Summary</h3>
                                </div>
                                {/* ✅ NEW: EDIT BUTTON */}
                                <button
                                    onClick={() => setIsPaymentModalOpen(true)}
                                    className="p-2 bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-all"
                                    title="Update Fee Status"
                                >
                                    <Edit2 size={16} />
                                </button>
                            </div>

                            {/* Fee Status Card */}
                            <div className={`p-6 rounded-2xl mb-8 border ${student.latest_fee_status === 'paid' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                                <p className="text-xs font-black uppercase opacity-70 mb-1">{student.latest_fee_status === 'paid' ? 'Current Status' : 'Attention Needed'}</p>
                                <p className={`text-2xl font-black ${student.latest_fee_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {student.latest_fee_status === 'paid' ? 'FULLY PAID' : 'PENDING'}
                                </p>
                            </div>

                            {/* Payment History List */}
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Payment History</h4>
                            <div className="space-y-3">
                                {student.payments && student.payments.length > 0 ? (
                                    student.payments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-2xl mb-3 group hover:border-blue-500/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-slate-900 p-2 rounded-xl text-slate-400 group-hover:text-blue-400">
                                                    <Calendar size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white">Rs. {payment.amount}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                        {new Date(payment.month_paid_for).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* ✅ NEW: VIEW PROOF BUTTON */}
                                                {payment.screenshot && (
                                                    <a
                                                        href={`http://127.0.0.1:8000${payment.screenshot}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                                        title="View Payment Proof"
                                                    >
                                                        <ImageIcon size={14} />
                                                    </a>
                                                )}

                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${payment.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                                    }`}>
                                                    {payment.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-slate-600 text-sm text-center py-4 italic">No payment history found.</div>
                                )}
                            </div>

                            {/* --- PAGINATION CONTROLS --- */}
                            {student.payments && student.payments.length > 0 && totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 px-2">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                        Page {currentPage} of {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            className="p-2 bg-slate-900 border border-white/5 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            className="p-2 bg-slate-900 border border-white/5 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Total Stats */}
                            <div className="mt-8 pt-6 border-t border-slate-800">
                                <div className="flex justify-between mb-2">
                                    <span className="text-slate-500 text-sm font-medium">Total Paid</span>
                                    <span className="text-white font-bold">Rs. {student.total_fees_paid || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 text-sm font-medium">Total Pending</span>
                                    <span className="text-rose-400 font-bold">Rs. {student.total_fees_pending || 0}</span>
                                </div>
                            </div>

                        </motion.div>
                    </div>

                </div>

                {/* ✅ PAYMENT MODAL */}
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    studentId={student?.id}
                    studentName={student?.name}
                    currentAmount={student?.payments?.[0]?.amount}
                    onSuccess={() => {
                        // Reload the page to see the green status immediately
                        window.location.reload();
                    }}
                />

                {/* Message Modal */}
                <MessageModal
                    isOpen={isMessageModalOpen}
                    onClose={() => setIsMessageModalOpen(false)}
                    students={student ? [{
                        id: student.id,
                        name: student.name,
                        guardian_name: student.guardian?.name || student.guardian_name,
                        guardian_phone: student.guardian?.phone_number || student.guardian_phone
                    }] : []}
                />

            </div>
        </div>
    );
};

const InfoField = ({ label, value, icon }) => (
    <div>
        <p className="text-xs font-bold text-slate-500 uppercase mb-1">{label}</p>
        <p className="text-base font-bold text-white flex items-center gap-2">{icon} {value || "N/A"}</p>
    </div>
);

export default StudentDetail;