import React, { memo } from 'react';
import { Cpu } from 'lucide-react';

export const Header = memo(({ userId, status }) => (
    <header className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/30 bg-[#080b12]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-10 h-10 border border-cyan-500/50 rounded-lg flex items-center justify-center bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
                </div>
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-[0.2em] text-cyan-100 font-mono">JARVIS</h1>
                <p className="text-[10px] text-slate-500 tracking-wider uppercase font-medium font-mono">Personal AI Assistant</p>
            </div>
        </div>

        <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">ID: {userId}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/50">
                <div className={`w-2 h-2 rounded-full ${status === 'Online' ? 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]' : 'bg-slate-500'} animate-pulse`} />
                <span className="text-[11px] font-bold uppercase tracking-tighter font-mono">{status}</span>
            </div>
        </div>
    </header>
));
