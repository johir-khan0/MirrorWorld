import React, { useEffect, useState } from 'react';
import { useSimulation } from '../simulation/SimulationContext';
import { Activity, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const MetricCard = ({ label, value, unit, status = 'neutral' }) => {
    const getColor = () => {
        if (status === 'critical') return 'var(--accent-danger)';
        if (status === 'good') return 'var(--accent-success)';
        if (status === 'warning') return 'var(--accent-warning)';
        return 'var(--accent-primary)';
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '4px',
            padding: '2px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid rgba(255, 255, 255, 0.05)', 
            whiteSpace: 'nowrap'
        }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: getColor(), boxShadow: `0 0 6px ${getColor()}` }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px' }}>{label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{value}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>{unit}</span>
                </div>
            </div>
        </div>
    );
};

export default function MetricsPanel() {
    const engine = useSimulation();
    const [stats, setStats] = useState(engine.metrics);

    useEffect(() => {
        const unsub = engine.subscribe((instance) => {
            setStats({ ...instance.metrics });
        });
        return unsub;
    }, [engine]);

    return (
        <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel metrics-panel"
            style={{
                border: '1px solid var(--bg-panel-border)',
                overflow: 'hidden',
                boxShadow: 'var(--card-shadow)',
                backdropFilter: 'blur(12px)',
                background: 'rgba(5, 5, 8, 0.85)'
            }}
        >
            <div style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', marginRight: '0.5rem', borderRight: '1px solid var(--bg-panel-border)', paddingRight: '0.75rem' }}>
                    <Activity size={14} className="animate-pulse-glow" />
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1.5px' }}>HEURISTICS</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
                    <MetricCard
                        label="NET"
                        value={Math.round(stats.throughput)}
                        unit="u/t"
                        status="good"
                    />

                    <MetricCard
                        label="ACTIVE"
                        value={stats.activeEntities}
                        unit="NODES"
                        status="neutral"
                    />

                    <MetricCard
                        label="SAVED"
                        value={stats.totalEvacuated}
                        unit="ppl"
                        status="good"
                    />

                    <MetricCard
                        label="RISK"
                        value={stats.riskLevel}
                        unit="LVL"
                        status={stats.systemStatus === 'CRITICAL' ? 'critical' : stats.systemStatus === 'UNSTABLE' ? 'warning' : 'good'}
                    />

                    <div style={{
                        padding: '2px 6px',
                        background: 'rgba(0, 255, 163, 0.03)',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: '1px solid rgba(0, 255, 163, 0.1)',
                        whiteSpace: 'nowrap'
                    }}>
                        <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: stats.systemStatus === 'CRITICAL' ? 'var(--accent-danger)' : stats.systemStatus === 'UNSTABLE' ? 'var(--accent-warning)' : 'var(--accent-success)',
                            boxShadow: `0 0 8px ${stats.systemStatus === 'CRITICAL' ? 'var(--accent-danger)' : stats.systemStatus === 'UNSTABLE' ? 'var(--accent-warning)' : 'var(--accent-success)'}`
                        }} />
                        <span style={{
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            letterSpacing: '1px',
                            color: stats.systemStatus === 'CRITICAL' ? 'var(--accent-danger)' : stats.systemStatus === 'UNSTABLE' ? 'var(--accent-warning)' : 'var(--accent-success)'
                        }}>
                            {stats.systemStatus || 'NOMINAL'}
                        </span>
                    </div>
                </div>
            </div>
        </Motion.div>
    );
}
