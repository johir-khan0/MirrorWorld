import React from 'react';
import { Brain, Zap, ArrowRight } from 'lucide-react';

export default function ReasoningOverlay({ activeReasoning }) {
    if (!activeReasoning) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '8rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: 'rgba(10, 10, 20, 0.95)',
            border: '1px solid var(--accent-secondary)',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            boxShadow: '0 10px 40px rgba(112, 0, 255, 0.2)',
            minWidth: '400px',
            maxWidth: '600px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                <Brain size={18} color="var(--accent-secondary)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', color: 'var(--accent-secondary)' }}>DECISION LOGIC KERNEL</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeReasoning.map((step, i) => (
                    <div key={i} className="animate-slide-up" style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        fontSize: '0.9rem', color: '#ccc',
                        opacity: 0, animation: `slideUp 0.3s forwards ${i * 0.2}s`
                    }}>
                        <ArrowRight size={14} color="#666" />
                        {step}
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
