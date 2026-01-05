import React, { useState, useEffect, useRef } from 'react';
import { Send, Terminal, Cpu, ShieldCheck, Clock, RefreshCcw, User, Mic, StopCircle, Activity } from 'lucide-react';

const JARVIS_CONFIG = {
  WEBHOOK_URL: import.meta.env.VITE_WEBHOOK_URL || 'http://localhost:5678/webhook/javispro212',
  INITIAL_GREETING: "System online. Listening for commands.",
  ERROR_MESSAGE: "JARVIS is temporarily unavailable.",
  VOICE_LANG: 'en-US',
  AUTO_LISTEN_DELAY: 1500,
};

const App = () => {
  // --- State ---
  const [userId] = useState(() => {
    const savedId = localStorage.getItem('jarvis_user_id');
    if (savedId) return savedId;
    const newId = `USR-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
    localStorage.setItem('jarvis_user_id', newId);
    return newId;
  });

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('Online');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);

  // --- Refs ---
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);
  const voiceParams = useRef(null); // Store preferred voice

  // --- Helpers ---
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const stopSpeaking = () => {
    if (synthesisRef.current.speaking) {
      synthesisRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch {
        // Ignore "already started" errors
      }
    }
  };

  const loadVoice = () => {
    const voices = synthesisRef.current.getVoices();
    voiceParams.current = voices.find(v => v.name.includes('David') || v.name.includes('Google US English')) || null;
  };

  const speakResponse = (text) => {
    if (!voiceMode) return;
    stopSpeaking();

    const speechText = text.replace(/[*#]/g, '');
    const utterance = new SpeechSynthesisUtterance(speechText);

    if (!voiceParams.current) loadVoice();
    if (voiceParams.current) utterance.voice = voiceParams.current;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.speak(utterance);
  };

  const handleVoiceCommand = (command) => {
    const lowerCmd = command.toLowerCase().trim();
    if (['stop', 'cancel', 'wait', 'sleep'].includes(lowerCmd)) {
      stopSpeaking();
      setVoiceMode(false);
      setInput('');
      return;
    }
    setInput(command);
    handleSend(null, command);
  };

  // --- Effects ---

  // Initialize Speech Services
  useEffect(() => {
    // Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = JARVIS_CONFIG.VOICE_LANG;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (e) => handleVoiceCommand(e.results[0][0].transcript);

      recognitionRef.current = recognition;
    }

    // Synthesis Voice Loading
    if (synthesisRef.current.onvoiceschanged !== undefined) {
      synthesisRef.current.onvoiceschanged = loadVoice;
    }
    loadVoice();

    return () => {
      recognitionRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  // Auto-Listen Loop
  useEffect(() => {
    if (voiceMode && !isSpeaking && !isListening && !isLoading) {
      const timer = setTimeout(startListening, JARVIS_CONFIG.AUTO_LISTEN_DELAY);
      return () => clearTimeout(timer);
    }
  }, [voiceMode, isSpeaking, isListening, isLoading]);

  // Chat History & Scroll
  useEffect(() => {
    const saved = localStorage.getItem('jarvis_history');
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([{
        id: Date.now(),
        role: 'jarvis',
        text: JARVIS_CONFIG.INITIAL_GREETING,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (messages.length) {
      localStorage.setItem('jarvis_history', JSON.stringify(messages));
      scrollToBottom();
    }
  }, [messages]);

  // --- Handlers ---
  const handleSend = async (e, overrideInput = null) => {
    e?.preventDefault();
    const finalInput = overrideInput || input;
    if (!finalInput.trim() || isLoading) return;

    if (finalInput.toLowerCase() === 'voice mode') {
      setVoiceMode(true);
      setInput('');
      return;
    }

    // Stop speaking immediately if user interrupts
    stopSpeaking();

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: Date.now(), role: 'user', text: finalInput.trim(), timestamp };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(JARVIS_CONFIG.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: finalInput, user_id: userId })
      });

      if (!res.ok) throw new Error('Network error');

      const data = await res.json();
      const replyMsg = {
        id: Date.now() + 1,
        role: 'jarvis',
        text: data.reply || "Command executed.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, replyMsg]);
      speakResponse(replyMsg.text);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'jarvis',
        text: JARVIS_CONFIG.ERROR_MESSAGE,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }]);
      setStatus('Offline');
      setTimeout(() => setStatus('Online'), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Purge memory logs?")) {
      localStorage.removeItem('jarvis_history');
      setMessages([{
        id: Date.now(),
        role: 'jarvis',
        text: "Memory purged. System reset.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const toggleVoice = () => {
    if (voiceMode) {
      setVoiceMode(false);
      stopSpeaking();
    } else {
      setVoiceMode(true);
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#05070a] text-slate-300 font-sans selection:bg-cyan-500/30">
      <header className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/30 bg-[#080b12]/80 backdrop-blur-md">
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

      <main className="flex-1 overflow-y-auto px-4 py-8 md:px-24 lg:px-64 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
              <div className="flex items-center gap-2 mb-2 px-1">
                {msg.role === 'jarvis' ? (
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
                <span className="text-[9px] text-slate-600 font-mono">{msg.timestamp}</span>
              </div>

              <div className={`relative group max-w-[85%] px-5 py-3 rounded-xl border transition-all duration-300 ${msg.role === 'user'
                ? 'bg-slate-900/40 border-slate-700/50 text-slate-200'
                : msg.isError
                  ? 'bg-red-950/20 border-red-900/40 text-red-300'
                  : 'bg-[#0a0f18] border-cyan-900/30 text-cyan-50/90 shadow-[inset_0_0_20px_rgba(6,182,212,0.02)]'
                }`}>
                <p className="text-sm leading-relaxed tracking-wide font-medium whitespace-pre-wrap">{msg.text}</p>
                {msg.role === 'jarvis' && !msg.isError && (
                  <div className="absolute -left-1 top-0 w-[2px] h-full bg-cyan-500/40 rounded-full" />
                )}
              </div>
            </div>
          ))}

          {voiceMode && (
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
          )}

          {isLoading && (
            <div className="flex flex-col items-start animate-pulse">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Clock className="w-3 h-3 text-cyan-600 animate-spin" />
                <span className="text-[10px] uppercase tracking-widest font-black text-cyan-600">Processing...</span>
              </div>
              <div className="h-10 w-24 bg-cyan-950/20 border border-cyan-900/30 rounded-xl" />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      <footer className="p-4 md:p-8 bg-gradient-to-t from-[#05070a] via-[#05070a] to-transparent">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="relative flex items-center group gap-2">
            <div className="relative flex-1 group/input">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-600 group-focus-within/input:text-cyan-400 transition-colors pointer-events-none">
                <Terminal className="w-5 h-5" />
              </div>
              <input
                ref={inputRef}
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

    </div>
  );
};

export default App;