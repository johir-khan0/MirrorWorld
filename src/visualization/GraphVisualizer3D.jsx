import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, Text, Trail, PivotControls, ContactShadows, GizmoHelper, GizmoViewport, Edges } from '@react-three/drei';
import { useSimulation } from '../simulation/SimulationContext.jsx';
import { NODE_TYPES, EDGE_STATE } from '../simulation/engine.js';
import * as THREE from 'three';
import { ChevronDown, ChevronUp, Layers, Box, Disc } from 'lucide-react';

// --- 3D Geometric Structures with Integrated Materials ---
function NodeGeometry({ type, color, hovered, selected }) {
    const material = (
        <meshPhysicalMaterial
            color={color}
            metalness={0.4}
            roughness={0.2}
            clearcoat={1}
            clearcoatRoughness={0.1}
            emissive={selected ? color : '#000000'}
            emissiveIntensity={selected ? 0.5 : 0}
        />
    );

    // Wireframe overlay for CAD look
    const wireframe = (
        <Edges
            threshold={15} // Display edges only when angle > 15 degrees
            color={selected ? '#ffffff' : (hovered ? '#666666' : '#444444')}
            scale={1.001} // Avoid z-fighting
        />
    );

    switch (type) {
        case NODE_TYPES.SOURCE:
            return (
                <group>
                    <mesh position={[0, 0, 0]}>
                        <coneGeometry args={[0.5, 1, 4]} />
                        {material}
                    </mesh>
                    <mesh position={[0, -0.4, 0]} rotation={[Math.PI, 0, 0]}>
                        <coneGeometry args={[0.5, 0.4, 4]} />
                        {material}
                        {wireframe}
                    </mesh>
                    {/* Add wireframe to main mesh too */}
                    <mesh position={[0, 0, 0]}>
                        <coneGeometry args={[0.5, 1, 4]} />
                        <meshBasicMaterial color={color} wireframe transparent opacity={0.1} />
                    </mesh>
                </group>
            );
        case NODE_TYPES.SINK:
            return (
                <group>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.5, 0.1, 16, 32]} />
                        {material}
                    </mesh>
                    <mesh>
                        <sphereGeometry args={[0.2, 16, 16]} />
                        {material}
                    </mesh>
                </group>
            );
        case NODE_TYPES.HOSPITAL:
            return (
                <group>
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[0.8, 1, 0.8]} />
                        {material}
                    </mesh>
                    <mesh position={[0, 0, 0.42]}>
                        <boxGeometry args={[0.5, 0.12, 0.05]} />
                        {material}
                    </mesh>
                    <mesh position={[0, 0, 0.42]}>
                        <boxGeometry args={[0.12, 0.5, 0.05]} />
                        {material}
                    </mesh>
                    <mesh position={[0, 0.5, 0]}>
                        <cylinderGeometry args={[0.3, 0.35, 0.1, 8]} />
                        {material}
                    </mesh>
                </group>
            );
        case NODE_TYPES.WAREHOUSE:
            return (
                <group>
                    <mesh>
                        <boxGeometry args={[1.2, 0.6, 1.2]} />
                        {material}
                    </mesh>
                    <mesh position={[0.4, 0, 0.61]}>
                        <boxGeometry args={[0.3, 0.4, 0.02]} />
                        {material}
                    </mesh>
                    <mesh position={[-0.4, 0, 0.61]}>
                        <boxGeometry args={[0.3, 0.4, 0.02]} />
                        {material}
                    </mesh>
                    <mesh position={[0, 0.35, 0]}>
                        <boxGeometry args={[0.4, 0.2, 0.4]} />
                        {material}
                    </mesh>
                </group>
            );
        case NODE_TYPES.BRIDGE:
            return (
                <group>
                    <mesh position={[-0.4, -0.2, 0]}>
                        <boxGeometry args={[0.2, 1.4, 0.8]} />
                        {material}
                    </mesh>
                    <mesh position={[0.4, -0.2, 0]}>
                        <boxGeometry args={[0.2, 1.4, 0.8]} />
                        {material}
                    </mesh>
                    <mesh position={[0, 0.1, 0]}>
                        <boxGeometry args={[1, 0.1, 0.8]} />
                        {material}
                    </mesh>
                    <mesh position={[0, 0.6, 0]}>
                        <torusGeometry args={[0.4, 0.02, 8, 20, Math.PI]} rotation={[0, Math.PI / 2, 0]} />
                        {material}
                    </mesh>
                </group>
            );
        case NODE_TYPES.HUB:
            return (
                <group>
                    <mesh>
                        <octahedronGeometry args={[0.6]} />
                        {material}
                    </mesh>
                    <mesh rotation={[0, Math.PI / 4, 0]}>
                        <octahedronGeometry args={[0.4]} />
                        {material}
                    </mesh>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.7, 0.02, 8, 32]} />
                        {material}
                    </mesh>
                </group>
            );
        case NODE_TYPES.AMBULANCE:
            return (
                <group>
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[1.2, 0.6, 0.6]} />
                        {material}
                    </mesh>
                    <mesh position={[0, 0.4, 0]}>
                        <boxGeometry args={[0.3, 0.2, 0.3]} />
                        <meshStandardMaterial color="#ff0000" emissive="#ff0000" />
                    </mesh>
                </group>
            );
        case NODE_TYPES.DOCTOR:
            return (
                <group>
                    <mesh position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.2, 0.2, 0.8, 8]} />
                        {material}
                    </mesh>
                    <mesh position={[0, 0.5, 0]}>
                        <sphereGeometry args={[0.2, 8, 8]} />
                        {material}
                    </mesh>
                </group>
            );
        case NODE_TYPES.SHELTER:
            return (
                <group>
                    <mesh position={[0, 0, 0]}>
                        <coneGeometry args={[0.8, 1, 4]} />
                        {material}
                    </mesh>
                </group>
            );
        case NODE_TYPES.VEHICLE:
            return (
                <group>
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[0.8, 0.4, 0.4]} />
                        {material}
                    </mesh>
                </group>
            );
        case NODE_TYPES.ZONE:
            return (
                <group>
                    <mesh>
                        <cylinderGeometry args={[0.7, 0.8, 0.4, 6]} />
                        {material}
                    </mesh>
                </group>
            );
        default:
            return (
                <mesh>
                    <boxGeometry args={[0.8, 0.8, 0.8]} />
                    {material}
                </mesh>
            );
    }
}

