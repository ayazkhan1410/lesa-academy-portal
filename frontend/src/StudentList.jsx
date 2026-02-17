import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf'; 
import autoTable from 'jspdf-autotable';
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
        // ✅ SORT LOGIC: Priority to 'pending', then secondary sort by ID
        const sortedResults = response.data.results.sort((a, b) => {
          if (a.latest_fee_status === 'pending' && b.latest_fee_status !== 'pending') return -1;
          if (a.latest_fee_status !== 'pending' && b.latest_fee_status === 'pending') return 1;
          return b.id - a.id; // Keep newest students first within the same status
        });
        
        setStudents(sortedResults);
        setTotalCount(response.data.count);
      } else {
        const flatData = Array.isArray(response.data) ? response.data : [];
        const sortedFlat = flatData.sort((a, b) => {
          if (a.latest_fee_status === 'pending' && b.latest_fee_status !== 'pending') return -1;
          if (a.latest_fee_status !== 'pending' && b.latest_fee_status === 'pending') return 1;
          return b.id - a.id;
        });
        setStudents(sortedFlat);
        setTotalCount(sortedFlat.length);
      }
    } catch (error) {
      toast.error("Sync failed.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedGrade]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const executeDelete = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://127.0.0.1:8000/api/students/${studentToDelete.id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success("Record deleted");
      fetchStudents();
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden font-sans text-slate-200">
      <Toaster position="top-right" />
      <Sidebar />

      <main className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto relative z-10 custom-scrollbar">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter italic">Student Detail List</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1 ml-1">Fee Priority View</p>
          </div>
          <button className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 hover:text-white transition-all">
            <FileDown size={18} /> Export List PDF
          </button>
        </header>

        {/* Filters */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-3xl mb-6 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase bg-slate-950/50 text-slate-400 border border-white/10 hover:border-white/20 transition-all"
            >
              <Filter size={14} /> {selectedGrade === 'All' ? 'Filter Class' : `Class: ${selectedGrade}`}
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 mt-3 w-48 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                  {GRADE_OPTIONS.map(grade => (
                    <button key={grade} onClick={() => { setSelectedGrade(grade); setIsFilterOpen(false); setCurrentPage(1); }} className="w-full text-left px-5 py-3 text-[10px] font-black uppercase text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                      Grade {grade}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <input 
              type="text" placeholder="Search..." value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-950/50 border border-white/5 text-xs font-bold text-white outline-none focus:border-blue-500/50" 
            />
          </div>
        </div>

        {/* ✅ Table Container: Auto-height for clean scroll-free design */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2 px-6">
              <thead className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 bg-[#0f172a]/50 backdrop-blur-md">
                <tr>
                  <th className="py-5 px-4">ID</th>
                  <th className="py-5 px-2">Student Name</th>
                  <th className="py-5 px-2">Grade</th>
                  <th className="py-5 px-2 text-center">Fee Status</th>
                  <th className="py-5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></td></tr>
                ) : (
                  students.map(s => (
                    <tr key={s.id} className={`group transition-all ${s.latest_fee_status === 'pending' ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'bg-white/[0.02] hover:bg-white/[0.05]'}`}>
                      <td className="py-4 px-4 font-mono text-[10px] text-blue-400 font-bold rounded-l-2xl">#{s.id}</td>
                      <td className="py-4 px-2 font-black text-white text-sm cursor-pointer hover:text-blue-400" onClick={() => navigate(`/students/${s.id}`)}>{s.name}</td>
                      <td className="py-4 px-2"><span className="px-3 py-1 bg-slate-950 rounded-lg text-[10px] font-black text-slate-400">{s.grade}</span></td>
                      <td className="py-4 px-2 text-center">
                        <span className={`px-4 py-1 rounded-xl text-[9px] font-black uppercase border ${s.latest_fee_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          {s.latest_fee_status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right rounded-r-2xl">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => { setEditingStudent(s); setIsModalOpen(true); }} className="p-2 hover:bg-blue-600 rounded-lg"><Edit size={14} /></button>
                          <button onClick={() => confirmDelete(s)} className="p-2 hover:bg-rose-600 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Centered Pagination */}
          <div className="p-8 border-t border-white/5 bg-slate-950/30 flex flex-col items-center gap-4 rounded-b-[2.5rem]">
            <div className="flex items-center gap-4">
              <button 
                disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                className="p-3 bg-slate-950 border border-white/5 rounded-2xl hover:bg-blue-600 disabled:opacity-20 transition-all shadow-xl"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="px-8 py-2 bg-slate-950 rounded-2xl border border-white/5 font-black text-[10px] uppercase tracking-widest text-slate-400">
                Page <span className="text-blue-500 mx-1">{currentPage}</span> of {totalPages || 1}
              </div>
              <button 
                disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}
                className="p-3 bg-slate-950 border border-white/5 rounded-2xl hover:bg-blue-600 disabled:opacity-20 transition-all shadow-xl"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <DeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={executeDelete} studentName={studentToDelete?.name} />
        <StudentModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingStudent(null); }} studentToEdit={editingStudent} onSuccess={() => fetchStudents()} />
      </main>
    </div>
  );
};

export default StudentList;
