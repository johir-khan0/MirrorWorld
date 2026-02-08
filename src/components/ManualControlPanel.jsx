import React, { useState, useEffect } from 'react';
import { NODE_TYPES } from '../simulation/engine';
import {
    MousePointer2,
    Network,
    Settings,
    Play,
    Pause,
    Zap,
    Trash2,
    Hospital,
    Container, // Warehouse
    Building2, // Zone
    Waves, // Bridge
    Router, // Hub (using Router as proxy for Network Hub)
    ArrowRightCircle, // Source
    ArrowDownCircle, // Sink
    AlertTriangle,
    Image as ImageIcon,
    Upload,
    Loader2,
    X,
    Ambulance as AmbulanceIcon,
    Stethoscope,
    Car,
    Home,
    ShieldAlert,
    History,
    ZapOff,
    HandMetal
} from 'lucide-react';
import { analyzeMapImage } from '../simulation/geminiService';

const NODE_ICONS = {
    [NODE_TYPES.HOSPITAL]: Hospital,
    [NODE_TYPES.WAREHOUSE]: Container,
    [NODE_TYPES.ZONE]: Building2,
    [NODE_TYPES.BRIDGE]: Waves,
    [NODE_TYPES.HUB]: Router,
    [NODE_TYPES.SOURCE]: ArrowRightCircle,
    [NODE_TYPES.SINK]: ArrowDownCircle,
    [NODE_TYPES.AMBULANCE]: AmbulanceIcon,
    [NODE_TYPES.DOCTOR]: Stethoscope,
    [NODE_TYPES.VEHICLE]: Car,
    [NODE_TYPES.SHELTER]: Home
};

const ToolButton = ({ icon: Icon, label, active, onClick, color }) => (
    <button
        onClick={onClick}
        title={label}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: active ? 'rgba(0, 243, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            border: active ? '1px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            padding: '8px 4px',
            cursor: 'pointer',
            color: active ? 'var(--accent-primary)' : '#888',
            transition: 'all 0.2s ease',
            width: '100%',
            height: '100%'
        }}
    >
        <Icon size={18} color={color || 'currentColor'} style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '0.6rem', fontWeight: 600 }}>{label}</span>
    </button>
);