// --- Ultra-High Contrast OLED Color Palette ---
const NODE_COLORS = {
    [NODE_TYPES.HOSPITAL]: '#00FFAD',
    [NODE_TYPES.WAREHOUSE]: '#FFD700',
    [NODE_TYPES.SOURCE]: '#0099FF',
    [NODE_TYPES.SINK]: '#FF3131',
    [NODE_TYPES.HUB]: '#BC13FE',
    [NODE_TYPES.BRIDGE]: '#A9A9A9',
    [NODE_TYPES.ZONE]: '#FF8C00',
    [NODE_TYPES.AMBULANCE]: '#FF4B4B',
    [NODE_TYPES.DOCTOR]: '#44FF44',
    [NODE_TYPES.VEHICLE]: '#FFEB3B',
    [NODE_TYPES.SHELTER]: '#03A9F4',
    'default': '#ffffff'
};

// --- New Visual Enhancement Components ---

function InteractionRipple({ position, color = '#00f3ff' }) {
    const meshRef = useRef();
    const [scale, setScale] = useState(0.1);
    const [opacity, setOpacity] = useState(1);

    useFrame((_, delta) => {
        if (meshRef.current) {
            setScale(s => {
                const next = s + delta * 8;
                if (next > 4) return s;
                return next;
            });
            setOpacity(o => {
                const next = o - delta * 1.5;
                if (next < 0) return 0;
                return next;
            });
        }
    });

    if (opacity <= 0) return null;

    return (
        <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} ref={meshRef} scale={scale}>
            <ringGeometry args={[0.9, 1, 32]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
    );
}

function PlacementHologram({ type, position }) {
    const meshRef = useRef();
    const color = NODE_COLORS[type] || '#ffffff';

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.02;
            const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
            meshRef.current.scale.set(1.1, 1.1, 1.1);
            meshRef.current.children.forEach(child => {
                if (child.material) {
                    child.material.opacity = pulse;
                }
            });
        }
    });

    if (!position) return null;

    return (
        <group position={position} ref={meshRef}>
            <NodeGeometry type={type} color={color} hovered={false} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
                <ringGeometry args={[0.5, 0.6, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} />
            </mesh>
            <pointLight distance={3} intensity={1} color={color} />
        </group>
    );
}

