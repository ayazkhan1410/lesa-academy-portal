import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Home, ArrowLeft, Ghost } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isDark = localStorage.getItem('dashboardTheme') !== 'light';

    return (
        <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-500 ${isDark ? 'bg-[#0a0f1e] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>

            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className={`absolute top-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full opacity-20 ${isDark ? 'bg-blue-600' : 'bg-blue-400'}`} />
                <div className={`absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] blur-[100px] rounded-full opacity-10 ${isDark ? 'bg-indigo-600' : 'bg-indigo-300'}`} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className={`relative z-10 max-w-lg w-full p-8 md:p-12 rounded-[2.5rem] border backdrop-blur-xl shadow-2xl text-center ${isDark ? 'bg-slate-900/60 border-white/5 shadow-black/50' : 'bg-white/80 border-slate-200 shadow-slate-200/50'}`}
            >
                <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center shadow-2xl bg-gradient-to-br from-blue-600 to-indigo-700`}
                >
                    <Ghost size={48} className="text-white animate-bounce" />
                </motion.div>

                <h1 className={`text-6xl md:text-8xl font-black mb-4 tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    404
                </h1>

                <h2 className="text-xl md:text-2xl font-bold mb-4 uppercase tracking-widest text-blue-500">
                    {t('common.page_not_found') || 'Lost in Space?'}
                </h2>

                <p className={`text-sm md:text-base font-medium mb-10 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t('common.page_not_found_desc') || "The page you're looking for doesn't exist or has been moved. Don't worry, even the best students get lost sometimes!"}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(-1)}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all border ${isDark ? 'bg-slate-800 border-white/10 text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/dashboard')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-blue-500/20 text-white font-bold"
                    >
                        <Home size={18} />
                        Return Home
                    </motion.button>
                </div>

                {/* Support Section */}
                <div className={`mt-12 pt-8 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        Need Help? Contact Admin
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
