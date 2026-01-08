import React, { memo } from 'react';
import { Activity } from 'lucide-react';

export const VoiceIndicator = memo(({ isListening, isSpeaking }) => (
    <div className="flex justify-center my-4">
        <div className={`px-4 py-2 rounded-full border flex items-center gap-3 bg-[#0a0f18] transition-all duration-300 ${isListening ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
                isSpeaking ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-slate-800'
            }`}>
            {isListening ? (
                <>
                    <div className="flex gap-1 h-3 items-center">
                        <div className="w-1 bg-red-500 h-full animate-[sound-wave_1s_infinite]" />
                        <div className="w-1 bg-red-500 h-2/3 animate-[sound-wave_1.2s_infinite]" />
                        <div className="w-1 bg-red-500 h-full animate-[sound-wave_0.8s_infinite]" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Listening</span>
                </>
            ) : isSpeaking ? (
                <>
                    <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Speaking</span>
                </>
            ) : (
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Voice Active</span>
            )}
        </div>
    </div>
));