function ScannerRing({ color }) {
    const meshRef = useRef();
    useFrame((state) => {
        if (meshRef.current) {
            const t = state.clock.elapsedTime * 2;
            meshRef.current.position.y = 0.5 + Math.sin(t) * 1.5;
            meshRef.current.scale.setScalar(1 + Math.cos(t * 0.5) * 0.2);
            meshRef.current.material.opacity = 0.5 + Math.cos(t) * 0.3;
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.2, 1.3, 48]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
    );
}

// 3D Node Component
function Node3D({ node, isSelected, onSelect, onMove }) {
    const groupRef = useRef();
    const [hovered, setHovered] = useState(false);

    // --- Dynamic Real-Time Color Calculation ---
    const color = useMemo(() => {
        if (node.status === 'disabled' || node.status === 'collapsed') {
            return '#444444';
        }
        if (node.status === 'flooded') {
            return '#00aaff';
        }

        const baseColorStr = NODE_COLORS[node.type] || NODE_COLORS['default'];
        const loadRatio = node.load / node.capacity;

        const baseColor = new THREE.Color(baseColorStr);
        const warningColor = new THREE.Color('#FF8800');
        const criticalColor = new THREE.Color('#FF0055');

        if (loadRatio > 0.8) {
            const factor = (loadRatio - 0.8) / 0.2;
            return baseColor.lerp(criticalColor, factor).getStyle();
        } else if (loadRatio > 0.4) {
            const factor = (loadRatio - 0.4) / 0.4;
            return baseColor.lerp(warningColor, factor).getStyle();
        }

        return baseColorStr;
    }, [node.load, node.capacity, node.type, node.status]);

    const heightScale = useMemo(() => {
        return 0.5 + (node.load / node.capacity) * 2;
    }, [node.load, node.capacity]);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.01;

            if (hovered) {
                const s = 1.2 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
                groupRef.current.scale.set(s, s, s);
            } else {
                groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            }

            if (node.status === 'warning' || node.status === 'critical') {
                const pulse = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.05;
                groupRef.current.scale.multiplyScalar(pulse);
            }
        }
    });

    const position = useMemo(() => {
        const x = (node.x - 500) / 100;
        const zIndex = (node.y - 500) / 100;
        const elevation = (node.z || 0) / 10;
        const y = (heightScale / 2) + elevation;
        return [x, y, zIndex];
    }, [node.x, node.y, node.z, heightScale]);

    if (position.some(p => isNaN(p))) return null;

    const content = (
        <group position={position}>
            <group
                ref={groupRef}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(node.id);
                }}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <NodeGeometry type={node.type} color={color} hovered={hovered} selected={isSelected} />
            </group>

            <Text
                position={[0, 2.2, 0]}
                fontSize={0.3}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.04}
                outlineColor="#000000"
            >
                {node.label}
            </Text>

            <group position={[0, 1.7, 0]}>
                <mesh position={[0, 0, -0.05]}>
                    <planeGeometry args={[1.5, 0.4]} />
                    <meshBasicMaterial color="#000000" transparent opacity={0.6} />
                </mesh>
                <Text
                    fontSize={0.18}
                    color={node.status === 'critical' ? '#ff3366' : '#00f3ff'}
                    anchorX="center"
                    anchorY="middle"
                >
                    {`${Math.round((node.load / node.capacity) * 100)}% LOAD`}
                </Text>
            </group>

            {node.status === 'flooded' && (
                <mesh position={[0, 0.5, 0]}>
                    <sphereGeometry args={[1.5, 32, 32]} />
                    <meshStandardMaterial color="#00aaff" transparent opacity={0.3} />
                </mesh>
            )}

            {node.status === 'disabled' && (
                <group rotation={[0, 0, Math.PI / 4]}>
                    <mesh position={[0, 0, 0.8]}>
                        <boxGeometry args={[2.5, 0.1, 0.1]} />
                        <meshBasicMaterial color="red" />
                    </mesh>
                    <mesh position={[0, 0, 0.8]} rotation={[0, 0, Math.PI / 2]}>
                        <boxGeometry args={[2.5, 0.1, 0.1]} />
                        <meshBasicMaterial color="red" />
                    </mesh>
                </group>
            )}

            {isSelected && <ScannerRing color={color} />}

            {(node.status === 'critical' || node.status === 'warning') && (
                <pointLight
                    color={node.status === 'critical' ? '#ff3366' : '#ffaa00'}
                    intensity={1.5}
                    distance={4}
                />
            )}
        </group>
    );

    if (isSelected) {
        return (
            <PivotControls
                depthTest={false}
                anchor={[0, 0, 0]}
                scale={1}
                activeAxes={[true, false, true]}
                onDrag={(l) => {
                    const position = new THREE.Vector3();
                    const rotation = new THREE.Quaternion();
                    const scale = new THREE.Vector3();
                    l.decompose(position, rotation, scale);

                    const newX = (position.x * 100) + 500;
                    const newY = (position.z * 100) + 500;
                    onMove(node.id, newX, newY);
                }}
            >
                {content}
            </PivotControls>
        );
    }

    return content;
}

