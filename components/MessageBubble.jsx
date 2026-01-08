import React, { memo } from 'react';
import { ShieldCheck, User } from 'lucide-react';

export const MessageBubble = memo(({ role, text, timestamp, isError }) => (
    <div className={`flex flex-col ${role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
        <div className="flex items-center gap-2 mb-2 px-1">
            {role === 'jarvis' ? (
                <>
                    <ShieldCheck className="w-3 h-3 text-cyan-500" />
                    <span className="text-[10px] uppercase tracking-widest font-black text-cyan-500">System</span>
                </>
            ) : (
                <>
                    <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">User</span>
                    <User className="w-3 h-3 text-slate-500" />
                </>
            )}
            <span className="text-[9px] text-slate-600 font-mono">{timestamp}</span>
        </div>

        <div className={`relative group max-w-[85%] px-5 py-3 rounded-xl border transition-all duration-300 ${role === 'user'
                ? 'bg-slate-900/40 border-slate-700/50 text-slate-200'
                : isError
                    ? 'bg-red-950/20 border-red-900/40 text-red-300'
                    : 'bg-[#0a0f18] border-cyan-900/30 text-cyan-50/90 shadow-[inset_0_0_20px_rgba(6,182,212,0.02)]'
            }`}>
            <p className="text-sm leading-relaxed tracking-wide font-medium whitespace-pre-wrap">{text}</p>
            {role === 'jarvis' && !isError && (
                <div className="absolute -left-1 top-0 w-[2px] h-full bg-cyan-500/40 rounded-full" />
            )}
        </div>
    </div>
));
