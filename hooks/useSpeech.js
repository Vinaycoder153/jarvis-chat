import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeech = ({
    lang = 'en-US',
    autoListenDelay = 1500,
    onCommand,
    isPaused = false
}) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceMode, setVoiceMode] = useState(false);

    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);
    const voiceRef = useRef(null);
    const onCommandRef = useRef(onCommand);

    // Keep callback fresh to avoid stale closures
    useEffect(() => {
        onCommandRef.current = onCommand;
    }, [onCommand]);

    const loadVoice = useCallback(() => {
        const voices = synthesisRef.current.getVoices();
        voiceRef.current = voices.find(v => v.name.includes('David') || v.name.includes('Google US English')) || null;
    }, []);

    const stopSpeaking = useCallback(() => {
        if (synthesisRef.current.speaking) {
            synthesisRef.current.cancel();
        }
        setIsSpeaking(false);
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
            } catch {
                // Ignore errors like "already started"
            }
        }
    }, [isListening]);

    const speak = useCallback((text) => {
        if (!voiceMode) return;
        stopSpeaking();

        const speechText = text.replace(/[*#]/g, '');
        const utterance = new SpeechSynthesisUtterance(speechText);

        if (!voiceRef.current) loadVoice();
        if (voiceRef.current) utterance.voice = voiceRef.current;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthesisRef.current.speak(utterance);
    }, [voiceMode, stopSpeaking, loadVoice]);

    // Initialize Speech Services
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = lang;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (e) => {
                const command = e.results[0][0].transcript;
                onCommandRef.current?.(command);
            };

            recognitionRef.current = recognition;
        }

        if (synthesisRef.current.onvoiceschanged !== undefined) {
            synthesisRef.current.onvoiceschanged = loadVoice;
        }
        loadVoice();

        return () => {
            recognitionRef.current?.stop();
            stopSpeaking();
        };
    }, [lang, stopSpeaking, loadVoice]);

    // Auto-Listen Loop
    useEffect(() => {
        if (voiceMode && !isSpeaking && !isListening && !isPaused) {
            const timer = setTimeout(startListening, autoListenDelay);
            return () => clearTimeout(timer);
        }
    }, [voiceMode, isSpeaking, isListening, isPaused, autoListenDelay, startListening]);

    const toggleVoice = useCallback(() => {
        setVoiceMode(prev => {
            const nextMode = !prev;
            if (!nextMode) stopSpeaking();
            else startListening();
            return nextMode;
        });
    }, [stopSpeaking, startListening]);

    return {
        isListening,
        isSpeaking,
        voiceMode,
        setVoiceMode,
        speak,
        toggleVoice,
        stopSpeaking,
        startListening
    };
};