// 3D Edge Component
function Edge3D({ edge, nodes, ghostTargetPos }) {
    const source = nodes.get(edge.source);
    const target = edge.target === 'GHOST' ? null : nodes.get(edge.target);

    const points = useMemo(() => {
        if (!source || (!target && !ghostTargetPos)) return [];
        const sx = (source.x - 500) / 100;
        const sz = (source.y - 500) / 100;
        const se = (source.z || 0) / 10;
        const sy = (0.5 + (source.load / source.capacity) * 2) / 2 + se;

        let tx, ty, tz;
        if (edge.target === 'GHOST' && ghostTargetPos) {
            [tx, ty, tz] = ghostTargetPos;
        } else if (target) {
            tx = (target.x - 500) / 100;
            tz = (target.y - 500) / 100;
            const te = (target.z || 0) / 10;
            ty = (0.5 + (target.load / target.capacity) * 2) / 2 + te;
        } else {
            return [];
        }

        const start = new THREE.Vector3(sx, sy, sz);
        const end = new THREE.Vector3(tx, ty, tz);

        const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
        mid.y += (1.5 + Math.abs(sy - ty) * 0.5);

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        return curve.getPoints(50);
    }, [source, target, ghostTargetPos, edge.target]);

    const color = useMemo(() => {
        if (edge.state === EDGE_STATE.BLOCKED) return '#ff3366';
        if (edge.state === EDGE_STATE.CONGESTED) return '#ffaa00';
        if (edge.isGhost) return '#00f3ff';
        return '#00f3ff';
    }, [edge.state, edge.isGhost]);

    const opacity = useMemo(() => {
        if (edge.isGhost) return 0.2;
        return 0.5;
    }, [edge.isGhost]);

    const lineRef = useRef();
    useFrame((state) => {
        if (edge.isGhost && lineRef.current) {
            const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 6) * 0.2;
            lineRef.current.material.opacity = pulse;
            lineRef.current.material.linewidth = 2 + Math.sin(state.clock.elapsedTime * 6) * 1;
        }
    });

    if (!source || (!target && !ghostTargetPos)) return null;

    return (
        <line ref={lineRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={points.length}
                    array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
                    itemSize={3}
                />
            </bufferGeometry>
            <lineBasicMaterial color={color} transparent opacity={opacity} linewidth={2} />
        </line>
    );
}

// Flow Particle
function FlowParticle({ edge, nodes, index }) {
    const particleRef = useRef();
    const [progress, setProgress] = useState(index * 0.33);

    useFrame(() => {
        if (!edge || !nodes.has(edge.source) || !nodes.has(edge.target)) return;

        const source = nodes.get(edge.source);
        const target = nodes.get(edge.target);

        if (edge.state === EDGE_STATE.BLOCKED || edge.flow === 0) return;

        setProgress(prev => {
            const speed = (0.01 + (edge.flow / (edge.maxFlow || 1)) * 0.05);
            const newProgress = prev + speed;
            return newProgress > 1 ? 0 : newProgress;
        });

        if (particleRef.current && source && target) {
            const sx = (source.x - 500) / 100;
            const sz = (source.y - 500) / 100;
            const se = (source.z || 0) / 10;
            const sy = ((0.5 + (source.load / (source.capacity || 1)) * 2) / 2) + se;

            const tx = (target.x - 500) / 100;
            const tz = (target.y - 500) / 100;
            const te = (target.z || 0) / 10;
            const ty = ((0.5 + (target.load / (target.capacity || 1)) * 2) / 2) + te;

            const start = new THREE.Vector3(sx, sy, sz);
            const end = new THREE.Vector3(tx, ty, tz);

            const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
            mid.y += (1.5 + Math.abs(se - te) * 0.5);

            const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
            const point = curve.getPoint(progress);

            if (point && !isNaN(point.x)) {
                particleRef.current.position.copy(point);
            }
        }
    });

    if (!nodes.has(edge.source) || !nodes.has(edge.target) || edge.state === EDGE_STATE.BLOCKED) return null;

    return (
        <Trail width={0.4} length={4} color="#00f3ff" attenuation={(t) => t * t}>
            <mesh ref={particleRef}>
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={2} />
            </mesh>
        </Trail>
    );
}

