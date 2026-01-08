import React, { memo, forwardRef } from 'react';
import { Terminal, Send, Mic, StopCircle, RefreshCcw } from 'lucide-react';

export const ChatInput = memo(forwardRef(({
    input,
    setInput,
    handleSend,
    isLoading,
    voiceMode,
    toggleVoice,
    clearHistory
}, ref) => (
    <footer className="p-4 md:p-8 bg-gradient-to-t from-[#05070a] via-[#05070a] to-transparent">
        <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSend} className="relative flex items-center group gap-2">
                <div className="relative flex-1 group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-600 group-focus-within/input:text-cyan-400 transition-colors pointer-events-none">
                        <Terminal className="w-5 h-5" />
                    </div>
                    <input
                        ref={ref}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isLoading ? "Processing..." : "Execute command..."}
                        disabled={isLoading}
                        className={`
                            w-full bg-[#0d121d]/80 border border-slate-800 rounded-2xl py-4 pl-12 pr-12 
                            text-sm tracking-wide text-slate-100 placeholder:text-slate-600 font-mono
                            focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20
                            transition-all duration-300 shadow-2xl
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-700'}
                        `}
                    />
                </div>

                <button
                    type="button"
                    onClick={toggleVoice}
                    className={`p-4 rounded-xl border transition-all duration-300 group/mic ${voiceMode
                        ? 'bg-red-500/10 border-red-500/50 text-red-400 animate-pulse'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30'
                        }`}
                    title={voiceMode ? "Stop Auto-Listen" : "Start Auto-Listen Loop"}
                >
                    {voiceMode ? (
                        <StopCircle className="w-5 h-5" />
                    ) : (
                        <Mic className="w-5 h-5 group-hover/mic:scale-110 transition-transform" />
                    )}
                </button>

                <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={`p-4 rounded-xl transition-all duration-300 ${input.trim() && !isLoading
                        ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)] hover:bg-cyan-500'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>

            <div className="mt-4 flex items-center justify-between px-2">
                <div className="flex gap-4">
                    <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Protocol: Secure_v2.4</span>
                    <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Enc: AES-256</span>
                </div>
                <button
                    onClick={clearHistory}
                    className="flex items-center gap-1.5 text-[9px] text-slate-600 uppercase tracking-widest font-bold hover:text-cyan-500 transition-colors"
                >
                    <RefreshCcw className="w-2.5 h-2.5" />
                    Reset Cache
                </button>
            </div>
        </div>
    </footer>
)));
