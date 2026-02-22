import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ isDark }) => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'ur' : 'en';
        i18n.changeLanguage(newLang);
        document.documentElement.lang = newLang;
        document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr';
    };

    return (
        <button
            onClick={toggleLanguage}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-bold ${isDark
                    ? 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                }`}
        >
            <Globe size={18} className="text-blue-500" />
            <span>{i18n.language === 'en' ? 'اردو' : 'English'}</span>
        </button>
    );
};

export default LanguageSwitcher;
