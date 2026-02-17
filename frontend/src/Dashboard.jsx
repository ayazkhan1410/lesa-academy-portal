import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import axios from 'axios';
import {
  Users, LayoutDashboard, Plus, Search, LogOut, Loader2, Wallet, AlertCircle, TrendingUp,
  Trash2, Edit, GraduationCap, School, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Login from './Login';
import StudentModal from './StudentModal';
import BulkStudentModal from './BulkStudentModal';

// --- SHARED SIDEBAR COMPONENT ---
export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ INITIALIZE STATE FROM LOCAL STORAGE
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true'; // Convert string 'true' to boolean
  });

  const isActive = (path) => location.pathname === path;

  // ✅ TOGGLE FUNCTION THAT SAVES TO STORAGE
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? "5rem" : "20rem" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-slate-950/50 backdrop-blur-xl border-r border-white/5 hidden lg:flex flex-col z-20 relative h-screen"
    >
      <button
        onClick={toggleSidebar} // ✅ Uses the new persistence function
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-blue-600 rounded-full p-1.5 text-white shadow-lg border border-slate-900 z-50 flex items-center justify-center"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="p-6">
        {/* ✅ CLICKABLE LOGO AREA */}
        <div
          onClick={() => navigate('/')}
          className={`flex ${isCollapsed ? 'justify-center' : 'justify-start'} items-center gap-4 cursor-pointer group`}
        >
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-2xl shadow-lg group-hover:scale-105 transition-transform">
            <School size={24} className="text-white" />
          </div>
          {!isCollapsed && (
            <h1 className="text-sm font-black text-white uppercase group-hover:text-blue-400 transition-colors">
              Educational<br />Science Academy
            </h1>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-3 mt-4">
        <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" collapsed={isCollapsed} active={isActive('/')} onClick={() => navigate('/')} />
        <NavItem icon={<Users size={20} />} label="Student Detail Page" collapsed={isCollapsed} active={isActive('/students')} onClick={() => navigate('/students')} />
      </nav>

      <div className="p-6">
        <button onClick={handleLogout} className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all font-bold`}>
          <LogOut size={20} /> {!isCollapsed && "Sign Out"}
        </button>
      </div>
    </motion.aside>
  );
};

const NavItem = ({ icon, label, collapsed, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-4'} px-4 py-3 rounded-xl transition-all font-bold ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
    <span>{icon}</span> {!collapsed && <span className="text-sm">{label}</span>}
  </button>
);

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [students, setStudents] = useState([]); // Recent students only
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_students: 0, active_students: 0, total_pending_fees: 0, total_fees_paid: 0 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      fetchDashboardData();
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://127.0.0.1:8000/api/students/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = response.data.results || response.data;
      const sorted = Array.isArray(data) ? [...data].sort((a, b) => b.id - a.id) : [];

      setStudents(sorted.slice(0, 5)); // ✅ Show only top 5 recent
      if (response.data.summary) setStats(response.data.summary);
    } catch (error) {
      console.error("Dashboard Load Error", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return <Login onLogin={() => { setIsAuthenticated(true); fetchDashboardData(); }} />;

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden font-sans text-slate-200">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight italic">
              Overview
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-2 ml-1">
              Institutional Control Center
            </p>
          </div>

          {/* ✅ NEW SINGLE ACTION BUTTON */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsBulkModalOpen(true)}
            className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-blue-500/40 transition-all border border-white/10"
          >
            <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="text-left">
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/70 leading-none mb-1">
                New Admission
              </span>
              <span className="block text-sm font-black text-white uppercase tracking-wider">
                Register Student
              </span>
            </div>
            <div className="ml-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
              <ChevronRight size={18} className="text-white" />
            </div>
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Students" value={stats.total_students} color="blue" icon={<Users />} />
          <StatCard title="Pending Fees" value={`Rs. ${stats.total_pending_fees.toLocaleString()}`} color="rose" icon={<AlertCircle />} />
          <StatCard title="Revenue" value={`Rs. ${stats.total_fees_paid.toLocaleString()}`} color="emerald" icon={<Wallet />} />
        </div>

        {/* Recent Only Table */}
        <section className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">Recent Admissions</h3>
          <table className="w-full text-left">
            <thead className="text-[10px] uppercase font-black text-slate-500">
              <tr><th className="py-2">ID</th><th>Name</th><th>Class</th><th>Fee Status</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.map(s => (
                <tr key={s.id} onClick={() => navigate(`/students/${s.id}`)} className="cursor-pointer hover:bg-white/5">
                  <td className="py-4 font-mono text-xs text-blue-400">#{s.id}</td>
                  <td className="py-4 font-bold text-white text-sm">{s.name}</td>
                  <td className="py-4"><span className="px-2 py-1 bg-slate-800 rounded text-[10px] font-bold text-slate-300">{s.grade}</span></td>
                  <td className="py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${s.latest_fee_status === 'paid' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>{s.latest_fee_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-center">
            <button onClick={() => navigate('/students')} className="text-blue-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">View Full Matrix &rarr;</button>
          </div>
        </section>

        <StudentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => { fetchDashboardData(); toast.success('Added'); }} />
        <BulkStudentModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} onSuccess={() => { fetchDashboardData(); toast.success('Bulk Complete'); }} />

      </main>
    </div>
  );
};

const StatCard = ({ title, value, color, icon }) => (
  <div className={`p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-slate-900 to-slate-950 shadow-xl relative overflow-hidden group`}>
    <div className={`absolute top-0 right-0 p-32 bg-${color}-600/5 blur-3xl rounded-full`} />
    <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center text-${color}-500 mb-4`}>{icon}</div>
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</p>
    <p className="text-3xl font-black text-white">{value}</p>
  </div>
);

export default Dashboard;