export default function ManualControlPanel({
    engine,
    activeTool,
    setActiveTool,
    selectedNodeId,
    setSelectedNodeId
}) {
    const [simSpeed, setSimSpeed] = useState(10);
    const [selectedNode, setSelectedNode] = useState(null);
    const [chaosMode, setChaosMode] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = React.useRef(null);

    // Sync selected node details when ID changes
    useEffect(() => {
        if (!selectedNodeId) {
            setSelectedNode(null);
            return;
        }

        const update = () => {
            const node = engine.getNodeById(selectedNodeId);
            if (node) setSelectedNode({ ...node });
            else setSelectedNode(null); // Clear local if not found
        };

        update();
        // Subscribe to engine updates to keep properties live (e.g. load)
        const unsub = engine.subscribe(() => {
            // Only update if we still have the same node selected
            if (selectedNodeId) update();
        });
        return unsub;
    }, [selectedNodeId, engine]);

    const handleDelete = () => {
        if (selectedNodeId) {
            engine.removeNode(selectedNodeId);
            if (setSelectedNodeId) setSelectedNodeId(null);
            setActiveTool('CURSOR'); // Reset tool
        }
    };

    const updateNodeProperty = (key, value) => {
        if (!selectedNodeId) return;
        const node = engine.getNodeById(selectedNodeId);
        if (node) {
            node[key] = value;
            if (key === 'capacity') node.maxCapacity = value; // Sync max cap
            engine.notify();
            setSelectedNode({ ...node }); // Local update
        }
    };

    const triggerManualEvent = (eventName, params) => {
        if (!selectedNodeId) return;
        switch (eventName) {
            case 'FLOOD':
                engine.triggerFlood(selectedNodeId);
                break;
            case 'COLLAPSE':
                // For edges, we need a different selection logic, but here assume node-related edge
                const edges = engine.getConnectedEdges(selectedNodeId);
                if (edges.length > 0) engine.collapseBridge(edges[0].id);
                break;
            case 'BOOST':
                engine.addEmergencyPersonnel(selectedNodeId);
                break;
            case 'LOCK':
                engine.lockNode(selectedNodeId);
                break;
            default:
                break;
        }
        // Force refresh local state
        const updated = engine.getNodeById(selectedNodeId);
        if (updated) setSelectedNode({ ...updated });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsAnalyzing(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64 = event.target.result;
                const result = await analyzeMapImage(base64);

                // Reconstruct Model
                engine.reset();

                // Track created node IDs by label or index
                const nodeMap = new Map();

                result.nodes.forEach((n, idx) => {
                    const newNode = engine.addNode({
                        type: n.type,
                        x: n.x,
                        y: n.y,
                        label: n.label || `Entity_${idx}`
                    });
                    nodeMap.set(n.label || idx.toString(), newNode.id);
                });

                // Establish connections
                if (result.edges) {
                    result.edges.forEach(e => {
                        const sId = nodeMap.get(e.source);
                        const tId = nodeMap.get(e.target);
                        if (sId && tId) {
                            engine.addEdge(sId, tId, { maxFlow: e.maxFlow || 100 });
                        }
                    });
                }

                engine.notify();
                setIsAnalyzing(false);
                // Reset input
                e.target.value = '';
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error("AI Reconstruction Failed:", err);
            alert("AI_RECONSTRUCTION_ERROR: Critical failure in topology mapping.");
            setIsAnalyzing(false);
        }
    };

    const handleExport = () => {
        const scenario = {
            nodes: Array.from(engine.nodes.values()),
            edges: Array.from(engine.edges.values()),
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mirrorworld-scenario-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const scenario = JSON.parse(event.target.result);
                engine.reset();

                if (scenario.nodes) {
                    scenario.nodes.forEach(n => engine.addNode(n));
                }
                if (scenario.edges) {
                    scenario.edges.forEach(e => engine.addEdge(e.source, e.target, e));
                }

                engine.notify();
                alert("SCENARIO_RESTORED: Temporal synchronization complete.");
            } catch (err) {
                console.error("Import failed:", err);
                alert("RESTORE_FAILURE: Scenario data corruption detected.");
            }
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <div style={{
            position: 'absolute',
            top: '80px',
            right: '20px',
            width: '280px',
            background: 'rgba(5, 5, 8, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1rem',
            color: '#eee',
            backdropFilter: 'blur(16px)',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px', color: '#fff' }}>
                    <Settings size={14} /> CONTROL_DECK
                </h3>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={handleExport}
                        title="Export Scenario"
                        style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <Upload size={12} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#888' }} title="Import Scenario">
                        <Upload size={12} />
                        <input type="file" onChange={handleImport} accept=".json" style={{ display: 'none' }} />
                    </label>
                    <div style={{ width: '8px' }} />
                    <button
                        onClick={() => engine.reset()}
                        title="Reset Simulation"
                        style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}
                    >
                        <Trash2 size={14} />
                    </button>
                    <button
                        onClick={() => engine.running ? engine.stop() : engine.start(simSpeed)}
                        style={{
                            background: engine.running ? 'rgba(255, 68, 68, 0.2)' : 'rgba(68, 255, 68, 0.2)',
                            border: '1px solid ' + (engine.running ? '#ff4444' : '#44ff44'),
                            color: engine.running ? '#ff4444' : '#44ff44',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            cursor: 'pointer'
                        }}
                    >
                        {engine.running ? <Pause size={12} /> : <Play size={12} />}
                    </button>
                </div>
            </div>

            {/* Core Global Controls - Now at the Top */}
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                <div style={{ fontSize: '0.65rem', color: '#666', fontWeight: 700, marginBottom: '10px' }}>CORE_SYSTEM_CONTROLS</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '2px', color: '#888' }}>
                            <span>Speed (FPS)</span>
                            <span>{simSpeed}</span>
                        </div>
                        <input
                            type="range"
                            min="1" max="60"
                            value={simSpeed}
                            onChange={e => setSimSpeed(parseInt(e.target.value))}
                            style={{ width: '100%', height: '4px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <button
                        onClick={() => setChaosMode(!chaosMode)}
                        style={{
                            background: chaosMode ? 'rgba(255, 165, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            color: chaosMode ? 'orange' : '#888',
                            border: '1px solid ' + (chaosMode ? 'orange' : 'rgba(255,255,255,0.1)'),
                            padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                    >
                        <Zap size={12} fill={chaosMode ? "currentColor" : "none"} /> {chaosMode ? 'CHAOS_ON' : 'CHAOS_OFF'}
                    </button>

                    <button
                        disabled={isAnalyzing}
                        onClick={() => fileInputRef.current.click()}
                        style={{
                            background: 'rgba(0, 243, 255, 0.05)',
                            color: 'var(--accent-primary)',
                            border: '1px solid rgba(0, 243, 255, 0.2)',
                            padding: '8px', borderRadius: '4px', cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                            fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                    >
                        {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />} {isAnalyzing ? 'ANALYZING' : 'IMPORT_MAP'}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                </div>
            </div>

            {/* Toolbar Grid */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.65rem', color: '#666', marginBottom: '8px', fontWeight: 700 }}>SYSTEM TOOLS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '1rem' }}>
                    <ToolButton
                        icon={MousePointer2}
                        label="SELECT"
                        active={activeTool === 'CURSOR'}
                        onClick={() => setActiveTool('CURSOR')}
                    />
                    <ToolButton
                        icon={Network}
                        label="CONNECT"
                        active={activeTool === 'CONNECT'}
                        onClick={() => setActiveTool('CONNECT')}
                    />
                    <ToolButton
                        icon={Trash2}
                        label="DELETE"
                        active={activeTool === 'DELETE'}
                        onClick={() => setActiveTool('DELETE')}
                        color="#ff4444"
                    />
                </div>

                <div style={{ fontSize: '0.65rem', color: '#666', marginBottom: '8px', fontWeight: 700 }}>INFRASTRUCTURE</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '1rem' }}>
                    {[NODE_TYPES.ZONE, NODE_TYPES.BRIDGE, NODE_TYPES.HUB, NODE_TYPES.WAREHOUSE].map(type => (
                        <ToolButton
                            key={type}
                            icon={NODE_ICONS[type]}
                            label={type === NODE_TYPES.WAREHOUSE ? 'WHOUSE' : type === NODE_TYPES.BRIDGE ? 'BRIDGE' : type}
                            active={activeTool === type}
                            onClick={() => setActiveTool(type)}
                        />
                    ))}
                </div>

                <div style={{ fontSize: '0.65rem', color: '#666', marginBottom: '8px', fontWeight: 700 }}>LOGISTICS & MEDICAL</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '1rem' }}>
                    {[NODE_TYPES.HOSPITAL, NODE_TYPES.SHELTER, NODE_TYPES.AMBULANCE, NODE_TYPES.DOCTOR].map(type => (
                        <ToolButton
                            key={type}
                            icon={NODE_ICONS[type]}
                            label={type === NODE_TYPES.HOSPITAL ? 'HOSP' : type === NODE_TYPES.AMBULANCE ? 'AMBUL' : type}
                            active={activeTool === type}
                            onClick={() => setActiveTool(type)}
                        />
                    ))}
                </div>

                <div style={{ fontSize: '0.65rem', color: '#666', marginBottom: '8px', fontWeight: 700 }}>ENTRIES & UNITS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {[NODE_TYPES.SOURCE, NODE_TYPES.SINK, NODE_TYPES.VEHICLE].map(type => (
                        <ToolButton
                            key={type}
                            icon={NODE_ICONS[type]}
                            label={type === NODE_TYPES.SOURCE ? 'IN' : type === NODE_TYPES.SINK ? 'OUT' : type}
                            active={activeTool === type}
                            onClick={() => setActiveTool(type)}
                        />
                    ))}
                </div>
            </div>

            {/* Properties Panel (Dynamic) */}
            {selectedNode && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', animation: 'fadeIn 0.2s', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: 700 }}>PROPERTIES</div>
                        <div style={{ fontSize: '0.65rem', color: '#888' }}>ID: {selectedNode.id.substring(0, 4)}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                            <label style={{ fontSize: '0.7rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Label</label>
                            <input
                                type="text"
                                value={selectedNode.label}
                                onChange={(e) => updateNodeProperty('label', e.target.value)}
                                style={{
                                    width: '100%', background: '#111', border: '1px solid #333',
                                    padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '0.8rem'
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                                <label style={{ fontSize: '0.7rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Load</label>
                                <input
                                    type="number"
                                    value={Math.round(selectedNode.load)}
                                    onChange={(e) => updateNodeProperty('load', parseInt(e.target.value))}
                                    style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '6px', borderRadius: '4px', color: '#fff' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Capacity</label>
                                <input
                                    type="number"
                                    value={selectedNode.capacity}
                                    onChange={(e) => updateNodeProperty('capacity', parseInt(e.target.value))}
                                    style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '6px', borderRadius: '4px', color: '#fff' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '5px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '2px', color: '#aaa' }}>
                                <span>Utilization</span>
                                <span>{Math.round((selectedNode.load / selectedNode.capacity) * 100)}%</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: '#333', borderRadius: '2px' }}>
                                <div style={{
                                    width: `${Math.min(100, (selectedNode.load / selectedNode.capacity) * 100)}%`,
                                    height: '100%',
                                    background: selectedNode.load > selectedNode.capacity ? '#ff4444' : 'var(--accent-primary)',
                                    borderRadius: '2px',
                                    transition: 'width 0.3s'
                                }} />
                            </div>
                        </div>

                        {/* Manual Event Trigger Section */}
                        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                            <div style={{ fontSize: '0.65rem', color: '#666', fontWeight: 700, marginBottom: '8px' }}>MANUAL_INTERVENTIONS</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <button
                                    onClick={() => triggerManualEvent('FLOOD')}
                                    style={{ background: 'rgba(0, 243, 255, 0.1)', border: '1px solid rgba(0, 243, 255, 0.2)', color: 'var(--accent-primary)', padding: '6px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <Zap size={10} /> Trigger_Flood
                                </button>
                                <button
                                    onClick={() => triggerManualEvent('BOOST')}
                                    style={{ background: 'rgba(68, 255, 68, 0.1)', border: '1px solid rgba(68, 255, 68, 0.2)', color: '#44ff44', padding: '6px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <HandMetal size={10} /> Add_Personnel
                                </button>
                                <button
                                    onClick={() => triggerManualEvent('LOCK')}
                                    style={{ background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.2)', color: '#ff4444', padding: '6px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <ZapOff size={10} /> Disable_Node
                                </button>
                                <button
                                    onClick={() => triggerManualEvent('COLLAPSE')}
                                    style={{ background: 'rgba(255, 165, 0, 0.1)', border: '1px solid rgba(255, 165, 0, 0.2)', color: 'orange', padding: '6px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <ShieldAlert size={10} /> Collapse_Link
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleDelete}
                        style={{ marginTop: '1rem', width: '100%', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.3)', color: '#ff6666', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        Delete Entity
                    </button>

                    <div style={{ marginTop: '1rem', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.7rem', color: '#666' }}>
                        <AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: '4.5px' }} />
                        Manual interventions bypass AI logic.
                    </div>
                </div>
            )}
        </div>
    );
}
