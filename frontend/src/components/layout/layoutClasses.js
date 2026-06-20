/** Shared compact layout class tokens for admin pages */

export const shellCls = (isDark) =>
  `flex h-screen overflow-hidden transition-colors duration-300 ${
    isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
  }`;

export const mainCls = 'flex-1 overflow-y-auto relative custom-scrollbar page-main min-w-0';

export const headerCls = (isDark) =>
  `sticky top-0 z-10 px-4 py-3 sm:px-5 sm:py-3.5 border-b backdrop-blur-md ${
    isDark ? 'bg-slate-950/90 border-white/5' : 'bg-white/90 border-slate-200'
  }`;

export const bodyCls = 'px-4 py-4 sm:px-5 sm:py-5';

export const titleCls = (isDark) =>
  `text-lg sm:text-xl font-bold tracking-tight uppercase ${
    isDark ? 'text-white' : 'text-slate-900'
  }`;

export const subtitleCls = (isDark) =>
  `text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${
    isDark ? 'text-slate-500' : 'text-slate-400'
  }`;

export const iconBoxCls = (color = 'blue') => {
  const map = {
    blue: 'bg-blue-600 shadow-blue-500/20',
    violet: 'bg-violet-600 shadow-violet-500/20',
    amber: 'bg-amber-500 shadow-amber-500/20',
    emerald: 'bg-emerald-600 shadow-emerald-500/20',
  };
  return `p-2 rounded-xl shadow-md shrink-0 ${map[color] || map.blue}`;
};

export const iconBtnCls = (isDark) =>
  `p-2 rounded-lg border transition-colors ${
    isDark
      ? 'border-white/10 bg-slate-900 text-yellow-400 hover:bg-slate-800'
      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm'
  }`;

export const btnSecondaryCls = (isDark) =>
  `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-colors disabled:opacity-40 ${
    isDark
      ? 'bg-slate-900 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
  }`;

export const btnPrimaryCls = (color = 'blue') => {
  const map = {
    blue: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30 ring-blue-600/10',
    violet: 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/30 ring-violet-600/10',
    amber: 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/30 ring-amber-500/10',
  };
  return `inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide text-white shadow-md transition-colors ring-2 ${
    map[color] || map.blue
  }`;
};

export const searchWrapCls = 'flex-1 relative min-w-0';

export const searchInputCls = (isDark, accent = 'blue') => {
  const focus = {
    blue: isDark ? 'focus:border-blue-500/50' : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10',
    violet: isDark ? 'focus:border-violet-500/50' : 'focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10',
    amber: isDark ? 'focus:border-amber-500/50' : 'focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10',
  };
  return `w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none transition-all ${
    isDark
      ? `bg-slate-900/60 border-white/5 text-white placeholder:text-slate-600 ${focus[accent]}`
      : `bg-white border-slate-200 text-slate-900 shadow-sm ${focus[accent]}`
  }`;
};

export const selectCls = (isDark) =>
  `px-3 py-2 rounded-lg border text-sm outline-none min-w-[140px] ${
    isDark
      ? 'bg-slate-900/60 border-white/5 text-slate-300'
      : 'bg-white border-slate-200 text-slate-700 shadow-sm'
  }`;

export const tableShellCls = (isDark) =>
  `rounded-xl border overflow-hidden ${
    isDark ? 'bg-slate-900/40 border-white/5 shadow-lg' : 'bg-white border-slate-200 shadow-md'
  }`;

export const tableHeadRowCls = (isDark) =>
  `${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'} border-b ${
    isDark ? 'border-white/5' : 'border-slate-100'
  }`;

export const tableThCls = 'px-3 py-2.5 sm:px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap';

export const tableTdCls = 'px-3 py-2 sm:px-4 align-middle';

export const tableRowCls = 'group hover:bg-blue-600/[0.04] transition-colors cursor-pointer';

export const avatarCls = (isDark) =>
  `w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
    isDark
      ? 'bg-slate-800 text-blue-400 group-hover:bg-blue-600 group-hover:text-white'
      : 'bg-slate-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
  }`;

export const paginationBarCls = (isDark) =>
  `px-3 py-3 sm:px-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
    isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/80'
  }`;

export const pageBtnCls = (isDark, isCurrent) => {
  if (isCurrent) return 'min-w-[36px] h-9 rounded-lg text-[11px] font-bold bg-blue-600 text-white shadow-md';
  return `min-w-[36px] h-9 rounded-lg text-[11px] font-bold transition-colors ${
    isDark
      ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
      : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
  }`;
};

export const navBtnCls = (isDark) =>
  `p-2 rounded-lg border transition-colors disabled:opacity-30 ${
    isDark ? 'border-white/10 bg-slate-950 hover:bg-slate-900' : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'
  }`;

export const emptyStateCls = (isDark) =>
  `flex flex-col items-center justify-center py-16 sm:py-20 rounded-xl border border-dashed ${
    isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-200 bg-slate-50'
  }`;

export const loadingStateCls = 'flex flex-col items-center justify-center py-16 gap-4';
