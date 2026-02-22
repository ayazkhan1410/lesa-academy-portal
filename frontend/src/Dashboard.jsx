import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Users, LayoutDashboard, LogOut, Wallet, AlertCircle,
  ChevronLeft, ChevronRight, Sparkles,
  TrendingUp, UserCheck, Sun, Moon, ArrowUpRight, Loader2,
  Eye, EyeOff, CalendarCheck
} from 'lucide-react';
import academyLogo from './assets/academy_logo.png';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Login from './Login';
import StudentModal from './StudentModal';
import BulkStudentModal from './BulkStudentModal';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

// --- SHARED SIDEBAR COMPONENT ---
export const Sidebar = ({ isDark: isDarkProp }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Self-manage theme: use prop if provided, otherwise read from localStorage
  const isDark = isDarkProp !== undefined ? isDarkProp : (() => {
    const saved = localStorage.getItem('dashboardTheme');
    return saved !== 'light';
  })();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    // Default to 'true' (collapsed) if no value is found, otherwise respect user choice
    return saved !== 'false';
  });

  const isActive = (path) => location.pathname === path;

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
      className={`hidden lg:flex flex-col z-20 relative h-screen backdrop-blur-xl border-r transition-colors duration-500 ${isDark ? 'bg-slate-950/50 border-white/5' : 'bg-white/80 border-slate-200'}`}
    >
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-blue-600 rounded-full p-1.5 text-white shadow-lg border border-slate-900 z-50 flex items-center justify-center"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className={`${isCollapsed ? 'p-3' : 'p-6'} transition-all`}>
        <div
          onClick={() => navigate('/')}
          className={`flex ${isCollapsed ? 'justify-center' : 'justify-start'} items-center gap-4 cursor-pointer group`}
        >
          <div className="rounded-2xl shadow-lg group-hover:scale-105 transition-transform overflow-hidden w-12 h-12 shrink-0">
            <img src={academyLogo} alt="Academy Logo" className="w-full h-full object-cover" />
          </div>
          {!isCollapsed && (
            <h1 className={`text-[11px] font-black uppercase leading-tight group-hover:text-blue-400 transition-colors ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {t('sidebar.admin_portal')}<br />
              {t('sidebar.digital_campus')}
            </h1>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-3 mt-4">
        <NavItem icon={<LayoutDashboard size={20} />} label={t('common.dashboard')} collapsed={isCollapsed} active={isActive('/')} onClick={() => navigate('/')} isDark={isDark} />
        <NavItem icon={<UserCheck size={20} />} label={t('common.guardians')} collapsed={isCollapsed} active={isActive('/guardians')} onClick={() => navigate('/guardians')} isDark={isDark} />
        <NavItem icon={<Users size={20} />} label={t('common.students')} collapsed={isCollapsed} active={isActive('/students')} onClick={() => navigate('/students')} isDark={isDark} />
        <NavItem icon={<CalendarCheck size={20} />} label={t('common.attendance')} collapsed={isCollapsed} active={isActive('/attendance')} onClick={() => navigate('/attendance')} isDark={isDark} />
        <NavItem icon={<Wallet size={20} />} label={t('common.expenses')} collapsed={isCollapsed} active={isActive('/expenses')} onClick={() => navigate('/expenses')} isDark={isDark} />
      </nav>

      <div className={`${isCollapsed ? 'p-3' : 'p-6'} transition-all`}>
        <button onClick={handleLogout} className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3 px-4 py-3 rounded-2xl hover:bg-rose-500/10 hover:text-rose-400 transition-all font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <LogOut size={20} /> {!isCollapsed && "Sign Out"}
        </button>
      </div>
    </motion.aside>
  );
};

const NavItem = ({ icon, label, collapsed, active, onClick, isDark }) => (
  <button onClick={onClick} className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-4'} px-4 py-3 rounded-xl transition-all font-bold ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : isDark ? 'text-slate-500 hover:text-slate-200 hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}>
    <span>{icon}</span> {!collapsed && <span className="text-sm">{label}</span>}
  </button>
);

// --- ANIMATED COUNTER ---
const AnimatedNumber = ({ value, prefix = '', isDark }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value) || 0;
    const duration = 800;
    const steps = 30;
    const increment = num / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= num) {
        setDisplay(num);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className={`text-3xl font-black tabular-nums ${isDark ? 'text-white' : 'text-slate-800'}`}>
      {prefix}{display.toLocaleString()}
    </span>
  );
};

// --- STAT CARD ---
const StatCard = ({ title, value, prefix = '', icon, gradient, delay, isDark, isSensitive, isVisible, onToggleVisibility }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className={`relative p-6 rounded-[2rem] border overflow-hidden group cursor-default transition-colors duration-500 ${isDark ? 'border-white/5 bg-slate-900/60 backdrop-blur-xl shadow-xl' : 'border-slate-200 bg-white shadow-lg shadow-slate-200/50'}`}
  >
    {/* Background glow */}
    <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${gradient}`} />

    <div className="relative z-10 w-full">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${gradient} shadow-lg`}>
          {React.cloneElement(icon, { size: 22, className: 'text-white' })}
        </div>
        {/* Toggle Button for Sensitive Stats */}
        {onToggleVisibility && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
            className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
          >
            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{title}</p>
      {isSensitive && !isVisible ? (
        <div className={`h-8 flex items-center text-2xl font-black tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
          ••••••••
        </div>
      ) : (
        <AnimatedNumber value={value} prefix={prefix} isDark={isDark} />
      )}
    </div>
  </motion.div>
);

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('access_token')
  );
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_students: 0,
    total_active_students: 0,
    pending_fees_amount: 0,
    paid_fees_amount: 0,
    total_revenue: 0
  });
  const [financeSummary, setFinanceSummary] = useState({
    total_revenue: 0,
    total_expenses: 0,
    net_profit: 0,
    month_name: '',
    expense_by_category: {}
  });
  const [financialTrends, setFinancialTrends] = useState([]);
  const [enrollmentDemographics, setEnrollmentDemographics] = useState([]);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('dashboardTheme');
    return saved !== 'light';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Privacy State for Finance
  const [showPendingFees, setShowPendingFees] = useState(false);
  const [showTotalRevenue, setShowTotalRevenue] = useState(false);
  const [showNetProfit, setShowNetProfit] = useState(false);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('dashboardTheme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const statsResponse = await axios.get('http://127.0.0.1:8000/api/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const financeResponse = await axios.get('http://127.0.0.1:8000/api/finances/monthly-summary/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const trendsResponse = await axios.get('http://127.0.0.1:8000/api/financial-trends/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setStudents(statsResponse.data.students || []);
      if (statsResponse.data.stats) setStats(statsResponse.data.stats);
      if (financeResponse.data) setFinanceSummary(financeResponse.data);
      if (trendsResponse.data) {
        setFinancialTrends(trendsResponse.data.financial_trends || []);
        setEnrollmentDemographics(trendsResponse.data.enrollment_demographics || []);
      }
    } catch (error) {
      console.error("Dashboard Load Error", error);
      if (error.response?.status === 401) {
        localStorage.clear();
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return <Login onLogin={() => { setIsAuthenticated(true); fetchDashboardData(); }} />;

  // Get greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Good Night' : hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${isDark ? 'bg-[#0a0f1e] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      <Toaster position="top-right" />

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-15%] right-[-10%] w-[45%] h-[45%] blur-[140px] rounded-full transition-colors duration-700 ${isDark ? 'bg-blue-600/8' : 'bg-blue-400/15'}`} />
        <div className={`absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] blur-[100px] rounded-full transition-colors duration-700 ${isDark ? 'bg-indigo-600/5' : 'bg-indigo-300/15'}`} />
      </div>

      <Sidebar isDark={isDark} />

      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="p-6 md:p-8 lg:p-10 max-w-[1400px] mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <p className={`text-sm font-medium mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t(`dashboard.${greeting.toLowerCase().replace(' ', '_')}`)} 👋</p>
              <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {t('common.dashboard')}
              </h1>
              <p className={`text-[10px] font-bold uppercase tracking-[0.3em] mt-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                {t('dashboard.overview')}
              </p>
            </motion.div>

            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <LanguageSwitcher isDark={isDark} />

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

              {/* Register Student Button */}
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
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="animate-spin text-blue-500" size={40} />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                <StatCard
                  title={t('dashboard.total_students')}
                  value={stats.total_students}
                  icon={<Users />}
                  gradient="bg-gradient-to-br from-blue-500 to-blue-700"
                  delay={0.1}
                  isDark={isDark}
                />
                <StatCard
                  title={t('dashboard.active_now')}
                  value={stats.total_active_students}
                  icon={<UserCheck />}
                  gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
                  delay={0.2}
                  isDark={isDark}
                />
                <StatCard
                  title={t('dashboard.pending_fees')}
                  value={stats.pending_fees_amount}
                  prefix="Rs. "
                  icon={<AlertCircle />}
                  gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                  delay={0.3}
                  isDark={isDark}
                  isSensitive={true}
                  isVisible={showPendingFees}
                  onToggleVisibility={() => setShowPendingFees(!showPendingFees)}
                />
                <StatCard
                  title={t('dashboard.monthly_revenue')}
                  value={stats.total_revenue}
                  prefix="Rs. "
                  icon={<Wallet />}
                  gradient="bg-gradient-to-br from-violet-500 to-purple-700"
                  delay={0.4}
                  isDark={isDark}
                  isSensitive={true}
                  isVisible={showTotalRevenue}
                  onToggleVisibility={() => setShowTotalRevenue(!showTotalRevenue)}
                />
              </div>

              {/* Monthly Finance Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="mb-10"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`h-px flex-1 ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
                  <h2 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    Monthly Revenue & Analytics • {financeSummary.month_name}
                  </h2>
                  <div className={`h-px flex-1 ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <StatCard
                    title="Current Month Revenue"
                    value={financeSummary.total_revenue}
                    prefix="Rs. "
                    icon={<TrendingUp />}
                    gradient="bg-gradient-to-br from-emerald-400 to-teal-600"
                    isDark={isDark}
                    isSensitive={true}
                    isVisible={showTotalRevenue}
                    onToggleVisibility={() => setShowTotalRevenue(!showTotalRevenue)}
                  />
                  <StatCard
                    title="Current Month Expenses"
                    value={financeSummary.total_expenses}
                    prefix="Rs. "
                    icon={<Wallet />}
                    gradient="bg-gradient-to-br from-rose-400 to-amber-600"
                    isDark={isDark}
                  />
                  <StatCard
                    title="Net Profit / Loss"
                    value={financeSummary.net_profit}
                    prefix="Rs. "
                    icon={<Sparkles />}
                    gradient={financeSummary.net_profit >= 0 ? "bg-gradient-to-br from-blue-500 to-indigo-700" : "bg-gradient-to-br from-red-500 to-rose-700"}
                    isDark={isDark}
                    isSensitive={true}
                    isVisible={showNetProfit}
                    onToggleVisibility={() => setShowNetProfit(!showNetProfit)}
                  />
                </div>

                {/* Category Breakdown Mini-List */}
                {financeSummary.expense_by_category && Object.keys(financeSummary.expense_by_category).length > 0 && (
                  <div className={`mt-6 p-6 rounded-[2rem] border ${isDark ? 'bg-slate-900/20 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-4 px-2">
                      <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Category Breakdown</p>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Distribution</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(financeSummary.expense_by_category).map(([cat, val]) => (
                        <div key={cat} className={`flex items-center justify-between p-4 rounded-2xl ${isDark ? 'bg-slate-950/40' : 'bg-slate-50'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${val > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{cat}</span>
                          </div>
                          <span className="text-xs font-bold tabular-nums">Rs. {val.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Analytics Charts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.48 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10"
              >
                {/* Financial Trends Area Chart */}
                <div className={`lg:col-span-2 p-6 rounded-[2rem] border overflow-hidden ${isDark ? 'bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-xl' : 'bg-white border-slate-200 shadow-lg shadow-slate-200/50'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Financial Trends</h3>
                      <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Revenue vs Expenses (Annual)</p>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={financialTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8', fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8', fontWeight: 'bold' }} tickFormatter={(value) => `Rs.${value / 1000}k`} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '1rem', fontFamily: 'Outfit, sans-serif' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#0f172a' }}
                          labelStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '4px' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '10px' }} />
                        <Area type="monotone" name="Total Revenue" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        <Area type="monotone" name="Total Expenses" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Enrollment Demographics Pie Chart */}
                <div className={`p-6 rounded-[2rem] border overflow-hidden ${isDark ? 'bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-xl' : 'bg-white border-slate-200 shadow-lg shadow-slate-200/50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Demographics</h3>
                      <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Students by Class</p>
                    </div>
                  </div>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={enrollmentDemographics.map(d => ({
                            ...d,
                            displayName: String(d.grade).toUpperCase()
                          }))}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="displayName"
                          stroke="none"
                        >
                          {enrollmentDemographics.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'][index % 6]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '1rem', fontFamily: 'Outfit, sans-serif' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#0f172a' }}
                          formatter={(value, name) => [value, name]}
                        />
                        <Legend
                          iconType="circle"
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              {/* Recent Admissions */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className={`rounded-[2rem] border overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-xl' : 'bg-white border-slate-200 shadow-lg shadow-slate-200/50'}`}
              >
                <div className={`px-8 py-6 border-b flex items-center justify-between ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                  <div>
                    <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Recent Admissions</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Latest 5 registered students</p>
                  </div>
                  <button
                    onClick={() => navigate('/students')}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-400 text-xs font-bold uppercase tracking-widest transition-colors group"
                  >
                    View All <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className={`text-[10px] uppercase tracking-[0.15em] font-black ${isDark ? 'text-slate-500 bg-slate-950/30' : 'text-slate-400 bg-slate-50/80'}`}>
                        <th className="py-4 px-8">ID</th>
                        <th className="py-4 px-4">Student</th>
                        <th className="py-4 px-4">Guardian</th>
                        <th className="py-4 px-4">Grade</th>
                        <th className="py-4 px-4">Date Joined</th>
                        <th className="py-4 px-4 text-center">Fee Status</th>
                        <th className="py-4 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan="7" className={`py-16 text-center text-sm font-medium ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            No students registered yet
                          </td>
                        </tr>
                      ) : (
                        students.map((s, index) => (
                          <motion.tr
                            key={s.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.05 }}
                            onClick={() => navigate(`/students/${s.id}`)}
                            className={`cursor-pointer transition-all group ${isDark ? 'hover:bg-white/[0.03] border-b border-white/5' : 'hover:bg-blue-50/50 border-b border-slate-100'}`}
                          >
                            <td className="py-4 px-8">
                              <span className="font-mono text-xs text-blue-500 font-bold">#{s.id}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0 overflow-hidden ${s.fee_status === 'paid'
                                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                  : s.fee_status === 'pending'
                                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                    : 'bg-gradient-to-br from-slate-500 to-slate-600'
                                  } shadow-lg shadow-black/20`}>
                                  {s.student_image ? (
                                    <img src={s.student_image.startsWith('http') ? s.student_image : `http://127.0.0.1:8000${s.student_image}`} alt={s.name} className="w-full h-full object-cover" />
                                  ) : (
                                    s.name.charAt(0)
                                  )}
                                </div>
                                <span className={`font-bold text-sm ${isDark ? 'text-white group-hover:text-blue-400' : 'text-slate-800 group-hover:text-blue-600'} transition-colors`}>
                                  {s.name}
                                </span>
                              </div>
                            </td>
                            <td className={`py-4 px-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {s.guardian_name || '—'}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                {s.grade}
                              </span>
                            </td>
                            <td className={`py-4 px-4 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {new Date(s.date_joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${s.fee_status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : s.fee_status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                }`}>
                                {s.fee_status === 'no_payment' ? 'No Record' : s.fee_status}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <ArrowUpRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.section>
            </>
          )}
        </div>

        <StudentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => { fetchDashboardData(); toast.success('Added'); }} />
        <BulkStudentModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} onSuccess={() => { fetchDashboardData(); toast.success('Bulk Complete'); }} />

      </main>
    </div>
  );
};

export default Dashboard;