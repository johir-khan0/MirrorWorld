import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Terminal, Cpu, Play, Activity, Sparkles, Command, ShieldAlert, Zap, Layers, BarChart3, Database, Trash2, HelpCircle } from 'lucide-react';
import { processCommand, DEMO_SCENARIO } from './mockAI.js';
import { useSimulation } from '../simulation/SimulationContext.jsx';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const TypewriterEffect = ({ text }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let index = 0;
        const intervalId = setInterval(() => {
            if (index >= text.length) {
                clearInterval(intervalId);
                return;
            }
            const charToAdd = text.charAt(index);
            setDisplayedText((prev) => prev + charToAdd);
            index++;
        }, 15); // Adjust speed here (lower = faster)
        return () => clearInterval(intervalId);
    }, [text]);

    return (
        <>
            {displayedText.split('\n').map((line, i) => (
                <div key={i} style={{ marginBottom: line.trim() === '' ? '0.6rem' : 0 }}>
                    {line}
                </div>
            ))}
        </>
    );
};

const QUICK_COMMANDS = ['STATUS', 'SCAN NETWORK', 'OPTIMIZE FLOW', 'RESET'];

const ThinkingIndicator = ({ steps = [] }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (steps.length === 0) return;
        const interval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % steps.length);
        }, 800);
        return () => clearInterval(interval);
    }, [steps]);

    return (
        <Motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="thinking-indicator"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(0, 243, 255, 0.1)',
                margin: '1rem 0'
            }}
        >
            <div className="animate-pulse-glow" style={{ color: 'var(--accent-primary)' }}>
                <Sparkles size={14} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: 'var(--accent-primary)', marginBottom: '4px' }}>
                    AI_PROCESSING
                </div>
                <AnimatePresence mode="wait">
                    <Motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                    >
                        {`> ${steps[currentStep] || 'Analyzing vectors...'}`}
                    </Motion.div>
                </AnimatePresence>
            </div>
        </Motion.div>
    );
};

// eslint-disable-next-line no-unused-vars
export default function ChatPanel({ demoActive, setDemoActive }) {
    const engine = useSimulation();
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [thinkingSteps, setThinkingSteps] = useState([]);
    const [messages, setMessages] = useState([
        { id: 1, sender: 'system', text: '> CORELINK: ONLINE\n> AWAITING COMMANDS...' }
    ]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isThinking]);

    const handleCommand = useCallback((cmdText) => {
        const text = cmdText || input;
        if (!text.trim()) return;

        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: text }]);
        if (!cmdText) setInput('');

        setIsThinking(true);
        const result = processCommand(text, engine);

        const logicSteps = result.reasoning || ['Vectors... ok', 'Scanning...', 'Synthesizing...'];

        setThinkingSteps(logicSteps);

        window.dispatchEvent(new CustomEvent('astra-reasoning-start', {
            detail: { steps: logicSteps }
        }));

        setTimeout(() => {
            setIsThinking(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'system',
                text: result.text,
                type: result.action,
                intent: result.intent
            }]);
        }, 1000 + (logicSteps.length * 400));
    }, [engine, input]);

    const simulateUserTyping = useCallback((text) => {
        handleCommand(text);
    }, [handleCommand]);

    useEffect(() => {
        if (!demoActive) return;

        let timeouts = [];
        DEMO_SCENARIO.forEach((step) => {
            const t = setTimeout(() => {
                simulateUserTyping(step.text);
            }, step.delay);
            timeouts.push(t);
        });

        return () => timeouts.forEach(clearTimeout);
    }, [demoActive, simulateUserTyping]);

    const clearChat = () => {
        setMessages([{ id: Date.now(), sender: 'system', text: '> SYSTEM_FLUSHED\n> READY.' }]);
    };

    const showHelp = () => {
        handleCommand('help'); // Leveraging existing logic if it handles help overwise custom msg
        // Actually, let's just push the message directly to ensure it works as expected without relying on mockAI handling 'help' perfectly if not defined.
        setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'system',
            text: '> COMMAND_LIST:\n• ADD [NODE_TYPE] [LOCATION]\n• CONNECT [A] TO [B]\n• OPTIMIZE FLOW\n• LOAD [SCENARIO]'
        }]);
    };

    const onSubmit = (e) => {
        e.preventDefault();
        handleCommand();
    };

    return (
        <div className="chat-panel" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'transparent',
            position: 'relative'
        }}>
            {/* --- Panel Header --- */}
            <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--bg-panel-border)',
                background: 'transparent',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: '6px',
                            background: 'rgba(0, 243, 255, 0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(0, 243, 255, 0.1)'
                        }}>
                            <Command size={14} color="var(--accent-primary)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-main)' }}>INTELLIGENCE_LAYER</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={showHelp}
                            title="Command Help"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            className="hover-bright"
                        >
                            <HelpCircle size={14} />
                        </button>
                        <button
                            onClick={clearChat}
                            title="Clear History"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            className="hover-bright"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Chat Feed --- */}
            <div className="chat-feed">
                <AnimatePresence>
                    {messages.map((msg) => (
                        <Motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%'
                            }}
                        >
                            <div className="chat-meta" style={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                                {msg.sender === 'user' ? (
                                    <><span>{new Date(msg.id).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</span> <div style={{ width: 10, height: 1, background: 'var(--accent-primary)', opacity: 0.3 }}></div> USER</>
                                ) : (
                                    <><div style={{ width: 10, height: 1, background: 'var(--accent-secondary)', opacity: 0.3 }}></div> ASTRA_CORE <span>{new Date(msg.id).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</span></>
                                )}
                            </div>

                            <div className={`chat-bubble ${msg.sender}`}>
                                {msg.sender === 'system' ? (
                                    <TypewriterEffect text={msg.text} />
                                ) : (
                                    msg.text.split('\n').map((line, i) => (
                                        <div key={i} style={{ marginBottom: line.trim() === '' ? '0.6rem' : 0 }}>
                                            {line}
                                        </div>
                                    ))
                                )}
                            </div>
                        </Motion.div>
                    ))}
                </AnimatePresence>

                {isThinking && <ThinkingIndicator steps={thinkingSteps} />}
                <div ref={messagesEndRef} />
            </div>

            {/* --- Input Terminal --- */}
            <div className="terminal-footer">
                <div className="quick-chips">
                    {QUICK_COMMANDS.map(cmd => (
                        <button
                            key={cmd}
                            className="chip-btn"
                            onClick={() => handleCommand(cmd)}
                            disabled={demoActive || isThinking}
                        >
                            {cmd}
                        </button>
                    ))}
                </div>

                <form onSubmit={onSubmit} className={`terminal-input-wrapper ${isThinking ? 'thinking' : ''}`}>
                    <div className="terminal-icon">
                        <Terminal size={14} />
                    </div>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="TERMINAL_COMMAND..."
                        disabled={demoActive || isThinking}
                        className="terminal-input"
                    />

                    <button
                        type="submit"
                        disabled={!input.trim() || demoActive || isThinking}
                        className={`send-btn ${input.trim() ? 'active' : ''}`}
                    >
                        <Send size={14} />
                    </button>
                </form>

                <div className="status-bar">
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="status-item">
                            <Database size={10} /> DB_READY
                        </div>
                        <div className="status-item">
                            <Activity size={10} /> STREAM_LIVE
                        </div>
                    </div>
                    <div className="status-item" style={{ color: 'var(--accent-primary)' }}>
                        SYTH_ACTIVE
                    </div>
                </div>
            </div>
        </div>
    );
}
