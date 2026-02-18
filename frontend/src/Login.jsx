import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, GraduationCap, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isDark, setIsDark] = useState(true); // Default to Dark Mode

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const cleanEmail = formData.email.replace(/\^/g, '').trim();

    const handleChange = (e) => {
        let value = e.target.value;
        // Strip dead-key '^' characters that some keyboard layouts insert into email fields
        if (e.target.name === 'email') {
            value = value.replace(/\^/g, '');
        }
        setFormData({ ...formData, [e.target.name]: value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const cleanEmail = formData.email.trim(); // Already sanitized in handleChange

        try {
            // ✅ UPDATED ENDPOINT: Using secure-login
            const response = await axios.post('http://127.0.0.1:8000/api/secure-login/', {
                email: cleanEmail,
                password: formData.password
            });

            // Assuming your custom API returns tokens in a standard format
            // Adjust 'access' and 'refresh' keys if your serializer names them differently
            localStorage.setItem('access_token', response.data.access || response.data.token);
            if (response.data.refresh) localStorage.setItem('refresh_token', response.data.refresh);

            setLoading(false);
            // Notify Dashboard that login succeeded
            if (onLogin) onLogin();
            else navigate('/');

        } catch (err) {
            console.error("Login Failed:", err);
            setError("Authorization Failed: Invalid Credentials.");
            setLoading(false);
        }
    };

    return (
        <div className={`relative min-h-screen transition-colors duration-700 ease-in-out flex items-center justify-center overflow-hidden font-sans selection:bg-blue-500/30 ${isDark ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>

            {/* 🌗 THEME TOGGLE BUTTON */}
            <button
                onClick={() => setIsDark(!isDark)}
                className={`absolute top-6 right-6 p-3 rounded-full border shadow-xl backdrop-blur-md transition-all z-50 ${isDark ? 'bg-slate-900/50 border-white/10 text-yellow-400 hover:bg-slate-800' : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white'}`}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isDark ? "dark" : "light"}
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </motion.div>
                </AnimatePresence>
            </button>

            {/* 🌌 DYNAMIC BACKGROUND (Adapts to Theme) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className={`absolute -top-[40%] -left-[20%] w-[100%] h-[100%] rounded-full blur-[120px] transition-colors duration-700 ${isDark ? 'bg-blue-600/20 mix-blend-screen' : 'bg-blue-400/20 mix-blend-multiply'}`}
                />
                <motion.div
                    animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className={`absolute top-[20%] -right-[20%] w-[80%] h-[80%] rounded-full blur-[100px] transition-colors duration-700 ${isDark ? 'bg-purple-600/10 mix-blend-screen' : 'bg-indigo-300/30 mix-blend-multiply'}`}
                />
            </div>

            {/* 🔮 THE CARD */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="relative z-10 w-full max-w-[28rem] p-[1px] rounded-[2.5rem] overflow-hidden group"
            >
                {/* Animated Border Gradient */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className={`absolute inset-[-100%] opacity-30 transition-opacity duration-700 ${isDark ? 'bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#3b82f6_100%)]' : 'bg-[conic-gradient(from_90deg_at_50%_50%,#ffffff00_50%,#6366f1_100%)]'}`}
                />

                {/* Glass Container */}
                <div className={`relative h-full backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 border shadow-2xl transition-all duration-700 ${isDark ? 'bg-[#0f172a]/80 border-white/5 shadow-black/80' : 'bg-white/60 border-white/40 shadow-blue-200/50'}`}>

                    <div className="flex flex-col items-center text-center">

                        {/* Logo */}
                        <motion.div
                            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                            className="mb-8 relative"
                        >
                            <div className={`absolute inset-0 blur-2xl opacity-20 animate-pulse ${isDark ? 'bg-blue-500' : 'bg-indigo-500'}`} />
                            <div className={`relative p-4 rounded-2xl border shadow-inner transition-colors duration-700 ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-950 border-white/10' : 'bg-gradient-to-br from-white to-slate-100 border-white/50'}`}>
                                <GraduationCap size={40} className={isDark ? "text-blue-400" : "text-indigo-600"} />
                            </div>
                        </motion.div>

                        {/* Title */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-10 space-y-2">
                            <h2 className={`text-xs font-bold tracking-[0.3em] uppercase transition-colors duration-700 ${isDark ? 'text-blue-400' : 'text-indigo-500'}`}>Admin Access Portal</h2>
                            <h1 className={`text-2xl md:text-3xl font-black leading-tight tracking-tight transition-colors duration-700 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                The Learning & <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 italic">Educational Science Academy</span>
                            </h1>
                        </motion.div>

                        <form onSubmit={handleSubmit} className="w-full space-y-5">

                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-[11px] font-bold justify-center">
                                    <AlertCircle size={14} /> {error}
                                </motion.div>
                            )}

                            {/* EMAIL */}
                            <div className="group relative">
                                <div className={`absolute -inset-0.5 rounded-2xl opacity-0 group-focus-within:opacity-50 transition duration-500 blur bg-gradient-to-r ${isDark ? 'from-blue-500 to-purple-600' : 'from-blue-300 to-indigo-400'}`}></div>
                                <div className={`relative flex items-center rounded-2xl border transition-all ${isDark ? 'bg-[#020617] border-white/10' : 'bg-white border-slate-200'}`}>
                                    <div className={`pl-4 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`}>
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email" name="email" required
                                        value={formData.email} onChange={handleChange}
                                        placeholder="Identity String"
                                        className={`w-full p-4 bg-transparent text-sm font-bold placeholder:text-slate-400 outline-none ${isDark ? 'text-white' : 'text-slate-800'}`}
                                    />
                                </div>
                            </div>

                            {/* PASSWORD */}
                            <div className="group relative">
                                <div className={`absolute -inset-0.5 rounded-2xl opacity-0 group-focus-within:opacity-50 transition duration-500 blur bg-gradient-to-r ${isDark ? 'from-blue-500 to-purple-600' : 'from-blue-300 to-indigo-400'}`}></div>
                                <div className={`relative flex items-center rounded-2xl border transition-all ${isDark ? 'bg-[#020617] border-white/10' : 'bg-white border-slate-200'}`}>
                                    <div className={`pl-4 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`}>
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password" required
                                        value={formData.password} onChange={handleChange}
                                        placeholder="Security Key"
                                        className={`w-full p-4 bg-transparent text-sm font-bold placeholder:text-slate-400 outline-none ${isDark ? 'text-white' : 'text-slate-800'}`}
                                    />
                                    {/* 👁️ PASSWORD TOGGLE */}
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className={`pr-4 transition-colors hover:text-blue-400 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* SUBMIT */}
                            <button
                                disabled={loading}
                                className="w-full relative group overflow-hidden rounded-2xl p-[1px] shadow-lg hover:shadow-blue-500/20 transition-all"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500 transition-all duration-300" />
                                <div className={`relative h-full w-full rounded-2xl py-4 flex items-center justify-center gap-2 transition-all duration-300 group-hover:bg-opacity-0 ${isDark ? 'bg-[#0f172a]' : 'bg-white'}`}>
                                    <span className={`font-black uppercase text-[10px] tracking-[0.2em] group-hover:scale-105 transition-all group-hover:text-white ${isDark ? 'text-white' : 'text-indigo-600'}`}>
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : "Initialize Session"}
                                    </span>
                                    {!loading && <ArrowRight size={16} className={`transition-all group-hover:text-white group-hover:translate-x-1 ${isDark ? 'text-blue-400' : 'text-indigo-400'}`} />}
                                </div>
                            </button>

                        </form>
                    </div>
                </div>
            </motion.div>

            <div className={`absolute bottom-6 flex flex-col items-center gap-1 transition-opacity ${isDark ? 'opacity-40 hover:opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                <div className={`h-8 w-[1px] bg-gradient-to-b from-transparent to-transparent ${isDark ? 'via-slate-500' : 'via-slate-400'}`} />
                <p className={`text-[9px] font-mono uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>System v2.6 • Encrypted</p>
            </div>

        </div>
    );
};

export default Login;