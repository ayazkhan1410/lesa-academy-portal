import React, { useState } from 'react';
import { Users, DollarSign, LayoutDashboard, Plus, Search, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_STUDENTS = [
  { id: 1, full_name: "Ali Khan", grade: "10th Grade", guardian_phone: "0300-1234567", status: "active", fee_status: "paid" },
  { id: 2, full_name: "Sara Ahmed", grade: "9th Grade", guardian_phone: "0333-9876543", status: "active", fee_status: "late" },
  { id: 3, full_name: "Zain Malik", grade: "11th Grade", guardian_phone: "0321-5555555", status: "inactive", fee_status: "pending" },
];

const App = () => {
  const [students] = useState(MOCK_STUDENTS);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col shadow-2xl">
        <div className="p-8">
          <h1 className="text-2xl font-bold tracking-wider text-blue-400">ACADEMY<span className="text-white">OS</span></h1>
          <p className="text-xs text-slate-400 mt-1">Management System</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white shadow-lg">
            <LayoutDashboard size={20} /> <span className="font-medium">Dashboard</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
            <Users size={20} /> <span className="font-medium">Students</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Overview</h2>
            <p className="text-slate-500 mt-1">Welcome back, Ayaz Khan.</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95">
            <Plus size={18} /> <span>Add Student</span>
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard title="Total Students" value="124" color="text-blue-500" trend="+12% this month" />
          <StatCard title="Pending Fees" value="Rs. 45,000" color="text-red-500" trend="5 students late" />
          <StatCard title="Active Classes" value="8" color="text-emerald-500" trend="All running" />
        </div>

        {/* Table Section */}
        <section className="bg-white/70 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Recent Enrollments</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 rounded-lg bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500 w-64" />
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="text-left text-sm font-semibold text-slate-500 border-b border-slate-100">
                <th className="pb-4">Name</th>
                <th className="pb-4">Grade</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Payment</th>
                <th className="pb-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                  <td className="py-4">
                    <div className="font-medium text-slate-800">{s.full_name}</div>
                    <div className="text-xs text-slate-400">{s.guardian_phone}</div>
                  </td>
                  <td className="py-4 text-slate-600 text-sm">{s.grade}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold ${s.fee_status === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {s.fee_status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

const StatCard = ({ title, value, color, trend }) => (
  <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
    <p className="text-slate-500 text-sm font-medium">{title}</p>
    <h3 className={`text-2xl font-bold mt-2 ${color}`}>{value}</h3>
    <p className="text-xs text-slate-400 mt-1">{trend}</p>
  </motion.div>
);

export default App;
