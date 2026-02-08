import React, { useRef, useEffect, useState } from 'react';
import { useSimulation } from '../simulation/SimulationContext';
import { NODE_TYPES } from '../simulation/engine.js';

// --- Visual Config ---
const COLORS = {
    BG: '#050508',
    NODE_DEFAULT: '#4f4f6f',
    NODE_SOURCE: '#00f3ff', // Cyan
    NODE_SINK: '#7000ff',   // Purple
    NODE_HUB: '#ffffff',
    EDGE_NORMAL: 'rgba(255, 255, 255, 0.1)',
    EDGE_CONGESTED: 'rgba(255, 165, 0, 0.6)', // Orange
    EDGE_CRITICAL: 'rgba(255, 69, 0, 0.8)',   // Red-Orange
    EDGE_BLOCKED: 'rgba(255, 0, 60, 0.5)',
    PARTICLE: '#00f3ff',
    NODE_AMBULANCE: '#ff4b4b',
    NODE_DOCTOR: '#44ff44',
    NODE_VEHICLE: '#ffd700',
    NODE_SHELTER: '#0099ff'
};

const LEGEND_ITEMS = [
    { label: 'POPULATION SOURCE', color: COLORS.NODE_SOURCE },
    { label: 'TRANSIT HUB', color: COLORS.NODE_HUB },
    { label: 'EVACUATION POINT', color: COLORS.NODE_SINK },
    { label: 'RESOURCES (MEDICAL/LOG)', color: '#44ff44' },
    { label: 'CONGESTED ROUTE', color: COLORS.EDGE_CONGESTED, type: 'line', style: 'solid' },
    { label: 'BLOCKED/COLLAPSED', color: '#ff003c', type: 'line', style: 'dashed' }
];