// Scene Helper
function Scene({ showTopology, activeTool, selectedNodeId, onNodeSelect }) {
    const engine = useSimulation();
    const [_, setVersion] = useState(0);
    const [connStartNodeId, setConnStartNodeId] = useState(null);
    const [mousePoint, setMousePoint] = useState(null);
    const [ripples, setRipples] = useState([]);
    const spotLightRef = useRef();

    useEffect(() => {
        let lastNodeCount = engine.nodes.size;
        let lastEdgeCount = engine.edges.size;

        const unsubscribe = engine.subscribe(() => {
            if (engine.nodes.size !== lastNodeCount || engine.edges.size !== lastEdgeCount) {
                lastNodeCount = engine.nodes.size;
                lastEdgeCount = engine.edges.size;
                setVersion(v => v + 1);
            }
        });
        return unsubscribe;
    }, [engine]);

    const handleNodeMove = (id, x, y) => {
        const node = engine.getNodeById(id);
        if (node) {
            node.x = Math.max(0, Math.min(1000, x));
            node.y = Math.max(0, Math.min(1000, y));
            engine.notify();
        }
    };

    const handlePlaneClick = (e) => {
        if (Object.values(NODE_TYPES).includes(activeTool)) {
            const point = e.point;
            const wx = (point.x * 100) + 500;
            const wy = (point.z * 100) + 500;

            engine.addNode({
                type: activeTool,
                x: wx,
                y: wy,
                label: `${activeTool}_${Math.floor(Math.random() * 100)}`
            });

            // Trigger ripple
            const rippleId = Date.now();
            setRipples(prev => [...prev, { id: rippleId, pos: [point.x, 0.05, point.z] }]);
            setTimeout(() => {
                setRipples(prev => prev.filter(r => r.id !== rippleId));
            }, 2000);
        } else {
            onNodeSelect(null);
            setConnStartNodeId(null);
        }
    };

    const handleNodeClick = (id) => {
        if (activeTool === 'DELETE') {
            engine.removeNode(id);
            onNodeSelect(null);
            return;
        }

        if (activeTool === 'CONNECT') {
            if (!connStartNodeId) {
                setConnStartNodeId(id);
            } else if (connStartNodeId !== id) {
                engine.addEdge(connStartNodeId, id, { maxFlow: 50 });
                setConnStartNodeId(null);
            }
            return;
        }

        onNodeSelect(id);
    };

    const handlePointerMove = (e) => {
        if (activeTool === 'CONNECT' && connStartNodeId) {
            setMousePoint(e.point);
        }
    };

    const nodesArr = Array.from(engine.nodes.values());
    const edgesArr = Array.from(engine.edges.values());

    return (
        <>
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 20, 10]} intensity={1.5} />
            <pointLight position={[-10, 10, -10]} color="#00f3ff" intensity={0.8} />
            <pointLight position={[10, 5, 10]} color="#ff00ff" intensity={0.8} />

            <Grid
                args={[20, 20]}
                cellSize={1} // Minor grid lines
                cellThickness={0.6}
                cellColor="#333333"
                sectionSize={5} // Major grid lines
                sectionThickness={1.2}
                sectionColor="#666666"
                fadeDistance={35}
                infiniteGrid
            />

            {/* Floor Shadows for grounding */}
            <ContactShadows
                opacity={0.4}
                scale={40}
                blur={2}
                far={4}
                resolution={256}
                color="#000000"
            />

            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.01, 0]}
                onClick={handlePlaneClick}
                onPointerMove={handlePointerMove}
            >
                <planeGeometry args={[100, 100]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Tool Indicators & Previews */}
            {Object.values(NODE_TYPES).includes(activeTool) && mousePoint && (
                <PlacementHologram type={activeTool} position={[mousePoint.x, 0.5, mousePoint.z]} />
            )}

            {ripples.map(r => (
                <InteractionRipple key={r.id} position={r.pos} />
            ))}

            {activeTool && mousePoint && (
                <>
                    <primitive object={new THREE.Object3D()} position={[mousePoint.x, 0, mousePoint.z]} ref={(node) => {
                        if (node && spotLightRef.current) spotLightRef.current.target = node;
                    }} />
                    <spotLight
                        ref={spotLightRef}
                        position={[mousePoint.x, 10, mousePoint.z]}
                        angle={0.2}
                        penumbra={1}
                        intensity={20}
                        color="#00f3ff"
                    />
                </>
            )}

            {nodesArr.map(node => (
                <Node3D
                    key={node.id}
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    onSelect={() => handleNodeClick(node.id)}
                    onMove={handleNodeMove}
                />
            ))}

            {showTopology && edgesArr.map(edge => (
                <Edge3D key={edge.id} edge={edge} nodes={engine.nodes} />
            ))}

            {/* Ghost Edge for Connection Tool */}
            {activeTool === 'CONNECT' && connStartNodeId && mousePoint && (
                <Edge3D
                    nodes={engine.nodes}
                    edge={{
                        source: connStartNodeId,
                        target: 'GHOST',
                        state: EDGE_STATE.NORMAL,
                        isGhost: true
                    }}
                    // Override target node for ghost edge
                    ghostTargetPos={[(mousePoint.x), (mousePoint.y), (mousePoint.z)]}
                />
            )}

            {edgesArr.map(edge => (
                Array.from({ length: 2 }).map((_, i) => (
                    <FlowParticle key={`${edge.id}-p-${i}`} edge={edge} nodes={engine.nodes} index={i} />
                ))
            ))}
        </>
    );
}

