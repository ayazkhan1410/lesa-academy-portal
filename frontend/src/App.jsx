import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users, LayoutDashboard, Plus, Search, MoreHorizontal, LogOut,
  Loader2, Wallet, AlertCircle, Calendar, GraduationCap, Zap, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Login from './Login';
import StudentModal from './StudentModal';
import BulkStudentModal from './BulkStudentModal';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total_students: 0, active_students: 0, total_pending_fees: 0,
    pending_fee_count: 0, total_fees_paid: 0, paid_fee_count: 0
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      fetchStudents();
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isAuthenticated) fetchStudents(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, isAuthenticated]);

  const fetchStudents = async (query = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const url = query
        ? `http://127.0.0.1:8000/api/students/?search=${query}`
        : 'http://127.0.0.1:8000/api/students/';

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = response.data.results || response.data;
      const sortedData = Array.isArray(data) ? [...data].sort((a, b) => b.id - a.id) : [];

      setStudents(sortedData);
      if (response.data.summary) setStats(response.data.summary);

    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) return <Login onLogin={() => { setIsAuthenticated(true); fetchStudents(); }} />;

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden font-sans text-slate-200">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Toaster position="top-right" />

      {/* --- Web 3.0 Sidebar --- */}
      <aside className="w-80 bg-slate-950/50 backdrop-blur-xl border-r border-white/5 hidden lg:flex flex-col z-20">
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-4 mb-4"
          >
            {/* Icon Row */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-fit p-3 rounded-2xl shadow-lg shadow-blue-500/30">
              <Zap size={24} className="text-white fill-white" />
            </div>

            {/* Title Stack */}
            <div className="space-y-1">
              <h1 className="text-xl font-black tracking-tighter text-white leading-tight uppercase">
                The Learning & <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  Educational Science
                </span> <br />
                Academy
              </h1>
              <div className="h-1 w-12 bg-blue-600 rounded-full" /> {/* Aesthetic Divider */}
            </div>
          </motion.div>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-1">
            Advanced Academy v2
          </p>
        </div>

        <nav className="flex-1 px-6 space-y-3 mt-4">
          <NavItem icon={<LayoutDashboard size={20} />} label="Core Overview" active />
          <NavItem icon={<Users size={20} />} label="Student Matrix" />
        </nav>

        <div className="p-8">
          <button onClick={handleLogout} className="group w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all font-bold">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </div>
      </aside>

      {/* --- Main Arena --- */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-5xl font-black text-white tracking-tighter leading-tight">Dashboard</h2>
            <div className="flex items-center gap-2 text-slate-400 mt-2 font-medium">
              <TrendingUp size={16} className="text-emerald-400" />
              <span>
                System active. {students.length === 0
                  ? "Awaiting student registration."
                  : `Tracking ${students.length} active student profiles.`}
              </span>
            </div>
          </motion.div>

          <div className="flex gap-4 w-full md:w-auto">
            <button onClick={() => setIsBulkModalOpen(true)} className="flex-1 md:flex-none bg-slate-800/50 backdrop-blur-md border border-white/10 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-xl">
              <Users size={20} /> Bulk Entry
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-[0_10px_40px_-10px_rgba(37,99,235,0.5)] hover:scale-105 transition-all active:scale-95">
              <Plus size={20} /> New Record
            </button>
          </div>
        </header>

        {/* --- Glass Stats Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard title="Active Enrollment" value={stats.total_students} gradient="from-blue-500 to-cyan-500" trend="+12% this month" icon={<Users />} />
          <StatCard title="Liquidity Gap" value={`Rs. ${stats.total_pending_fees.toLocaleString()}`} gradient="from-rose-500 to-orange-500" trend={`${stats.pending_fee_count} nodes pending`} icon={<AlertCircle />} />
          <StatCard title="Total Collection" value={`Rs. ${stats.total_fees_paid.toLocaleString()}`} gradient="from-emerald-500 to-teal-500" trend="All-time revenue" icon={<Wallet />} />
        </div>

        {/* --- The Glass Table --- */}
        <section className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="p-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <h3 className="text-2xl font-black text-white italic">Recent Enrollment</h3>
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Query database..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-950/50 border border-white/5 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 text-white font-medium transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500">
                  <th className="px-8 py-4">Student ID</th>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Class</th>
                  <th className="px-4 py-4">Father</th>
                  <th className="px-4 py-4">Finances</th>
                  <th className="px-8 py-4 text-right">Access</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="py-32 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={48} /></td></tr>
                ) : students.map((s, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={s.id}
                    className="group bg-white/5 hover:bg-white/[0.08] transition-all cursor-pointer"
                  >
                    <td className="px-8 py-6 first:rounded-l-3xl font-mono text-xs text-blue-400 font-bold">#{s.id}</td>
                    <td className="px-4 py-6">
                      <div className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{s.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-1.5 font-bold uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified Record
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-xl text-[10px] font-black tracking-widest border border-blue-500/20">
                        LVL {s.grade}
                      </span>
                    </td>
                    <td className="px-4 py-6">
                      <div className="font-bold text-slate-300">{s.guardian_name}</div>
                      <div className="text-xs text-slate-500 mt-1 font-mono">{s.guardian_phone}</div>
                    </td>
                    <td className="px-4 py-6">
                      <FeeStatus status={s.latest_fee_status} />
                    </td>
                    <td className="px-8 py-6 last:rounded-r-3xl text-right">
                      <button className="p-3 bg-slate-800/0 hover:bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all"><MoreHorizontal size={22} /></button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <StudentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => {
          fetchStudents(searchTerm);
          toast.success('DATA UPLOADED SUCCESSFULLY');
        }} />

        <BulkStudentModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} onSuccess={() => {
          fetchStudents(searchTerm);
          toast.success('BATCH PROCESSING COMPLETE');
        }} />

      </main>
    </div>
  );
};

// --- Modern Subcomponents ---

const NavItem = ({ icon, label, active }) => (
  <button className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold group ${active ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
    <span className={`${active ? 'text-white' : 'group-hover:text-blue-400'} transition-colors`}>{icon}</span>
    <span className="tracking-tight text-sm">{label}</span>
  </button>
);

const FeeStatus = ({ status }) => {
  const themes = {
    paid: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    pending: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
    late: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30',
  };
  const current = themes[status] || 'from-slate-500/20 to-slate-600/20 text-slate-400 border-slate-500/30';
  return (
    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-gradient-to-br ${current}`}>
      {status ? status.replace('_', ' ') : 'Offline'}
    </span>
  );
};

const StatCard = ({ title, value, gradient, trend, icon }) => (
  <motion.div
    whileHover={{ y: -8, scale: 1.02 }}
    className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between h-52 relative overflow-hidden group shadow-2xl"
  >
    {/* Background Glow */}
    <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity blur-3xl`} />

    <div className="flex justify-between items-start z-10">
      <div className={`p-4 bg-gradient-to-br ${gradient} rounded-2xl shadow-lg shadow-black/20 text-white`}>{icon}</div>
      <div className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] bg-white/5 px-3 py-1.5 rounded-full border border-white/5">{trend}</div>
    </div>

    <div className="z-10 mt-6">
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
      <h3 className="text-4xl font-black text-white tracking-tighter">{value}</h3>
    </div>
  </motion.div>
);

export default App;