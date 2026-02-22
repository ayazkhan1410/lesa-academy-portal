import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2, Minimize2, Sun } from 'lucide-react';

const Lightbox = ({ src, onClose, title = "Document Preview" }) => {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [brightness, setBrightness] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 md:p-10"
        >
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all border border-white/10"
                    >
                        <X size={20} />
                    </button>
                    <div>
                        <h3 className="text-white font-black uppercase tracking-widest text-sm">{title}</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">High Fidelity Viewer</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ControlButton icon={<RotateCw size={18} />} onClick={() => setRotation(r => r + 90)} label="Rotate" />
                    <ControlButton icon={<Sun size={18} />} onClick={() => setBrightness(b => b === 1 ? 1.5 : 1)} label="Enhance" active={brightness > 1} />
                    <div className="w-px h-6 bg-white/20 mx-2" />
                    <ControlButton icon={<ZoomOut size={18} />} onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} label="Zoom Out" />
                    <span className="text-white font-mono text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <ControlButton icon={<ZoomIn size={18} />} onClick={() => setZoom(z => Math.min(3, z + 0.2))} label="Zoom In" />
                    <div className="w-px h-6 bg-white/20 mx-2" />
                    <ControlButton icon={isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />} onClick={toggleFullscreen} label="Fullscreen" />
                    <a href={src} download className="p-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white transition-all shadow-lg shadow-blue-600/30">
                        <Download size={18} />
                    </a>
                </div>
            </div>

            {/* Main Image Container */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing">
                <motion.img
                    src={src}
                    key={src}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{
                        scale: zoom,
                        rotate: rotation,
                        opacity: 1,
                        filter: `brightness(${brightness})`
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="max-w-[90vw] max-h-[80vh] object-contain shadow-2xl rounded-lg"
                    draggable={false}
                />
            </div>

            {/* Background Hint */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none">
                <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.5em]">Scroll to zoom • Esc to close</p>
            </div>
        </motion.div>
    );
};

const ControlButton = ({ icon, onClick, label, active }) => (
    <button
        onClick={onClick}
        className={`p-3 rounded-2xl transition-all border ${active ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'}`}
        title={label}
    >
        {icon}
    </button>
);

export default Lightbox;
