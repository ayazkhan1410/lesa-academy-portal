import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Search, FileDown, Filter, Edit, Trash2,
  ChevronLeft, ChevronRight, Loader2, Users,
  Sun, Moon, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import DeleteModal from './DeleteModal';
import StudentModal from './StudentModal';
import { Sidebar } from './Dashboard';

const GRADE_OPTIONS = ['All', 'Nursery', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const StudentList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Theme
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('dashboardTheme');
    return saved !== 'light';
  });
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('dashboardTheme', next ? 'dark' : 'light');
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({
        page: currentPage,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedGrade !== 'All' && { grade: selectedGrade })
      });

      const response = await axios.get(`http://127.0.0.1:8000/api/students/?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.results) {
        const sortedResults = response.data.results.sort((a, b) => {
          if (a.latest_fee_status === 'pending' && b.latest_fee_status !== 'pending') return -1;
          if (a.latest_fee_status !== 'pending' && b.latest_fee_status === 'pending') return 1;
          return b.id - a.id;
        });
        setStudents(sortedResults);
        setTotalCount(response.data.count);
      } else {
        const flatData = Array.isArray(response.data) ? response.data : [];
        setStudents(flatData);
        setTotalCount(flatData.length);
      }
    } catch (error) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedGrade]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Delete handlers
  const confirmDelete = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://127.0.0.1:8000/api/students/${studentToDelete.id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success("Student record deleted");
      fetchStudents();
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  // PDF Export — fetches ALL students (all pages) and generates PDF
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('access_token');
      // Fetch all students without pagination limit
      let allStudents = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          page: page,
          ...(selectedGrade !== 'All' && { grade: selectedGrade })
        });
        const response = await axios.get(`http://127.0.0.1:8000/api/students/?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.results) {
          allStudents = [...allStudents, ...response.data.results];
          hasMore = response.data.next !== null;
          page++;
        } else {
          allStudents = Array.isArray(response.data) ? response.data : [];
          hasMore = false;
        }
      }

      const doc = new jsPDF();

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('LESA - Educational Science Academy', 14, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Student Records Report • Generated: ${new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })}`, 14, 28);
      doc.text(`Total Students: ${allStudents.length}${selectedGrade !== 'All' ? ` • Grade: ${selectedGrade}` : ''}`, 14, 34);

      // Line separator
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(14, 38, 196, 38);

      // Table
      autoTable(doc, {
        startY: 44,
        head: [['#', 'Student Name', 'Guardian Name', 'Grade', 'Fee Amount', 'Fee Status']],
        body: allStudents.map((s, i) => [
          i + 1,
          s.name,
          s.guardian_name || 'N/A',
          s.grade,
          `Rs. ${(s.fees_amount || 0).toLocaleString()}`,
          s.latest_fee_status === 'paid' ? 'PAID' : s.latest_fee_status === 'pending' ? 'PENDING' : 'NO RECORD',
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          3: { halign: 'center', cellWidth: 22 },
          4: { halign: 'right', cellWidth: 28 },
          5: { halign: 'center', cellWidth: 28 },
        },
        didParseCell: (data) => {
          // Color-code fee status
          if (data.section === 'body' && data.column.index === 5) {
            if (data.cell.raw === 'PENDING') {
              data.cell.styles.textColor = [217, 119, 6];
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.raw === 'PAID') {
              data.cell.styles.textColor = [16, 185, 129];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: 'right' });
        doc.text('LESA Academy • Confidential', 14, 290);
      }

      doc.save(`LESA_Student_Records_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Fee status helpers
  const getStatusConfig = (status) => {
    switch (status) {
      case 'paid': return { label: 'Paid', classes: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200' };
      case 'pending': return { label: 'Pending', classes: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200' };
      default: return { label: 'No Record', classes: isDark ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-slate-100 text-slate-500 border-slate-200' };
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${isDark ? 'bg-[#0a0f1e] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      <Toaster position="top-right" />

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-[-15%] right-[-10%] w-[45%] h-[45%] blur-[140px] rounded-full ${isDark ? 'bg-blue-600' : 'bg-blue-400/40'}`}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className={`absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] blur-[100px] rounded-full ${isDark ? 'bg-indigo-600' : 'bg-indigo-300/40'}`}
        />
      </div>

      <Sidebar isDark={isDark} />

      <main className="flex-1 flex flex-col overflow-y-auto relative z-10">
        <div className="p-6 md:p-8 lg:p-10 max-w-[1400px] mx-auto w-full">

          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Users size={20} className="text-white" />
                </div>
                <h2 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Student Records</h2>
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ml-12 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                Fee Priority View • {totalCount} Entries
              </p>
            </motion.div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className={`p-3 rounded-2xl border backdrop-blur-md transition-all ${isDark ? 'bg-slate-900/60 border-white/10 text-yellow-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isDark ? "dark" : "light"}
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>

              {/* Export PDF */}
              <motion.button
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportPDF}
                disabled={exporting}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border ${exporting
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark
                    ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600 hover:text-white hover:border-emerald-500'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-500'
                  }`}
              >
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                {exporting ? 'Exporting...' : 'Export PDF'}
              </motion.button>
            </div>
          </header>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 justify-between items-center border backdrop-blur-xl transition-colors duration-500 overflow-visible relative z-20 ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}
          >
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${isDark
                  ? 'bg-slate-950/50 text-slate-400 border-white/10 hover:border-white/20'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
              >
                <Filter size={14} /> {selectedGrade === 'All' ? 'Filter Class' : `Class: ${selectedGrade}`}
              </button>
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute top-full left-0 mt-3 w-48 rounded-2xl shadow-2xl z-[100] overflow-hidden border ${isDark ? 'bg-[#1e293b] border-white/10' : 'bg-white border-slate-200'}`}
                  >
                    <div className="max-h-60 overflow-y-auto">
                      {GRADE_OPTIONS.map(grade => (
                        <button
                          key={grade}
                          onClick={() => { setSelectedGrade(grade); setIsFilterOpen(false); setCurrentPage(1); }}
                          className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase transition-all ${selectedGrade === grade
                            ? 'bg-blue-600 text-white'
                            : isDark
                              ? 'text-slate-400 hover:bg-blue-600 hover:text-white'
                              : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                        >
                          {grade === 'All' ? 'All Grades' : `Grade ${grade}`}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative w-full md:w-80">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} size={16} />
              <input
                type="text"
                placeholder="Search by name, guardian, phone..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className={`w-full pl-12 pr-4 py-3 rounded-xl text-xs font-bold outline-none border transition-all ${isDark
                  ? 'bg-slate-950/50 border-white/5 text-white placeholder-slate-600 focus:border-blue-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-400'
                  }`}
              />
            </div>
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-[2rem] border overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-lg shadow-slate-200/50'}`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className={`text-[10px] uppercase tracking-[0.15em] font-black ${isDark ? 'text-slate-500 bg-slate-950/40' : 'text-slate-400 bg-slate-50'}`}>
                    <th className="py-5 px-6">ID</th>
                    <th className="py-5 px-4">Student</th>
                    <th className="py-5 px-4">Guardian</th>
                    <th className="py-5 px-4 text-center">Grade</th>
                    <th className="py-5 px-4 text-right">Fee Amount</th>
                    <th className="py-5 px-4 text-center">Fee Status</th>
                    <th className="py-5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-24 text-center">
                        <Loader2 className="animate-spin mx-auto text-blue-500" size={36} />
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan="7" className={`py-24 text-center text-sm font-medium ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        No students found
                      </td>
                    </tr>
                  ) : (
                    students.map((s, index) => {
                      const statusConfig = getStatusConfig(s.latest_fee_status);
                      return (
                        <motion.tr
                          key={s.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`group transition-all cursor-pointer ${s.latest_fee_status === 'pending'
                            ? isDark ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.08]' : 'bg-amber-50/50 hover:bg-amber-50'
                            : isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-blue-50/50'
                            } ${isDark ? 'border-b border-white/5' : 'border-b border-slate-100'}`}
                          onClick={() => navigate(`/students/${s.id}`)}
                        >
                          <td className="py-4 px-6">
                            <span className="font-mono text-[10px] text-blue-500 font-bold">#{s.id}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0 ${s.latest_fee_status === 'paid'
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                : s.latest_fee_status === 'pending'
                                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                  : 'bg-gradient-to-br from-slate-500 to-slate-600'
                                }`}>
                                {s.name.charAt(0)}
                              </div>
                              <span className={`font-bold text-sm ${isDark ? 'text-white group-hover:text-blue-400' : 'text-slate-800 group-hover:text-blue-600'} transition-colors`}>
                                {s.name}
                              </span>
                            </div>
                          </td>
                          <td className={`py-4 px-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {s.guardian_name || '—'}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                              {s.grade}
                            </span>
                          </td>
                          <td className={`py-4 px-4 text-right text-sm font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>
                            Rs. {(s.fees_amount || 0).toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusConfig.classes}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => { setEditingStudent(s); setIsModalOpen(true); }}
                                className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-blue-600 text-slate-400 hover:text-white' : 'hover:bg-blue-100 text-slate-400 hover:text-blue-600'}`}
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => confirmDelete(s)}
                                className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-rose-600 text-slate-400 hover:text-white' : 'hover:bg-rose-100 text-slate-400 hover:text-rose-600'}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className={`p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark ? 'border-white/5 bg-slate-950/30' : 'border-slate-100 bg-slate-50/50'}`}>
              <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                Showing {students.length} of {totalCount} records
              </p>
              <div className="flex items-center gap-3">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className={`p-2.5 rounded-xl border transition-all disabled:opacity-20 ${isDark ? 'bg-slate-900 border-white/5 hover:bg-blue-600 text-slate-400 hover:text-white' : 'bg-white border-slate-200 hover:bg-blue-600 text-slate-400 hover:text-white'}`}
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : isDark
                          ? 'bg-slate-900 text-slate-400 border border-white/5 hover:bg-slate-800'
                          : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className={`p-2.5 rounded-xl border transition-all disabled:opacity-20 ${isDark ? 'bg-slate-900 border-white/5 hover:bg-blue-600 text-slate-400 hover:text-white' : 'bg-white border-slate-200 hover:bg-blue-600 text-slate-400 hover:text-white'}`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <DeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={executeDelete} studentName={studentToDelete?.name} />
        <StudentModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingStudent(null); }} studentToEdit={editingStudent} onSuccess={() => fetchStudents()} />
      </main>
    </div>
  );
};

export default StudentList;