// Main Visualizer
export default function GraphVisualizer3D({
    showTopology = true,
    activeTool,
    selectedNodeId,
    onNodeSelect
}) {
    const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Canvas
                shadows
                gl={{ antialias: true }}
                style={{ background: '#050508' }}
            >
                <PerspectiveCamera makeDefault position={[20, 30, 20]} fov={50} />
                <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} />
                <Environment preset="city" />

                <Scene
                    showTopology={showTopology}
                    activeTool={activeTool}
                    selectedNodeId={selectedNodeId}
                    onNodeSelect={onNodeSelect}
                />
                <GizmoHelper
                    alignment="bottom-right"
                    margin={[80, 80]}
                >
                    <GizmoViewport axisColors={['#ff3653', '#0adb50', '#2c8fdf']} labelColor="black" />
                </GizmoHelper>
            </Canvas>

            {/* Legend Overlay */}
            <div style={{
                position: 'absolute',
                top: '6rem',
                right: '1.5rem',
                padding: isLegendCollapsed ? '0.75rem 1rem' : '1.5rem',
                background: 'rgba(5, 5, 8, 0.85)',
                backdropFilter: 'blur(20px)',
                borderRadius: '12px',
                border: '1px solid rgba(0, 243, 255, 0.2)',
                color: 'white',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                pointerEvents: 'auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                width: isLegendCollapsed ? 'auto' : '220px',
                overflow: 'hidden',
                zIndex: 20
            }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: isLegendCollapsed ? 0 : '1rem',
                        cursor: 'pointer'
                    }}
                    onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Layers size={14} color="#00f3ff" />
                        <span style={{ fontWeight: 600, letterSpacing: '0.05em', color: '#00f3ff' }}>
                            TOPOLOGY
                        </span>
                    </div>
                    {isLegendCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </div>

                {!isLegendCollapsed && (
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {Object.entries(NODE_TYPES).map(([key, value]) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: NODE_COLORS[value] || '#fff',
                                    boxShadow: `0 0 8px ${NODE_COLORS[value] || '#fff'}`
                                }} />
                                <span style={{ color: '#aaa' }}>{key}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
