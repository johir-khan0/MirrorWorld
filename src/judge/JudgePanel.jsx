import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Layers, GitMerge, AlertTriangle, Shield, X } from 'lucide-react';

const TAB_DATA = [
    { id: 'qa', label: 'DEFENSE_QA', icon: <BookOpen size={14} /> },
    { id: 'diff', label: 'MARKET_EDGE', icon: <Layers size={14} /> },
    { id: 'roadmap', label: 'ROADMAP', icon: <GitMerge size={14} /> },
    { id: 'limits', label: 'SYSTEM_SPECS', icon: <AlertTriangle size={14} /> },
];

const QA_CONTENT = [
    {
        q: "The Core Bottleneck",
        a: "Translates natural language intent into deterministic graph operations, reducing the intent-to-simulation loop from days to seconds."
    },
    {
        q: "Simulation Accuracy",
        a: "Uses a deterministic Graph-Theory engine. Logic flows like congestion cascades and topological bottlenecks are mathematically sound."
    },
    {
        q: "Interface Rationale",
        a: "Treats infrastructure as a 'Programmable Canvas'. Zero-learning curve for policy makers to test high-impact 'What-If' scenarios."
    }
];

const ROADMAP_STEPS = [
    { phase: '01', title: 'Cognitive Layer', desc: "NLU mapping, 3D Graph Vis, Flow Engine", status: 'done' },
    { phase: '02', title: 'Agentic Backend', desc: "Live IoT integration, Rust-based engine", status: 'pending' },
    { phase: '03', title: 'Policy Engine', desc: "Generative optimization, Government portal", status: 'pending' }
];

export default function JudgePanel({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('qa');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="judge-panel-backdrop">
                    <Motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="glass-panel judge-panel-modal"
                    >
                        {/* Sidebar Navigation */}
                        <div className="judge-panel-nav">
                            <div style={{ marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-primary)' }}>
                                    <Shield size={20} />
                                    <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '2px' }}>DEFENSE_v2</span>
                                </div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>SECURE_ENCLAVE</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {TAB_DATA.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`glass-button ${activeTab === tab.id ? 'active' : ''}`}
                                        style={{
                                            justifyContent: 'flex-start',
                                            width: '100%',
                                            border: 'none',
                                            padding: '12px 16px',
                                            background: activeTab === tab.id ? 'rgba(0, 243, 255, 0.05)' : 'transparent'
                                        }}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="judge-panel-body">
                            <header className="judge-panel-body__header">
                                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                                    {TAB_DATA.find(t => t.id === activeTab).label}
                                </h1>
                                <button
                                    onClick={onClose}
                                    className="glass-button"
                                    style={{ width: '32px', height: '32px', borderRadius: '50%', padding: 0 }}
                                >
                                    <X size={16} />
                                </button>
                            </header>

                            <main className="judge-panel-body__content">
                                <AnimatePresence mode="wait">
                                    <Motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {activeTab === 'qa' && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                                                {QA_CONTENT.map((item, i) => (
                                                    <div key={i} className="glass-card">
                                                        <h4 style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 800 }}>{item.q}</h4>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: '1.6' }}>{item.a}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === 'diff' && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                                <div className="glass-card" style={{ borderTop: '2px solid var(--accent-danger)' }}>
                                                    <h3 style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', fontWeight: 800, marginBottom: '1.5rem' }}>LEGACY_GEOSPATIAL</h3>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: 0.6 }}>
                                                        {['Static Models', 'Expert Entry Only', 'Slow Iteration', 'Passive Displays'].map(t => (
                                                            <div key={t} style={{ fontSize: '0.75rem', color: '#fff' }}>✕ {t}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="glass-card" style={{ borderTop: '2px solid var(--accent-success)', background: 'rgba(0, 255, 163, 0.02)' }}>
                                                    <h3 style={{ color: 'var(--accent-success)', fontSize: '0.75rem', fontWeight: 800, marginBottom: '1.5rem' }}>MIRROR_WORLD_AI</h3>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {['Natural Language Interaction', 'Policy Maker Friendly', 'Instant Evolution', 'Active Decision Support'].map(t => (
                                                            <div key={t} style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>✓ {t}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'roadmap' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                {ROADMAP_STEPS.map((step, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: '2rem' }}>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: step.status === 'done' ? 'var(--accent-success)' : 'var(--text-muted)' }}>{step.phase}</div>
                                                            <div style={{ width: '2px', height: '100%', background: 'var(--bg-panel-border)', margin: '4px auto' }} />
                                                        </div>
                                                        <div className="glass-card" style={{ flex: 1 }}>
                                                            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '4px' }}>{step.title}</h4>
                                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step.desc}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === 'limits' && (
                                            <div className="glass-card" style={{ border: '1px dashed var(--accent-warning)', background: 'rgba(255, 189, 0, 0.02)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-warning)', marginBottom: '1rem' }}>
                                                    <AlertTriangle size={18} />
                                                    <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>CORE_DISCLAIMER</span>
                                                </div>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: '1.8' }}>
                                                    Current iteration is <strong>Client-Deterministic</strong>. Underlying logic reflects accurate graph-theoretical flow dynamics,
                                                    but does not ingestion live API streams in the demo environment.
                                                </p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: '1.8', marginTop: '1rem' }}>
                                                    <strong>AI Logic:</strong> Behavioral reasoning is a high-fidelity projection of the backend LLM architecture designed for human-readable audit trails.
                                                </p>
                                            </div>
                                        )}
                                    </Motion.div>
                                </AnimatePresence>
                            </main>
                        </div>
                    </Motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

