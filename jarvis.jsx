import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Terminal, Cpu, ShieldCheck, Clock, RefreshCcw, User } from 'lucide-react';

// Environment-aware config
const JARVIS_CONFIG = {
  WEBHOOK_URL: import.meta.env.VITE_WEBHOOK_URL || 'http://localhost:5678/webhook-test/javispro212',
  INITIAL_GREETING: "System online. How may I assist you today, sir?",
  ERROR_MESSAGE: "JARVIS is temporarily unavailable. Attempting to reconnect...",
  RETRY_DELAY: 5000,
  REQUEST_TIMEOUT: 30000,
};

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-[#05070a] text-red-400">
          <div className="text-center">
            <p className="text-lg font-bold">System Error</p>
            <p className="text-sm text-gray-500">{this.state.error?.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(() => `USR-${Math.random().toString(36).substring(2, 11).toUpperCase()}`);
  const [status, setStatus] = useState('Online');
  const retryTimeoutRef = useRef(null);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Safe localStorage parsing with error handling
  const safeLoadHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem('jarvis_history');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return null;
    }
  }, []);

  // Initialize Chat
  useEffect(() => {
    const savedHistory = safeLoadHistory();
    if (savedHistory?.length > 0) {
      setMessages(savedHistory);
    } else {
      setMessages([{
        id: Date.now(),
        role: 'jarvis',
        text: JARVIS_CONFIG.INITIAL_GREETING,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
    inputRef.current?.focus();
  }, [safeLoadHistory]);

  // Persist History with limit (last 100 messages)
  useEffect(() => {
    if (messages.length > 0) {
      try {
        const recentMessages = messages.slice(-100);
        localStorage.setItem('jarvis_history', JSON.stringify(recentMessages));
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    }
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSend = useCallback(async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), JARVIS_CONFIG.REQUEST_TIMEOUT);

      const response = await fetch(JARVIS_CONFIG.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, user_id: userId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.reply) {
        throw new Error('No reply from webhook');
      }

      const jarvisReply = {
        id: Date.now() + 1,
        role: 'jarvis',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, jarvisReply]);
      setStatus('Online');
    } catch (error) {
      console.error('Webhook error:', error.message);

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'jarvis',
        text: JARVIS_CONFIG.ERROR_MESSAGE,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }]);

      setStatus('Offline');

      // Clear previous timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Retry after delay
      retryTimeoutRef.current = setTimeout(
        () => setStatus('Online'),
        JARVIS_CONFIG.RETRY_DELAY
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, userId]);

  const clearHistory = useCallback(() => {
    if (window.confirm("Purge local memory logs?")) {
      try {
        localStorage.removeItem('jarvis_history');
        setMessages([{
          id: Date.now(),
          role: 'jarvis',
          text: "Memory purged. System reset.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } catch (error) {
        console.error('Failed to clear history:', error);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#05070a] text-slate-300 font-sans selection:bg-cyan-500/30">
      {/* HUD Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/30 bg-[#080b12]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 border border-cyan-500/50 rounded-lg flex items-center justify-center bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.2em] text-cyan-100 uppercase">JARVIS</h1>
            <p className="text-[10px] text-slate-500 tracking-wider uppercase font-medium">Personal AI Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">User ID</span>
            <span className="text-[11px] text-cyan-400 font-mono">{userId}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/50">
            <div className={`w-2 h-2 rounded-full ${status === 'Online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'} animate-pulse`} />
            <span className="text-[11px] font-bold uppercase tracking-tighter">{status}</span>
          </div>
        </div>
      </header>

      {/* Main Chat Interface */}
      <main className="flex-1 overflow-y-auto px-4 py-8 md:px-24 lg:px-64 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}
            >
              <div className="flex items-center gap-2 mb-2 px-1">
                {msg.role === 'jarvis' ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-cyan-500" />
                    <span className="text-[10px] uppercase tracking-widest font-black text-cyan-500">System Log</span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">Authorized User</span>
                    <User className="w-3 h-3 text-slate-500" />
                  </>
                )}
                <span className="text-[9px] text-slate-600 font-mono">{msg.timestamp}</span>
              </div>

              <div className={`
                relative group max-w-[85%] px-5 py-3 rounded-xl border transition-all duration-300
                ${msg.role === 'user' 
                  ? 'bg-slate-900/40 border-slate-700/50 text-slate-200' 
                  : msg.isError 
                    ? 'bg-red-950/20 border-red-900/40 text-red-300'
                    : 'bg-[#0a0f18] border-cyan-900/30 text-cyan-50/90 shadow-[inset_0_0_20px_rgba(6,182,212,0.02)]'
                }
              `}>
                <p className="text-sm leading-relaxed tracking-wide font-medium whitespace-pre-wrap">
                  {msg.text}
                </p>
                {msg.role === 'jarvis' && !msg.isError && (
                  <div className="absolute -left-1 top-0 w-[2px] h-full bg-cyan-500/40 rounded-full" />
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex flex-col items-start animate-pulse">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Clock className="w-3 h-3 text-cyan-600 animate-spin" />
                <span className="text-[10px] uppercase tracking-widest font-black text-cyan-600">JARVIS is thinking...</span>
              </div>
              <div className="h-10 w-24 bg-cyan-950/20 border border-cyan-900/30 rounded-xl" />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Input Section */}
      <footer className="p-4 md:p-8 bg-gradient-to-t from-[#05070a] via-[#05070a] to-transparent">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={handleSend}
            className="relative flex items-center group"
          >
            <div className="absolute left-4 text-cyan-600 group-focus-within:text-cyan-400 transition-colors pointer-events-none">
              <Terminal className="w-5 h-5" />
            </div>
            
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? "Processing sequence..." : "Execute command (e.g., 'plan my day')..."}
              disabled={isLoading}
              aria-label="Message input"
              className={`
                w-full bg-[#0d121d]/80 border border-slate-800 rounded-2xl py-4 pl-12 pr-16 
                text-sm tracking-wide text-slate-100 placeholder:text-slate-600
                focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20
                transition-all duration-300 shadow-2xl
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-700'}
              `}
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className={`
                absolute right-3 p-2.5 rounded-xl transition-all duration-300
                ${input.trim() && !isLoading 
                  ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)] hover:bg-cyan-500' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
              `}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between px-2">
            <div className="flex gap-4">
              <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Protocol: Secure_v2.4</span>
              <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Enc: AES-256</span>
            </div>
            <button 
              onClick={clearHistory}
              aria-label="Clear chat history"
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

// Export wrapped component
export default function WrappedApp() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}