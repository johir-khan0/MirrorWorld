import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity } from 'lucide-react';

export default function ReasoningOverlay({ isOpen, step, logicSteps = [] }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <Motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="glass-panel reasoning-overlay"
                style={{
                    background: 'rgba(5, 5, 8, 0.95)', // Increased opacity for better contrast
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                {/* Decorative scanning line */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
                    opacity: 0.2,
                    animation: 'scan-vertical 4s linear infinite'
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                    <div style={{
                        padding: '6px',
                        background: 'rgba(0, 243, 255, 0.05)',
                        borderRadius: '6px',
                        color: 'var(--accent-primary)'
                    }}>
                        <Brain size={14} />
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: '#fff' }}>
                        LOGIC_STREAM
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {logicSteps.map((s, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            gap: '12px',
                            opacity: i === step ? 1 : 0.5,
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: i === step ? 'translateX(0)' : 'translateX(-4px)'
                        }}>
                            <div className="font-mono" style={{
                                width: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.55rem',
                                color: i === step ? 'var(--accent-primary)' : '#aaa',
                                border: `1px solid ${i === step ? 'var(--accent-primary)' : 'rgba(255,255,255,0.2)'}`,
                                borderRadius: '4px',
                                fontWeight: 800
                            }}>
                                {i + 1}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: i === step ? '#fff' : '#ccc', lineHeight: '1.5', fontWeight: i === step ? 500 : 400 }}>
                                {s}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{
                    marginTop: '1.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--bg-panel-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={10} color="var(--accent-primary)" />
                        <span style={{ fontSize: '0.55rem', color: '#aaa', fontWeight: 700, letterSpacing: '1px' }}>CONFIDENCE</span>
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: 800 }}>98.4%</div>
                </div>

                <style>{`
                    @keyframes scan-vertical {
                        0% { top: -10%; }
                        100% { top: 110%; }
                    }
                `}</style>
            </Motion.div>
        </AnimatePresence>
    );
}

