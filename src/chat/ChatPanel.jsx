import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Terminal, Cpu, Play, Activity, Sparkles, Command, ShieldAlert, Zap, Layers, BarChart3, Database, Trash2, HelpCircle, Image as ImageIcon } from 'lucide-react';
import { processCommand, DEMO_SCENARIO } from './mockAI.js';
import { useSimulation } from '../simulation/SimulationContext.jsx';
import { analyzeMapImage, analyzeScenarioText } from '../simulation/geminiService.js';
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
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

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
    const fileInputRef = useRef(null);

    const formatBytes = (bytes) => {
        if (!bytes) return '0 KB';
        const sizes = ['B', 'KB', 'MB'];
        const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
        const value = bytes / Math.pow(1024, index);
        return `${index === 0 ? value.toFixed(0) : value.toFixed(1)} ${sizes[index]}`;
    };

    const applyTopologyToEngine = useCallback((topology) => {
        const labelToIdMap = {};
        let addedNodes = 0;
        let addedEdges = 0;

        // Add Nodes
        if (topology.nodes) {
            topology.nodes.forEach(n => {
                const xVal = parseFloat(n.x);
                const yVal = parseFloat(n.y);
                // Use parsed value if valid, otherwise random
                const finalX = !isNaN(xVal) ? xVal : (Math.random() * 800 + 100);
                const finalY = !isNaN(yVal) ? yVal : (Math.random() * 600 + 100);

                const id = engine.addNode({
                    ...n,
                    x: Math.max(0, Math.min(1000, finalX)), // internal engine coords 0-1000
                    y: Math.max(0, Math.min(1000, finalY)),
                    type: n.type ? n.type.toUpperCase() : 'ZONE',
                    label: n.label || `Node_${Math.floor(Math.random() * 1000)}`
                });
                if (n.label) {
                    labelToIdMap[n.label] = id;
                }
                addedNodes++;
            });
        }

        // Add Edges
        if (topology.edges) {
            topology.edges.forEach(edge => {
                const sId = labelToIdMap[edge.source];
                const tId = labelToIdMap[edge.target];
                if (sId && tId) {
                    engine.addEdge(sId, tId, { maxFlow: edge.maxFlow || 50 });
                    addedEdges++;
                }
            });
        }

        engine.start();
        return { addedNodes, addedEdges };
    }, [engine]);

    const processImageFile = useCallback((file) => {
        if (!file || demoActive || isThinking) return Promise.resolve();

        if (!file.type?.startsWith('image/')) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'system',
                text: 'Image rejected: unsupported file format. Please upload PNG or JPG files.'
            }]);
            return Promise.resolve();
        }

        if (file.size > MAX_UPLOAD_BYTES) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'system',
                text: `Image rejected: file exceeds ${formatBytes(MAX_UPLOAD_BYTES)} limit.`
            }]);
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64 = event.target.result;

                setMessages(prev => [...prev, {
                    id: Date.now(),
                    sender: 'user',
                    text: '[Uploaded Image]',
                    isImage: true,
                    image: base64
                }]);

                setIsThinking(true);
                const steps = ['Scanning image...', 'Extracting topology...', 'Generating 3D assets...'];
                setThinkingSteps(steps);

                window.dispatchEvent(new CustomEvent('astra-reasoning-start', {
                    detail: { steps }
                }));

                try {
                    const topology = await analyzeMapImage(base64);

                    console.log("Topology received from Gemini:", topology); // Debug log

                    if (!topology || !topology.nodes || topology.nodes.length === 0) {
                        throw new Error("No discernible entities found in the image.");
                    }

                    const stats = applyTopologyToEngine(topology);
                    console.log("Stats returned from applyTopologyToEngine:", stats); // Debug log

                    await new Promise(r => setTimeout(r, 2000));

                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        sender: 'system',
                        text: `Vision analysis complete. I detected ${stats.addedNodes} entities and ${stats.addedEdges} connections. The simulation has been updated.`
                    }]);

                    // Show AI Explanation if available
                    if (topology.explanation) {
                        setMessages(prev => [...prev, {
                            id: Date.now() + 2,
                            sender: 'system',
                            text: `> ANALYSIS REASONING:\n${topology.explanation}`
                        }]);
                    }

                    resolve();
                } catch (err) {
                    console.error(err);
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        sender: 'system',
                        text: 'Error processing image: ' + err.message
                    }]);
                    reject(err);
                } finally {
                    setIsThinking(false);
                }
            };

            reader.onerror = () => {
                const error = new Error('Unable to read the selected image.');
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    sender: 'system',
                    text: 'Image upload interrupted before analysis. Please try again.'
                }]);
                reject(error);
            };

            reader.readAsDataURL(file);
        }).finally(() => {
            if (fileInputRef.current) fileInputRef.current.value = '';
        });
    }, [demoActive, isThinking, analyzeMapImage, applyTopologyToEngine]);

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processImageFile(file);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isThinking]);

    // Removed duplicate applyTopologyToEngine definition

    const handleCommand = useCallback(async (cmdText) => {
        const text = cmdText || input;
        if (!text.trim()) return;

        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: text }]);
        if (!cmdText) setInput('');

        setIsThinking(true);
        
        // 1. Try Local Rule-Based Engine First
        const result = processCommand(text, engine);
        const isFallback = result.action === 'FALLBACK';

        if (!isFallback) {
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
            return;
        }

        // 2. Fallback to Gemini for Natural Language Scenario Generation
        const aiSteps = ['Analyzing intent...', 'Constructing simulation...', 'Validating topology...'];
        setThinkingSteps(aiSteps);
        window.dispatchEvent(new CustomEvent('astra-reasoning-start', {
            detail: { steps: aiSteps }
        }));

        try {
            const topology = await analyzeScenarioText(text);
            const stats = applyTopologyToEngine(topology);

            let resultMsg = `Simulation generated. I have established ${stats.addedNodes} entities and ${stats.addedEdges} connections based on your scenario: "${text}".`;
            
            if (topology.explanation) {
                resultMsg += `\n\n> **DESIGN REASONING**:\n${topology.explanation}`;
            }

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'system',
                text: resultMsg
            }]);

        } catch (err) {
            console.error(err);
             setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'system',
                text: "I couldn't generate a simulation from that description. Try being more specific about the entities (e.g., 'Create a city with 3 hospitals and 5 zones')."
            }]);
        } finally {
            setIsThinking(false);
        }
    }, [engine, input, applyTopologyToEngine]);

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
        setMessages([{ id: Date.now(), sender: 'system', text: 'System flushed. I am ready for your next command.' }]);
    };

    const showHelp = () => {
        handleCommand('help'); // Leveraging existing logic if it handles help overwise custom msg
        // Actually, let's just push the message directly to ensure it works as expected without relying on mockAI handling 'help' perfectly if not defined.
        setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'system',
            text: 'Here is a list of commands you can use:\n• Add [NODE_TYPE] [LOCATION]\n• Connect [A] to [B]\n• Optimize flow\n• Load [SCENARIO]'
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
                                {msg.isImage ? (
                                    <div style={{ marginTop: '4px' }}>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '6px' }}>{msg.text}</div>
                                        <img 
                                            src={msg.image} 
                                            alt="User upload" 
                                            style={{ borderRadius: '8px', border: '1px solid var(--accent-primary)', maxWidth: '100%' }} 
                                        />
                                    </div>
                                ) : msg.sender === 'system' ? (
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
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        style={{ display: 'none' }} 
                        accept="image/*"
                    />
                    
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="terminal-icon-btn"
                        disabled={demoActive || isThinking}
                        title="Upload Image for AI Analysis"
                    >
                        <ImageIcon size={16} />
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="TERMINAL_COMMAND or Upload Image..."
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