export default function GraphVisualizer({ showTopology = true, activeTool, selectedNodeId, onNodeSelect }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const engine = useSimulation();
    const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
    const [hoverNode, setHoverNode] = useState(null);

    // Interaction State
    const isDragging = useRef(false);
    const dragNode = useRef(null);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const tempEdgeTarget = useRef(null); // { x, y } for ghost line

    // Resize Handler
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                setDimensions({ w: offsetWidth, h: offsetHeight });
                if (canvasRef.current) {
                    canvasRef.current.width = offsetWidth;
                    canvasRef.current.height = offsetHeight;
                }
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Helper: Screen to World & World to Screen
    // World is 1000x1000. Canvas is WxH. Padding 50.
    const getScale = () => {
        const padding = 50;
        const availableW = dimensions.w - padding * 2;
        const availableH = dimensions.h - padding * 2;
        return {
            x: availableW / 1000,
            y: availableH / 1000,
            padding
        };
    };

    const worldToScreen = (wx, wy) => {
        const { x, y, padding } = getScale();
        return {
            x: wx * x + padding,
            y: wy * y + padding
        };
    };

    const screenToWorld = (sx, sy) => {
        const { x, y, padding } = getScale();
        return {
            x: (sx - padding) / x,
            y: (sy - padding) / y
        };
    };

    // Render Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const render = () => {
            ctx.clearRect(0, 0, dimensions.w, dimensions.h);

            const nodes = Array.from(engine.nodes.values());
            const edges = Array.from(engine.edges.values());

            // --- Draw Edges ---
            edges.forEach(edge => {
                const source = engine.nodes.get(edge.source);
                const target = engine.nodes.get(edge.target);
                if (!source || !target) return;

                const p1 = worldToScreen(source.x, source.y);
                const p2 = worldToScreen(target.x, target.y);

                if (showTopology) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);

                    if (edge.state === 'BLOCKED') {
                        ctx.strokeStyle = COLORS.EDGE_BLOCKED;
                        ctx.lineWidth = 3;
                        ctx.setLineDash([10, 10]);

                        // X Mark at center
                        const mx = (p1.x + p2.x) / 2;
                        const my = (p1.y + p2.y) / 2;
                        ctx.fillStyle = '#ff003c';
                        ctx.font = '20px Arial';
                        ctx.fillText('✕', mx - 6, my + 6);
                    } else if (edge.state === 'CONGESTED') {
                        const level = edge.congestionLevel || 0;
                        ctx.strokeStyle = level > 0.8 ? COLORS.EDGE_CRITICAL : COLORS.EDGE_CONGESTED;
                        ctx.lineWidth = 3;
                        ctx.setLineDash([]);
                    } else {
                        const flowRatio = edge.flow / (edge.maxFlow || 100);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + flowRatio * 0.4})`;
                        ctx.lineWidth = 1 + flowRatio * 4;
                        ctx.setLineDash([]);
                    }
                    ctx.stroke();
                }

                // --- Particles ---
                if (edge.state !== 'BLOCKED' && edge.flow > 0) {
                    const particleCount = Math.max(1, Math.floor(edge.flow / 10));
                    const time = Date.now() / 1000;

                    for (let i = 0; i < particleCount; i++) {
                        let offset = (i / particleCount) + (time * 0.5);
                        if (edge.state === 'CONGESTED') offset = (i / particleCount) + (time * 0.2);
                        const t = offset % 1;

                        const px = p1.x + (p2.x - p1.x) * t;
                        const py = p1.y + (p2.y - p1.y) * t;

                        ctx.beginPath();
                        ctx.fillStyle = source.type === NODE_TYPES.SINK ? COLORS.NODE_SINK : COLORS.PARTICLE;
                        if (edge.state === 'CONGESTED') ctx.fillStyle = '#ffae00';

                        ctx.shadowBlur = 10;
                        ctx.shadowColor = ctx.fillStyle;
                        ctx.arc(px, py, 2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }
            });

            // --- Ghost Edge (Dragging Connection) ---
            if (isDragging.current && activeTool === 'CONNECT' && dragNode.current && tempEdgeTarget.current) {
                const start = worldToScreen(dragNode.current.x, dragNode.current.y);
                const end = tempEdgeTarget.current; // Already screen coords or world? Let's consist on update

                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.strokeStyle = '#00f3ff';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw target circle
                ctx.beginPath();
                ctx.fillStyle = '#00f3ff';
                ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // --- Draw Nodes ---
            nodes.forEach(node => {
                const { x, y } = worldToScreen(node.x, node.y);
                let radius = node.type === NODE_TYPES.HUB ? 12 : 8;
                let color = COLORS.NODE_DEFAULT;

                if (node.type === NODE_TYPES.SOURCE) {
                    color = COLORS.NODE_SOURCE;
                    radius = 10;
                } else if (node.type === NODE_TYPES.SINK) {
                    color = COLORS.NODE_SINK;
                    radius = 14;
                } else if (node.type === NODE_TYPES.HUB) {
                    color = COLORS.NODE_HUB;
                } else if (node.type === NODE_TYPES.AMBULANCE) {
                    color = COLORS.NODE_AMBULANCE;
                    radius = 10;
                } else if (node.type === NODE_TYPES.DOCTOR) {
                    color = COLORS.NODE_DOCTOR;
                } else if (node.type === NODE_TYPES.VEHICLE) {
                    color = COLORS.NODE_VEHICLE;
                } else if (node.type === NODE_TYPES.SHELTER) {
                    color = COLORS.NODE_SHELTER;
                    radius = 12;
                }

                // Status Override
                if (node.status === 'disabled' || node.status === 'collapsed') {
                    color = '#444';
                } else if (node.status === 'flooded') {
                    color = '#00aaff';
                }

                // Selected State
                if (node.id === selectedNodeId) {
                    ctx.shadowBlur = 25;
                    ctx.shadowColor = '#00f3ff';
                    ctx.strokeStyle = '#00f3ff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Hover State
                if (node.id === hoverNode?.id) {
                    radius *= 1.3;
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = color;
                }

                // Node Body
                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();

                // Label
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '10px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(node.label.toUpperCase(), x, y + radius + 15);

                // Disabled indicator
                if (node.status === 'disabled' || node.status === 'collapsed') {
                    ctx.beginPath();
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 2;
                    ctx.moveTo(x - radius, y - radius);
                    ctx.lineTo(x + radius, y + radius);
                    ctx.moveTo(x + radius, y - radius);
                    ctx.lineTo(x - radius, y + radius);
                    ctx.stroke();
                }

                // Flooded indicator
                if (node.status === 'flooded') {
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(0, 170, 255, 0.4)';
                    ctx.arc(x, y, radius + 10, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Capacity Bar if relevant
                if (node.capacity && node.load > 0) {
                    const pct = Math.min(1, node.load / node.capacity);
                    const barW = 40;
                    const barH = 4;
                    ctx.fillStyle = '#333';
                    ctx.fillRect(x - barW / 2, y - radius - 10, barW, barH);
                    ctx.fillStyle = pct > 0.9 ? '#ff003c' : (pct > 0.7 ? '#ffbd00' : '#00ff9d');
                    ctx.fillRect(x - barW / 2, y - radius - 10, barW * pct, barH);
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [dimensions, engine, hoverNode, showTopology, activeTool, selectedNodeId]); // Dependencies

    // --- Interaction Handlers ---

    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const { x: wx, y: wy } = screenToWorld(sx, sy);

        // Hit Test
        let clickedNode = null;
        for (const node of engine.nodes.values()) {
            const pos = worldToScreen(node.x, node.y);
            const dist = Math.sqrt((sx - pos.x) ** 2 + (sy - pos.y) ** 2);
            if (dist < 20) {
                clickedNode = node;
                break;
            }
        }

        if (activeTool === 'DELETE') {
            if (clickedNode) {
                engine.removeNode(clickedNode.id);
                onNodeSelect(null);
                setHoverNode(null);
            }
            return;
        }

        if (clickedNode) {
            // Clicked a Node
            onNodeSelect(clickedNode.id);

            if (activeTool === 'CURSOR') {
                isDragging.current = true;
                dragNode.current = clickedNode;
            } else if (activeTool === 'CONNECT') {
                isDragging.current = true;
                dragNode.current = clickedNode;
                tempEdgeTarget.current = { x: sx, y: sy };
            }
        } else {
            // Clicked Empty Space
            if (Object.values(NODE_TYPES).includes(activeTool)) {
                // Create Node
                engine.addNode({
                    type: activeTool,
                    x: wx,
                    y: wy,
                    label: `${activeTool}_${Math.floor(Math.random() * 100)}`
                });
            } else {
                // Deselect
                onNodeSelect(null);
            }
        }
    };

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        // Hover Logic
        let found = null;
        // Optimization: Don't hit test all nodes if dragging (except for Connect target)
        for (const node of engine.nodes.values()) {
            const pos = worldToScreen(node.x, node.y);
            const dist = Math.sqrt((sx - pos.x) ** 2 + (sy - pos.y) ** 2);
            if (dist < 20) {
                found = node;
                break;
            }
        }
        setHoverNode(found);

        // Dragging Logic
        if (isDragging.current && dragNode.current) {
            if (activeTool === 'CURSOR') {
                // Move Node
                const { x: wx, y: wy } = screenToWorld(sx, sy);
                dragNode.current.x = wx;
                dragNode.current.y = wy;
                // Note: Engine doesn't auto-notify on direct mutation unless we call notify. 
                // For smooth drag, we might not want to notify EVERY frame effectively rerendering everything.
                // But visualizer reads from engine.nodes directly so it's fine.
                // However, edge drawing relies on node.x/y. 
            } else if (activeTool === 'CONNECT') {
                // Update Ghost Line
                tempEdgeTarget.current = { x: sx, y: sy };
            }
        }
    };

    const handleMouseUp = (e) => {
        if (isDragging.current) {
            if (activeTool === 'CONNECT' && dragNode.current && hoverNode) {
                // Complete Connection
                if (dragNode.current.id !== hoverNode.id) {
                    engine.addEdge(dragNode.current.id, hoverNode.id, { maxFlow: 50 });
                }
            } else if (activeTool === 'CURSOR') {
                // Finish Move - maybe notify engine now
                engine.notify();
            }
        }

        isDragging.current = false;
        dragNode.current = null;
        tempEdgeTarget.current = null;
    };

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    cursor: activeTool === 'CURSOR' ? (hoverNode ? 'grab' : 'default') : 'crosshair'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />

            {/* --- HUD: Legend --- */}
            <div style={{
                position: 'absolute',
                bottom: '2rem',
                right: '2rem',
                background: 'rgba(5, 5, 8, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '1rem',
                borderRadius: '8px',
                pointerEvents: 'none',
                userSelect: 'none'
            }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#888', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Map Key</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {LEGEND_ITEMS.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#ccc' }}>
                            {item.type === 'line' ? (
                                <div style={{
                                    width: 12, height: 2,
                                    background: item.color,
                                    border: item.style === 'dashed' ? '1px dashed red' : 'none'
                                }}></div>
                            ) : (
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, boxShadow: `0 0 5px ${item.color}` }}></div>
                            )}
                            {item.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- HUD: Hover Info --- */}
            {hoverNode && !isDragging.current && (
                <div style={{
                    position: 'absolute',
                    top: worldToScreen(hoverNode.x, hoverNode.y).y + 25,
                    left: worldToScreen(hoverNode.x, hoverNode.y).x,
                    transform: 'translate(-50%, 0)',
                    background: 'rgba(5, 5, 8, 0.9)',
                    border: '1px solid var(--accent-primary)',
                    padding: '0.6rem 1rem',
                    borderRadius: '6px',
                    color: '#fff',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    zIndex: 100,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    minWidth: '150px'
                }}>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>{hoverNode.label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#ccc', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Load:</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(hoverNode.load)} / {hoverNode.capacity || '∞'}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
