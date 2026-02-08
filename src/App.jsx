import React, { useState, useEffect, Component } from 'react';
import { SimulationProvider, useSimulation } from './simulation/SimulationContext';
import ChatPanel from './chat/ChatPanel';
import GraphVisualizer from './visualization/GraphVisualizer';
import GraphVisualizer3D from './visualization/GraphVisualizer3D';
import MetricsPanel from './metrics/MetricsPanel';
import JudgePanel from './judge/JudgePanel';
import ManualControlPanel from './components/ManualControlPanel'; // New Import
import ReasoningOverlay from './components/ReasoningOverlay';
import { Play, Activity, Globe, Shield, Box as Cube, Sun, Moon, Layers, CircleAlert, Settings } from 'lucide-react'; // Added Settings icon
import './App.css';

const THEME_STORAGE_KEY = 'mirrorworld-theme';

// Error Boundary for 3D Renderer
class VisualizerErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("3D Visualizer Crash:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ color: '#00f3ff', padding: '2rem', textAlign: 'center' }}>
                    <h3>VISUALIZATION_SYSTEM_FAILURE</h3>
                    <p>Rebooting graphics subsystem...</p>
                    <button
                        style={{ marginTop: '1rem', background: 'rgba(0, 243, 255, 0.2)', color: 'white', border: '1px solid #00f3ff', padding: '0.5rem 1rem' }}
                        onClick={() => this.setState({ hasError: false })}
                    >
                        FORCE_RESET
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const getInitialTheme = () => {
    if (typeof window === 'undefined') {
        return 'night';
    }
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initial = stored === 'day' ? 'day' : 'night';
    document.documentElement.setAttribute('data-theme', initial);
    return initial;
};

// --- Main App Content (Consumes Context) ---
function AppLayout() {
    const engine = useSimulation();
    const [demoActive, setDemoActive] = useState(false);
    const [judgeModeOpen, setJudgeModeOpen] = useState(false);
    const [manualControlOpen, setManualControlOpen] = useState(false); // State for Manual Panel
    const [view3D, setView3D] = useState(true);
    const [showTelemetry, setShowTelemetry] = useState(true);
    const [showTopology, setShowTopology] = useState(true);
    const [reasoningState, setReasoningState] = useState({ isOpen: false, step: 0, steps: [] });
    const [themeMode, setThemeMode] = useState(getInitialTheme);
    const [defenseActive, setDefenseActive] = useState(false);

    // Manual Control State (Lifted)
    const [activeTool, setActiveTool] = useState('CURSOR'); // CURSOR, CONNECT, or NODE_TYPE
    const [selectedNodeId, setSelectedNodeId] = useState(null);

    // Sync state from engine
    useEffect(() => {
        const unsub = engine.subscribe(() => {
            setDefenseActive(engine.defenseActive);
        });
        return unsub;
    }, [engine]);

    const toggleDefense = () => {
        engine.setDefenseMode(!engine.defenseActive);
    };

    // Sync reasoning state with ChatPanel events (via a simple custom event for demo purposes)
    useEffect(() => {
        const handleReasoningStart = (e) => {
            setReasoningState({ isOpen: true, step: 0, steps: e.detail.steps });

            // Auto-advance reasoning steps
            let current = 0;
            const interval = setInterval(() => {
                current++;
                if (current < e.detail.steps.length) {
                    setReasoningState(prev => ({ ...prev, step: current }));
                } else {
                    clearInterval(interval);
                    setTimeout(() => {
                        setReasoningState(prev => ({ ...prev, isOpen: false }));
                    }, 2000);
                }
            }, 1000);
        };

        window.addEventListener('astra-reasoning-start', handleReasoningStart);
        return () => window.removeEventListener('astra-reasoning-start', handleReasoningStart);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        document.documentElement.setAttribute('data-theme', themeMode);
        window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    }, [themeMode]);

    const toggleThemeMode = () => {
        setThemeMode(prev => (prev === 'night' ? 'day' : 'night'));
    };

    return (
        <div className="app-shell">
            {/* --- Header: System Telemetry --- */}
            <header className="glass-panel app-header">
                <div className="app-header-left">
                    <div className="app-header-brand">
                        <div className="animate-pulse-glow brand-orb">
                            <Globe size={18} color="var(--accent-primary)" />
                        </div>
                        <span className="brand-title">MIRROR_WORLD</span>
                    </div>

                    <div className="app-control-strip">
                        <button
                            onClick={() => setView3D(!view3D)}
                            className={`glass-button ${view3D ? 'active' : ''}`}
                            title={view3D ? "Switch to 2D" : "Switch to 3D"}
                            style={{ border: 'none', background: view3D ? 'rgba(0, 243, 255, 0.1)' : 'transparent' }}
                        >
                            <Cube size={14} style={{ marginRight: view3D ? '6px' : '0' }} />
                            {view3D && <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>3D_ENGINE</span>}
                        </button>
                        <button
                            onClick={() => setShowTelemetry(!showTelemetry)}
                            className={`glass-button ${showTelemetry ? 'active' : ''}`}
                            title="Toggle Heuristics"
                            style={{ border: 'none', background: showTelemetry ? 'rgba(0, 243, 255, 0.1)' : 'transparent' }}
                        >
                            <Activity size={14} style={{ marginRight: showTelemetry ? '6px' : '0' }} />
                            {showTelemetry && <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>TELEMETRY</span>}
                        </button>
                        <button
                            onClick={toggleThemeMode}
                            className={`glass-button ${themeMode === 'day' ? 'active' : ''}`}
                            title="Toggle day/night mode"
                            aria-pressed={themeMode === 'day'}
                            style={{ border: 'none' }}
                        >
                            {themeMode === 'day' ? <Moon size={14} /> : <Sun size={14} />}
                            <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{themeMode === 'day' ? 'NIGHT_MODE' : 'DAY_MODE'}</span>
                        </button>
                    </div>
                </div>

                <div className="app-right-actions">
                    <button
                        className={`glass-button ${manualControlOpen ? 'active' : ''}`}
                        onClick={() => setManualControlOpen(!manualControlOpen)}
                        title="Manual Control Panel"
                        style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <Settings size={14} />
                    </button>

                    <button
                        className="glass-button"
                        onClick={() => setJudgeModeOpen(true)}
                        title="Open Judge Panel"
                        style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <CircleAlert size={14} />
                    </button>
                    <button
                        className={`glass-button btn-primary-glass ${defenseActive ? 'active-pulse' : ''}`}
                        onClick={toggleDefense}
                        style={{
                            padding: '10px 20px',
                            border: defenseActive ? '1px solid var(--accent-success)' : '1px solid rgba(112, 0, 255, 0.3)',
                            borderRadius: 'var(--border-radius-md)',
                            letterSpacing: '1px',
                            background: defenseActive ? 'rgba(0, 255, 163, 0.1)' : undefined,
                            color: defenseActive ? 'var(--accent-success)' : undefined
                        }}
                    >
                        <Shield size={14} />
                        <span style={{ fontWeight: 800, fontSize: '0.7rem' }}>
                            {defenseActive ? 'DEFENSE_ACTIVE' : 'DEFENSE_PROTOCOL'}
                        </span>
                    </button>

                    <div className="system-status">
                        <div>
                            <div className={`status-dot ${defenseActive ? 'secure' : ''}`} />
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Sidebar: Intelligence Layer --- */}
            <div className="app-sidebar">
                <ChatPanel demoActive={demoActive} setDemoActive={setDemoActive} />
            </div>

            {/* --- Main Viewport: Visualization --- */}
            <div className="app-viewport">
                {/* Background Grid Effect */}
                <div className="viewport-grid-overlay" />

                <div className="viz-stage">
                    <VisualizerErrorBoundary>
                        {view3D ? (
                            <GraphVisualizer3D
                                showTopology={showTopology}
                                activeTool={activeTool}
                                selectedNodeId={selectedNodeId}
                                onNodeSelect={setSelectedNodeId}
                            />
                        ) : (
                            <GraphVisualizer
                                showTopology={showTopology}
                                activeTool={activeTool}
                                selectedNodeId={selectedNodeId}
                                onNodeSelect={setSelectedNodeId}
                            />
                        )}
                    </VisualizerErrorBoundary>
                </div>

                <div className="simulation-controls">
                    <button
                        onClick={() => setDemoActive(!demoActive)}
                        className={`glass-button ${demoActive ? 'danger' : 'btn-primary-glass'}`}
                        style={{
                            padding: '10px 16px',
                            border: demoActive ? '1px solid rgba(255, 0, 76, 0.3)' : '1px solid rgba(112, 0, 255, 0.3)',
                            background: demoActive ? 'rgba(255, 0, 76, 0.1)' : undefined,
                            color: demoActive ? 'var(--accent-danger)' : '#fff'
                        }}
                    >
                        {demoActive ? <Shield size={12} /> : <Play size={12} fill="currentColor" />}
                        {demoActive ? 'ABORT_DEMO' : 'START_SIMULATION'}
                    </button>
                    <button
                        className={`glass-button ${showTopology ? 'active' : ''}`}
                        onClick={() => setShowTopology(!showTopology)}
                        style={{
                            padding: '10px 16px',
                            border: '1px solid rgba(0, 243, 255, 0.3)',
                            background: showTopology ? 'rgba(0, 243, 255, 0.1)' : 'rgba(0, 243, 255, 0.05)',
                            color: 'var(--accent-primary)'
                        }}
                    >
                        <Layers size={12} /> TOPOLOGY
                    </button>
                </div>

                {/* Floating Metrics HUD */}
                {showTelemetry && (
                    <div className="metrics-hud">
                        <MetricsPanel />
                    </div>
                )}

                {/* Floating Manual Control Panel */}
                {manualControlOpen && (
                    <ManualControlPanel
                        engine={engine}
                        activeTool={activeTool}
                        setActiveTool={setActiveTool}
                        selectedNodeId={selectedNodeId}
                        setSelectedNodeId={setSelectedNodeId}
                    />
                )}

                {/* Bottom HUD: Event Log or Timeline Placeholder */}
                <div className="timeline-track">
                    <div className="timeline-marker" />
                </div>
            </div>

            {/* --- Overlays --- */}
            <JudgePanel isOpen={judgeModeOpen} onClose={() => setJudgeModeOpen(false)} />
            <ReasoningOverlay
                isOpen={reasoningState.isOpen}
                step={reasoningState.step}
                logicSteps={reasoningState.steps}
            />

        </div>
    );
}

function App() {
    return (
        <SimulationProvider>
            <AppLayout />
        </SimulationProvider>
    );
}

export default App;
