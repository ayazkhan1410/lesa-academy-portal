import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    ArrowLeft, User, Phone, MapPin, CreditCard, Calendar,
    Hash, FileText, LayoutDashboard, Users, Edit2, Image as ImageIcon,
    ChevronLeft, ChevronRight, MessageSquare, Award, BookOpen,
    TrendingUp, FileDown, PlusCircle, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentModal from './PaymentModal';
import MessageModal from './MessageModal';
import TestRecordModal from './TestRecordModal';
import toast from 'react-hot-toast';

const StudentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [academicData, setAcademicData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, academic, fees

    // Modals
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);

    // Pagination for Fees
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchAcademicSummary = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`http://127.0.0.1:8000/api/students/${id}/academic-summary/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAcademicData(response.data);
        } catch (error) {
            console.error("Error fetching academic data:", error);
        }
    }, [id]);

    const fetchStudent = async (page = 1) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`http://127.0.0.1:8000/api/students/${id}/?page=${page}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStudent(response.data);

            if (response.data.payments_paginated) {
                setTotalPages(Math.ceil(response.data.payments_paginated.count / 10));
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudent();
        fetchAcademicSummary();
    }, [id, fetchAcademicSummary]);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        fetchStudent(newPage);
    };

    const generateReportCard = () => {
        if (!academicData) return;

        const doc = new jsPDF();
        const summary = academicData.summary;
        const records = academicData.test_records;

        // Header
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("LESA ACADEMY PORTAL", 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("OFFICIAL ACADEMIC PROGRESS REPORT", 105, 28, { align: 'center' });

        // Student Info Section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Student Name: ${student.name}`, 15, 55);
        doc.text(`Student ID: ${student.id}`, 150, 55);

        doc.setFont('helvetica', 'normal');
        doc.text(`Grade/Class: Class ${student.grade}`, 15, 65);
        doc.text(`Date of Issue: ${new Date().toLocaleDateString()}`, 150, 65);

        // Position Badge
        doc.setFillColor(59, 130, 246); // blue-500
        doc.roundedRect(15, 75, 180, 25, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`CURRENT CLASS POSITION: ${summary.class_position || 'N/A'}`, 105, 87, { align: 'center' });
        doc.setFontSize(9);
        doc.text(`Out of ${summary.total_students_in_class} Students`, 105, 93, { align: 'center' });

        // Marks Table
        const tableData = records.map(r => [
            r.test_date,
            r.subject,
            r.test_name,
            `${r.obtained_marks} / ${r.total_marks}`,
            `${r.percentage}%`
        ]);

        autoTable(doc, {
            startY: 110,
            head: [['Date', 'Subject', 'Test Name', 'Marks', 'Percentage']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 4 },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        // Summary Footer
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("PERFORMANCE SUMMARY", 15, finalY);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Aggregate Marks: ${summary.total_obtained_marks} / ${summary.total_marks}`, 15, finalY + 10);
        doc.text(`Average Percentage: ${summary.average_percentage}%`, 15, finalY + 18);
        doc.text(`Total Tests Attempted: ${summary.total_tests_conducted}`, 15, finalY + 26);

        // Signatures
        doc.setDrawColor(203, 213, 225);
        doc.line(15, finalY + 60, 75, finalY + 60);
        doc.text("Class Teacher", 35, finalY + 65, { align: 'center' });

        doc.line(135, finalY + 60, 195, finalY + 60);
        doc.text("Academy Principal", 165, finalY + 65, { align: 'center' });

        doc.save(`${student.name}_Report_Card.pdf`);
        toast.success("Report card generated successfully!");
    };

    if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white font-bold">Loading Record...</div>;
    if (!student) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-red-500 font-bold">Student Not Found</div>;

    const TabButton = ({ id, label, icon: Icon, color }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest border ${activeTab === id
                ? `bg-${color}-600/10 text-${color}-400 border-${color}-500/30 shadow-lg shadow-${color}-500/10`
                : 'bg-slate-900/50 text-slate-500 border-white/5 hover:border-white/10'
                }`}
        >
            <Icon size={16} /> {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-6 md:p-10">
            <div className="max-w-6xl mx-auto">

                {/* Navigation */}
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                    <div className="flex gap-4">
                        <button onClick={() => navigate('/')} className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white px-5 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider border border-white/5">
                            <LayoutDashboard size={16} /> Dashboard
                        </button>
                        <button onClick={() => navigate('/students')} className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 px-5 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider border border-blue-500/20">
                            <Users size={16} /> Student List
                        </button>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex gap-3 bg-slate-900/40 p-1.5 rounded-[1.5rem] border border-white/5">
                        <TabButton id="overview" label="Overview" icon={User} color="blue" />
                        <TabButton id="academic" label="Academic" icon={Award} color="indigo" />
                        <TabButton id="fees" label="Fees" icon={CreditCard} color="emerald" />
                    </div>
                </div>

                {/* Header Card */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] pointer-events-none rounded-full" />
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-blue-900/50 overflow-hidden shrink-0 border-4 border-slate-900">
                            {student.student_image ? (
                                <img src={student.student_image.startsWith('http') ? student.student_image : `http://127.0.0.1:8000${student.student_image}`} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                                student.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white italic tracking-tight mb-2 uppercase">{student.name}</h1>
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-700 flex items-center gap-2">
                                    <Hash size={12} /> ID: {student.id}
                                </span>
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${student.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${student.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    {student.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 px-8 py-5 rounded-3xl border border-slate-700 text-right relative z-10">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Current Enrollment</p>
                        <p className="text-3xl font-black text-white italic tracking-tighter">Class {student.grade}</p>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
                                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                                        <User className="text-blue-500" size={20} />
                                        <h3 className="text-lg font-black text-white italic tracking-tight uppercase">Student Details</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <InfoField label="Full Name" value={student.name} />
                                        <InfoField label="Age" value={`${student.age} Years`} />
                                        <InfoField label="Date of Admission" value={student.date_joined} icon={<Calendar size={14} />} />
                                        <InfoField label="Current Grade" value={`Class ${student.grade}`} icon={<BookOpen size={14} />} />
                                    </div>
                                </section>

                                <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <Users className="text-indigo-500" size={20} />
                                            <h3 className="text-lg font-black text-white italic tracking-tight uppercase">Guardian Information</h3>
                                        </div>
                                        <button onClick={() => setIsMessageModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                                            <MessageSquare size={14} /> Send SMS
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <InfoField label="Father/Guardian" value={student.guardian?.name || student.guardian_name} />
                                        <InfoField label="CNIC Number" value={student.guardian?.cnic || student.guardian_cnic} icon={<FileText size={14} />} />
                                        <InfoField label="Phone Number" value={student.guardian?.phone_number || student.guardian_phone} icon={<Phone size={14} />} color="indigo" />
                                        <InfoField label="Last Message" value={student.last_message_send ? new Date(student.last_message_send).toLocaleString() : "Never"} icon={<MessageSquare size={14} />} />
                                        <div className="md:col-span-2">
                                            <InfoField label="Home Address" value={student.guardian?.address || student.address} icon={<MapPin size={14} />} />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="lg:col-span-1 space-y-8">
                                <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-8 flex flex-col items-center text-center">
                                    <div className="bg-indigo-600 p-4 rounded-full text-white mb-4 shadow-lg shadow-indigo-600/30">
                                        <Award size={32} />
                                    </div>
                                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Academic Rank</h4>
                                    <p className="text-5xl font-black text-white italic mb-2 tracking-tighter">
                                        {academicData?.summary?.class_position ? `${academicData.summary.class_position}` : '--'}
                                        <span className="text-xl text-indigo-400 font-bold tracking-normal ml-1">/ {academicData?.summary?.total_students_in_class || '--'}</span>
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">In Grade {student.grade}</p>
                                </div>
                                <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-3xl p-8 flex flex-col items-center text-center">
                                    <div className="bg-emerald-600 p-4 rounded-full text-white mb-4 shadow-lg shadow-emerald-600/30">
                                        <TrendingUp size={32} />
                                    </div>
                                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Fee Status</h4>
                                    <p className={`text-3xl font-black italic tracking-tighter ${student.latest_fee_status === 'paid' ? 'text-white' : 'text-amber-400'}`}>
                                        {student.latest_fee_status === 'paid' ? 'CLEAR' : 'REMAINING'}
                                    </p>
                                    <button onClick={() => setActiveTab('fees')} className="mt-4 text-[10px] font-black text-emerald-500 hover:text-white uppercase tracking-widest">View Ledger →</button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'academic' && (
                        <motion.div key="academic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                            <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-indigo-600/20 p-3 rounded-2xl text-indigo-400">
                                            <Award size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Academic Performance</h3>
                                            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Aggregate Results & Tracking</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <button onClick={generateReportCard} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-white/5">
                                            <FileDown size={14} /> Print Report
                                        </button>
                                        <button onClick={() => setIsTestModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                                            <PlusCircle size={14} /> Add Test Record
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                                    <SummaryCard label="Class Position" value={`${academicData?.summary?.class_position || '--'}`} sub={`Out of ${academicData?.summary?.total_students_in_class || '--'}`} color="blue" />
                                    <SummaryCard label="Average Score" value={`${Math.round(academicData?.summary?.average_percentage || 0)}%`} sub="Overall Percentage" color="indigo" />
                                    <SummaryCard label="Tests Attempted" value={academicData?.summary?.total_tests_conducted || 0} sub="Academic Evaluations" color="amber" />
                                    <SummaryCard label="Total Marks" value={academicData?.summary?.total_obtained_marks || 0} sub={`Out of ${academicData?.summary?.total_marks || 0}`} color="emerald" />
                                </div>

                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/5 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                <th className="text-left py-4 px-2">Date</th>
                                                <th className="text-left py-4 px-2">Subject</th>
                                                <th className="text-left py-4 px-2">Test Name</th>
                                                <th className="text-left py-4 px-2">Obtained Marks</th>
                                                <th className="text-left py-4 px-2">Percentage</th>
                                                <th className="text-right py-4 px-2">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {academicData?.test_records?.length > 0 ? (
                                                academicData.test_records.map((record) => (
                                                    <tr key={record.id} className="group hover:bg-white/5 transition-all">
                                                        <td className="py-5 px-2 text-sm font-bold text-slate-400">{record.test_date}</td>
                                                        <td className="py-5 px-2">
                                                            <span className="text-sm font-black text-white px-3 py-1 bg-slate-800 rounded-lg">{record.subject}</span>
                                                        </td>
                                                        <td className="py-5 px-2 text-sm font-bold text-slate-300">{record.test_name}</td>
                                                        <td className="py-5 px-2 text-sm font-black text-white">{record.obtained_marks} <span className="text-slate-500 font-medium">/ {record.total_marks}</span></td>
                                                        <td className="py-5 px-2">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-black text-white">{record.percentage}%</span>
                                                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden md:block">
                                                                    <div className={`h-full rounded-full ${parseFloat(record.percentage) > 50 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${record.percentage}%` }} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-5 px-2 text-right">
                                                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${parseFloat(record.percentage) >= 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                                {parseFloat(record.percentage) >= 50 ? 'Passed' : 'Failed'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan="6" className="py-20 text-center text-slate-500 font-bold italic">No academic records found for this student.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'fees' && (
                        <motion.div key="fees" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="text-emerald-500" size={20} />
                                            <h3 className="text-lg font-black text-white italic tracking-tight uppercase">Payment Ledger</h3>
                                        </div>
                                        <button onClick={() => setIsPaymentModalOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20">
                                            <PlusCircle size={14} /> Post Payment
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {student.payments && student.payments.length > 0 ? (
                                            student.payments.map((payment) => (
                                                <div key={payment.id} className="flex items-center justify-between p-6 bg-slate-950/40 border border-white/5 rounded-[1.5rem] group hover:border-emerald-500/30 transition-all">
                                                    <div className="flex items-center gap-6">
                                                        <div className="bg-slate-900 p-3 rounded-2xl text-slate-400 group-hover:text-emerald-400">
                                                            <Calendar size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xl font-black text-white italic tracking-tight">Rs. {payment.amount}</p>
                                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                                {new Date(payment.month_paid_for).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {payment.screenshot && (
                                                            <a href={`http://127.0.0.1:8000${payment.screenshot}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all" title="View Proof">
                                                                <ImageIcon size={18} />
                                                            </a>
                                                        )}
                                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${payment.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                            {payment.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-slate-600 text-sm text-center py-20 italic">No formal payment history found.</div>
                                        )}
                                    </div>

                                    {student.payments && student.payments.length > 0 && totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Page {currentPage} of {totalPages}</p>
                                            <div className="flex gap-2">
                                                <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="p-3 bg-slate-900 border border-white/5 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                                    <ChevronLeft size={20} />
                                                </button>
                                                <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="p-3 bg-slate-900 border border-white/5 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>

                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Aggregate Financials</h4>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest group-hover:text-emerald-400 transition-colors">Total Paid</span>
                                            <span className="text-xl font-black text-white italic">Rs. {student.total_fees_paid || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest group-hover:text-rose-400 transition-colors">Pending</span>
                                            <span className="text-xl font-black text-rose-400 italic">Rs. {student.total_fees_pending || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modals */}
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    studentId={student?.id}
                    studentName={student?.name}
                    currentAmount={student?.payments?.[0]?.amount}
                    onSuccess={() => fetchStudent(currentPage)}
                />

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

                <TestRecordModal
                    isOpen={isTestModalOpen}
                    onClose={() => setIsTestModalOpen(false)}
                    studentId={student?.id}
                    studentName={student?.name}
                    onSuccess={fetchAcademicSummary}
                />

            </div>
        </div>
    );
};

const InfoField = ({ label, value, icon, color = "blue" }) => (
    <div className="group">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-hover:text-white transition-colors">{label}</p>
        <div className={`flex items-center gap-3 text-base font-bold ${color === 'indigo' ? 'text-indigo-300' : 'text-white'}`}>
            <span className={`text-${color}-500/50 group-hover:text-${color}-400 transition-colors`}>{icon}</span>
            {value || "N/A"}
        </div>
    </div>
);

const SummaryCard = ({ label, value, sub, color }) => (
    <div className={`p-6 rounded-2xl bg-${color}-600/5 border border-${color}-500/10`}>
        <p className={`text-[9px] font-black uppercase tracking-widest text-${color}-500 mb-2`}>{label}</p>
        <p className="text-2xl font-black text-white italic tracking-tighter mb-1 uppercase">{value}</p>
        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{sub}</p>
    </div>
);

export default StudentDetail;