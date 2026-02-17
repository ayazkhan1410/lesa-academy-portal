import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';
import {
  Search, FileDown, Filter, Edit, Trash2,
  ChevronLeft, ChevronRight, Loader2, X
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
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedGrade, setSelectedGrade] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    let result = students;

    if (searchTerm) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.guardian_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedGrade !== 'All') {
      result = result.filter(s => s.grade === selectedGrade);
    }

    setFilteredStudents(result);
    setCurrentPage(1);
  }, [searchTerm, selectedGrade, students]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://127.0.0.1:8000/api/students/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = response.data.results || response.data;
      setStudents(Array.isArray(data) ? [...data].sort((a, b) => b.id - a.id) : []);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("The Learning & Educational Science Academy", 14, 20);
    doc.setFontSize(10);
    doc.text(`Student List Report - ${selectedGrade === 'All' ? 'All Classes' : selectedGrade}`, 14, 28);

    const tableColumn = ["ID", "Name", "Grade", "Guardian", "Phone", "Fee Status"];
    const tableRows = [];

    filteredStudents.forEach(student => {
      tableRows.push([
        student.id,
        student.name,
        student.grade,
        student.guardian_name,
        student.guardian_phone,
        student.latest_fee_status === 'paid' ? "Paid" : "Pending"
      ]);
    });

    // ✅ FIXED: Calling autoTable as a function and passing 'doc'
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`student_list_report.pdf`);
    toast.success("PDF Downloaded");
  };

  const handleEditClick = async (id) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://127.0.0.1:8000/api/students/${id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setEditingStudent(response.data);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Could not fetch details");
    }
  };

  const confirmDelete = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!studentToDelete) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://127.0.0.1:8000/api/students/${studentToDelete.id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success("Student removed");
      fetchStudents();
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden font-sans text-slate-200">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-8 relative z-10">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Student Detail List</h2>
            <p className="text-slate-400 text-sm font-medium mt-1">Manage and view all enrolled student records.</p>
          </div>
          <button onClick={generatePDF} className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 px-4 py-3 rounded-xl flex items-center gap-2 font-bold hover:bg-emerald-600 hover:text-white transition-all text-sm shadow-lg shadow-emerald-900/20">
            <FileDown size={18} /> Export List PDF
          </button>
        </header>

        {/* ✅ FIXED: Controls Bar has z-index 50 to float ABOVE the table */}
        <div className="relative z-50 bg-slate-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xl">

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-bold border transition-all ${selectedGrade !== 'All' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' : 'bg-slate-950/50 text-slate-400 border-white/10 hover:border-white/20'}`}
            >
              <Filter size={16} />
              {selectedGrade === 'All' ? 'Filter by Class' : `Class: ${selectedGrade}`}
            </button>

            {/* ✅ FIXED: Dropdown Menu Visuals */}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full left-0 mt-2 w-56 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar z-[100]"
                >
                  {GRADE_OPTIONS.map(grade => (
                    <button
                      key={grade}
                      onClick={() => { setSelectedGrade(grade); setIsFilterOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-xs font-bold transition-all border-b border-white/5 last:border-0 flex items-center justify-between ${selectedGrade === grade ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      {grade === 'All' ? 'Show All Classes' : `Grade ${grade}`}
                      {selectedGrade === grade && <div className="w-2 h-2 rounded-full bg-white" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/50 border border-white/5 outline-none focus:border-blue-500/50 text-white text-sm font-medium transition-all focus:ring-4 focus:ring-blue-500/10"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ✅ FIXED: Table Container has z-index 0 to stay BELOW the controls */}
        <div className="relative z-0 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl flex-1 flex flex-col min-h-[500px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-separate border-spacing-y-1 px-4 pt-2">
              <thead className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 bg-[#0f172a]/50 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Class</th>
                  <th className="px-4 py-4">Guardian</th>
                  <th className="px-4 py-4">Fee Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="6" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></td></tr> :
                  currentStudents.length === 0 ? <tr><td colSpan="6" className="py-20 text-center text-slate-500 font-bold">No students found.</td></tr> :
                    currentStudents.map(s => (
                      <tr key={s.id} className="group hover:bg-white/[0.03] transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-blue-400 font-bold rounded-l-xl">#{s.id}</td>
                        <td className="px-4 py-4">
                          <div onClick={() => navigate(`/students/${s.id}`)} className="font-bold text-white text-sm cursor-pointer hover:text-blue-400 transition-colors">{s.name}</div>
                        </td>
                        <td className="px-4 py-4"><span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-700">{s.grade}</span></td>
                        <td className="px-4 py-4 text-xs text-slate-400 font-medium">{s.guardian_name}</td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${s.latest_fee_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {s.latest_fee_status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right rounded-r-xl">
                          <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditClick(s.id)} className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg transition-colors"><Edit size={16} /></button>
                            <button onClick={() => confirmDelete(s)} className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-6 border-t border-white/5 flex justify-between items-center bg-slate-950/30">
            <span className="text-xs text-slate-500 font-bold tracking-wider">Page {currentPage} of {totalPages === 0 ? 1 : totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-500 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-500 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <DeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={executeDelete} studentName={studentToDelete?.name} />
        <StudentModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingStudent(null); }} studentToEdit={editingStudent} onSuccess={() => { fetchStudents(); toast.success('Updated'); }} />

      </main>
    </div>
  );
};

export default StudentList;
