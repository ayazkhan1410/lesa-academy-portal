import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({ className, variant = "rect" }) => {
    const baseClasses = "bg-slate-200 dark:bg-slate-800 animate-pulse transition-colors duration-500";
    const roundedClasses = variant === "circle" ? "rounded-full" : variant === "text" ? "rounded" : "rounded-2xl";

    return (
        <div className={`${baseClasses} ${roundedClasses} ${className}`} />
    );
};

export const TableSkeleton = ({ rows = 5, isDark }) => (
    <div className="w-full space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4 px-4 border-b border-slate-100 dark:border-white/5">
                <Skeleton className="w-10 h-10" variant="circle" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="w-1/4 h-4" variant="text" />
                    <Skeleton className="w-1/6 h-3" variant="text" />
                </div>
                <Skeleton className="w-20 h-4" variant="text" />
                <Skeleton className="w-20 h-8" />
            </div>
        ))}
    </div>
);

export const CardSkeleton = () => (
    <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 h-48 flex flex-col justify-between">
        <div className="flex justify-between">
            <Skeleton className="w-12 h-12" />
            <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
        <div className="space-y-3">
            <Skeleton className="w-1/3 h-3" variant="text" />
            <Skeleton className="w-2/3 h-8" variant="text" />
        </div>
    </div>
);

export const ChartSkeleton = () => (
    <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/40 h-[380px] flex flex-col">
        <div className="mb-6">
            <Skeleton className="w-1/4 h-6 mb-2" variant="text" />
            <Skeleton className="w-1/6 h-3" variant="text" />
        </div>
        <div className="flex-1 flex items-end gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton
                    key={i}
                    className="flex-1"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                />
            ))}
        </div>
    </div>
);

export default Skeleton;
