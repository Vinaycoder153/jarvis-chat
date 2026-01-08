import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { useSpeech } from './hooks/useSpeech';

import { Header } from './components/Header';
import { MessageBubble } from './components/MessageBubble';
import { VoiceIndicator } from './components/VoiceIndicator';
import { ChatInput } from './components/ChatInput';

const JARVIS_CONFIG = {
    WEBHOOK_URL: import.meta.env.VITE_WEBHOOK_URL || 'http://localhost:5678/webhook/javispro212',
    INITIAL_GREETING: "System online. Listening for commands.",
    ERROR_MESSAGE: "JARVIS is temporarily unavailable.",
    STORAGE_KEYS: {
        USER_ID: 'jarvis_user_id',
        HISTORY: 'jarvis_history'
    }
};

const TIME_FORMATTER = new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' });
const getTimestamp = () => TIME_FORMATTER.format(new Date());

const App = () => {
    // --- State ---
    const [userId] = useState(() => {
        const savedId = localStorage.getItem(JARVIS_CONFIG.STORAGE_KEYS.USER_ID);
        if (savedId) return savedId;
        const newId = `USR-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
        localStorage.setItem(JARVIS_CONFIG.STORAGE_KEYS.USER_ID, newId);
        return newId;
    });

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [status, setStatus] = useState('Online');
    const [isLoading, setIsLoading] = useState(false);

    // --- Refs ---
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // --- Handlers ---
    // Memoized to prevent re-renders in child components

    // Command Processing Logic
    const processCommand = useCallback(async (text) => {
        if (!text.trim() || isLoading) return;

        const timestamp = getTimestamp();
        const userMsg = { id: Date.now(), role: 'user', text: text.trim(), timestamp };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(JARVIS_CONFIG.WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, user_id: userId })
            });

            if (!res.ok) throw new Error('Network error');

            const data = await res.json();
            const replyMsg = {
                id: Date.now() + 1,
                role: 'jarvis',
                text: data.reply || "Command executed.",
                timestamp: getTimestamp()
            };

            setMessages(prev => [...prev, replyMsg]);
            return replyMsg.text; // Return text for speech
        } catch {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'jarvis',
                text: JARVIS_CONFIG.ERROR_MESSAGE,
                timestamp: getTimestamp(),
                isError: true
            }]);
            setStatus('Offline');
            setTimeout(() => setStatus('Online'), 5000);
            return null;
        } finally {
            setIsLoading(false);
            // Re-focus input after command execution
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isLoading, userId]);

    // Voice Command Handler
    const handleVoiceCommand = useCallback((command) => {
        const lowerCmd = command.toLowerCase().trim();
        if (['stop', 'cancel', 'wait', 'sleep'].includes(lowerCmd)) {
            // "stopSpeaking" and "setVoiceMode" will be called by the effect/hook logic if needed
            // But we can't access them here easily if they are circular.
            // Actually, we pass this TO useSpeech, so we can't call those here directly if they are from useSpeech.
            // However, useSpeech can handle the "Stop" logic internally or we expose a separate controller.
            // For now, let's keep it simple: we just need to consume the command.
            // If it's a stop command, we return a special signal or handle it via a ref if absolutely necessary?
            // Actually, simplified: Voice commands act as input. 
            // Control commands (stop) are better handled *inside* useSpeech or by checking result.
            // BUT, strictly following current logic:
            if (['stop', 'cancel', 'wait', 'sleep'].includes(lowerCmd)) {
                // We will trigger a voice mode toggle via a state effect or strict ref if needed,
                // but for now, let's handle it by setting a specialized state or just ignoring the processing.
                return; // The hook handles stopping simply by us NOT calling 'speak'. 
                // Wait, we need to stop the loop. This requires access to 'setVoiceMode'.
            }
        }
        setInput(command);
        // We will call handleSend logic explicitly here.
        // But better: reuse the internal logic.
        processCommand(command).then(replyText => {
            if (replyText) {
                // We need to speak. CONST { speak } = useSpeech... 
                // Circular dependency solved by useEffect below? No.
                // We'll use a ref to access the 'speak' function from the hook if needed, 
                // OR we just rely on standard flow.
                // Actually, separating the "Speak" triggering from "Process" is cleaner.
            }
        });
    }, [processCommand]);
    // Wait, the above logic is slightly flawed because handleVoiceCommand is PASSED to useSpeech.
    // It can't depend on things returned FROM useSpeech easily without circular deps or refs.
    // Resolution: We will use a Ref to hold the 'speak' function or 'setVoiceMode' if we need to call them from inside the callback that creates them.
    // OR BETTER: Keep it simple. The handleVoiceCommand just updates state/triggers fetch.
    // The speaking happens in the effect dependent on messages? No, that's too chatty.
    // Let's stick to the previous working model but memoize correctly.

    // We need to define "handleVoiceCommand" BEFORE useSpeech.
    // But it needs to stop speaking.
    // We can use a Ref for the control functions.

    const controlsRef = useRef({ stopSpeaking: () => { }, setVoiceMode: () => { }, speak: () => { } });

    const handleVoiceCommandMemo = useCallback((command) => {
        const lowerCmd = command.toLowerCase().trim();
        if (['stop', 'cancel', 'wait', 'sleep'].includes(lowerCmd)) {
            controlsRef.current.stopSpeaking();
            controlsRef.current.setVoiceMode(false);
            setInput('');
            return;
        }
        setInput(command);
        processCommand(command).then(reply => {
            if (reply) controlsRef.current.speak(reply);
        });
    }, [processCommand]);

    // --- Voice Hook ---
    const {
        isListening,
        isSpeaking,
        voiceMode,
        setVoiceMode,
        speak,
        toggleVoice,
        stopSpeaking
    } = useSpeech({
        onCommand: handleVoiceCommandMemo,
        isPaused: isLoading
    });

    // Update refs so the handler relies on fresh instances
    useEffect(() => {
        controlsRef.current = { stopSpeaking, setVoiceMode, speak };
    }, [stopSpeaking, setVoiceMode, speak]);

    const handleSend = useCallback(async (e) => {
        e?.preventDefault();

        if (input.toLowerCase() === 'voice mode') {
            setVoiceMode(true);
            setInput('');
            return;
        }

        stopSpeaking(); // Stop any current speech

        const reply = await processCommand(input);
        if (reply) speak(reply);
    }, [input, processCommand, speak, stopSpeaking, setVoiceMode]);

    const clearHistory = useCallback(() => {
        if (window.confirm("Purge memory logs?")) {
            localStorage.removeItem(JARVIS_CONFIG.STORAGE_KEYS.HISTORY);
            setMessages([{
                id: Date.now(),
                role: 'jarvis',
                text: "Memory purged. System reset.",
                timestamp: getTimestamp()
            }]);
        }
    }, []);

    // --- Effects ---
    useEffect(() => {
        const saved = localStorage.getItem(JARVIS_CONFIG.STORAGE_KEYS.HISTORY);
        if (saved) {
            setMessages(JSON.parse(saved));
        } else {
            setMessages([{
                id: Date.now(),
                role: 'jarvis',
                text: JARVIS_CONFIG.INITIAL_GREETING,
                timestamp: getTimestamp()
            }]);
        }
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (messages.length) {
            localStorage.setItem(JARVIS_CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(messages));
            scrollToBottom();
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-screen bg-[#05070a] text-slate-300 font-sans selection:bg-cyan-500/30">
            <Header userId={userId} status={status} />

            <main className="flex-1 overflow-y-auto px-4 py-8 md:px-24 lg:px-64 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-8">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} {...msg} />
                    ))}

                    {voiceMode && (
                        <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} />
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

            <ChatInput
                ref={inputRef}
                input={input}
                setInput={setInput}
                handleSend={handleSend}
                isLoading={isLoading}
                voiceMode={voiceMode}
                toggleVoice={toggleVoice}
                clearHistory={clearHistory}
            />
        </div>
    );
};

export default App;