import { v4 as uuidv4 } from 'uuid';

export const NODE_TYPES = {
    ZONE: 'ZONE',
    HUB: 'HUB',
    SOURCE: 'SOURCE',
    SINK: 'SINK',
    HOSPITAL: 'HOSPITAL',
    WAREHOUSE: 'WAREHOUSE',
    BRIDGE: 'BRIDGE',
    AMBULANCE: 'AMBULANCE',
    DOCTOR: 'DOCTOR',
    VEHICLE: 'VEHICLE',
    SHELTER: 'SHELTER'
};

export const EDGE_STATE = {
    NORMAL: 'NORMAL',
    CONGESTED: 'CONGESTED',
    BLOCKED: 'BLOCKED'
};

export class SimulationEngine {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this.listeners = new Set();
        this.time = 0;
        this.running = false;
        this.intervalId = null;
        this.metrics = {
            throughput: 0,
            riskLevel: 0,
            activeEntities: 0,
            avgEvacuationTime: 0,
            totalEvacuated: 0,
            congestionPoints: 0,
            systemStatus: 'NOMINAL'
        };
        this.flowHistory = [];
        this.defenseActive = false;
        this.autoDefenseTimer = null;
    }

    setDefenseMode(active) {
        this.defenseActive = active;
        this.notify();
    }

    // --- Lifecycle Management ---

    start(fps = 10) {
        if (this.running) return;
        this.running = true;
        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000 / fps);
        console.log('Simulation Engine Started');
    }

    stop() {
        this.running = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('Simulation Engine Stopped');
    }

    tick() {
        this.time++;

        // ENTROPY: Randomly increase chaos/load
        if (!this.defenseActive && Math.random() > 0.95) {
            this.injectChaos();
        }

        // DEFENSE: Correction
        if (this.defenseActive) {
            this.applyDefenseProtocol();
        }

        this.processFlows();
        this.updateCongestion();
        this.updateMetrics();
        this.checkThreats(); // New threat detection
        this.recordHistory();
        this.notify();
    }

    injectChaos() {
        // Randomly increase load on a few nodes
        const nodes = Array.from(this.nodes.values());
        if (nodes.length > 0) {
            const victim = nodes[Math.floor(Math.random() * nodes.length)];
            victim.load = Math.min(victim.maxCapacity * 1.5, victim.load + Math.random() * 20);
        }
    }

    applyDefenseProtocol() {
        // Reduce load and clear congestion
        this.nodes.forEach(node => {
            if (node.load > node.capacity * 0.8) {
                node.load *= 0.9; // Decay load
            }
        });
        this.edges.forEach(edge => {
            if (edge.congestionLevel > 0) {
                edge.congestionLevel *= 0.8;
                if (edge.congestionLevel < 0.1) edge.congestionLevel = 0;
            }
        });
    }

    checkThreats() {
        // Auto-Correction Logic
        if (this.metrics.riskLevel > 80 && !this.defenseActive) {
            if (!this.autoDefenseTimer) {
                console.log('CRITICAL THREAT DETECTED. AUTO-DEFENSE ENGAGING IN 3s...');
                this.autoDefenseTimer = setTimeout(() => {
                    console.log('AUTO-DEFENSE ACTIVE');
                    this.setDefenseMode(true);
                    this.autoDefenseTimer = null;
                }, 3000);
            }
        }
    }

    // --- Graph Management ---

    addNode(data) {
        const id = data.id || uuidv4();
        this.nodes.set(id, {
            id,
            x: data.x || 0,
            y: data.y || 0,
            z: data.z || 0, // Add Z coordinate for 3D
            type: data.type || NODE_TYPES.ZONE,
            label: data.label || 'Node',
            load: data.load || 0,
            capacity: data.capacity || 100,
            status: data.status || 'active', // active, disabled, flooded, collapsed
            maxCapacity: data.capacity || 100,
            intakeRate: data.intakeRate || 5, // For hospitals/shelters
            priority: data.priority || 1,
            processedCount: 0,
            ...data
        });
        this.notify();
        return id;
    }

    addEdge(sourceId, targetId, data = {}) {
        const id = uuidv4();
        this.edges.set(id, {
            id,
            source: sourceId,
            target: targetId,
            flow: 0,
            maxFlow: data.maxFlow || 10,
            currentCapacity: data.maxFlow || 10,
            state: EDGE_STATE.NORMAL,
            congestionLevel: 0, // 0-1 scale
            ...data
        });
        this.notify();
        return id;
    }

    removeNode(nodeId) {
        this.nodes.delete(nodeId);
        // Remove all edges connected to this node
        this.edges.forEach((edge, id) => {
            if (edge.source === nodeId || edge.target === nodeId) {
                this.edges.delete(id);
            }
        });
        this.recalculatePathfinding();
        this.notify();
    }

    setNodeStatus(id, status) {
        const node = this.nodes.get(id);
        if (node) {
            node.status = status;
            this.recalculatePathfinding();
            this.notify();
        }
    }

    setEdgeState(id, state) {
        const edge = this.edges.get(id);
        if (edge) {
            edge.state = state;
            this.recalculatePathfinding();
            this.notify();
        }
    }

    // --- Manual Event Triggers ---

    triggerFlood(nodeId) {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.status = 'flooded';
            node.load = node.maxCapacity * 1.5;
            this.notify();
        }
    }

    collapseBridge(edgeId) {
        const edge = this.edges.get(edgeId);
        if (edge) {
            edge.state = EDGE_STATE.BLOCKED;
            this.recalculatePathfinding();
            this.notify();
        }
    }

    updateRoadCapacity(edgeId, newCap) {
        const edge = this.edges.get(edgeId);
        if (edge) {
            edge.maxFlow = newCap;
            this.notify();
        }
    }

    addEmergencyPersonnel(nodeId) {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.maxCapacity = Math.floor(node.maxCapacity * 1.5);
            node.label += " (BOOSTED)";
            this.notify();
        }
    }

    lockNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.status = 'disabled';
            this.recalculatePathfinding();
            this.notify();
        }
    }

    removeEdge(edgeId) {
        this.edges.delete(edgeId);
        this.recalculatePathfinding();
        this.notify();
    }

    recalculatePathfinding() {
        // gradient field pathfinding (BFS from SINKS)
        this.nodes.forEach(node => node.distanceToExit = Infinity);

        const queue = [];
        this.nodes.forEach(node => {
            if (node.type === NODE_TYPES.SINK || node.type === NODE_TYPES.HOSPITAL) {
                node.distanceToExit = 0;
                queue.push(node);
            }
        });

        // Track visited to prevent infinite loops in cyclic graphs
        const visited = new Set();
        queue.forEach(n => visited.add(n.id));

        while (queue.length > 0) {
            const current = queue.shift();

            // Find neighbors pointing TO current (Reverse graph search)
            this.edges.forEach(edge => {
                // IMPORTANT: Skip BLOCKED edges for pathfinding (Dynamic Rerouting)
                if (edge.state === EDGE_STATE.BLOCKED) return;

                if (bordering(edge, current)) {
                    const neighborId = edge.target === current.id ? edge.source : edge.target;

                    // In a directed graph for flow, if edge is A->B, and we are at B (distance 0),
                    // A is upstream. So we want to update A based on B. 
                    // bordering() returns true if edge touches current. 
                    // We need to ensure we are traversing AGAINST the flow direction to propagate distance.
                    // If edge is Source->Target, and current is Target, then Neighbor is Source.
                    // This is correct for setting distance of Source based on Target.

                    if (edge.target === current.id) { // Ensure we only propagate upstream
                        const neighbor = this.nodes.get(neighborId);
                        if (neighbor && !visited.has(neighbor.id) && neighbor.status !== 'disabled') {
                            // Cost heuristic: 1 + congestion penalty
                            const weight = 1 + (edge.congestionLevel * 2);

                            // Update if we found a shorter path (dijkstra-ish) or unvisited
                            if (neighbor.distanceToExit > current.distanceToExit + weight) {
                                neighbor.distanceToExit = current.distanceToExit + weight;
                                visited.add(neighbor.id); // Mark visited for BFS
                                queue.push(neighbor);
                            }
                        }
                    }
                }
            });
            // Sort queue by distance to ensure we process closest nodes first (Dijkstra-lite)
            queue.sort((a, b) => a.distanceToExit - b.distanceToExit);
        }

        function bordering(edge, node) {
            return edge.target === node.id || edge.source === node.id;
        }
    }

    processFlows() {
        if (this.time % 5 === 0) this.recalculatePathfinding(); // Dynamic updates

        // Step 1: Sort edges by gradient (flow downhill)
        const validFlows = [];

        this.edges.forEach(edge => {
            const source = this.nodes.get(edge.source);
            const target = this.nodes.get(edge.target);

            if (!source || !target || edge.state === EDGE_STATE.BLOCKED) return;
            if (source.status === 'disabled' || target.status === 'disabled') return;

            // Heuristic: Flow strictly towards lower distanceToExit
            const gradientDiff = (source.distanceToExit || Infinity) - (target.distanceToExit || Infinity);

            if (gradientDiff > 0) {
                validFlows.push({ edge, source, target, priority: gradientDiff });
            }
        });

        // Step 2: Execute Flow
        validFlows.sort((a, b) => b.priority - a.priority); // Prioritize steepest descent

        validFlows.forEach(({ edge, source, target }) => {
            let flowAmount = 0;

            // CONGESTION LOGIC: Speed decreases as congestion increases
            let speedFactor = 1.0;
            if (edge.congestionLevel > 0.5) speedFactor = 0.5;
            if (edge.congestionLevel > 0.8) speedFactor = 0.1;

            const capacity = edge.maxFlow * speedFactor;

            // Determine transferable amount
            const availableLoad = source.load;
            const targetSpace = target.maxCapacity - target.load;

            flowAmount = Math.min(availableLoad, capacity, targetSpace);

            // Apply flow
            if (flowAmount > 0) {
                source.load -= flowAmount;
                target.load += flowAmount;
                edge.flow = flowAmount;

                // Track processed count for sinks
                if (target.type === NODE_TYPES.SINK || target.type === NODE_TYPES.HOSPITAL) {
                    target.processedCount += flowAmount;
                    target.load -= flowAmount; // Sinks consume immediately
                }
            } else {
                edge.flow = 0;
            }
        });

        // Step 3: Sources generate new load
        this.nodes.forEach(node => {
            if (node.type === NODE_TYPES.SOURCE) {
                const genRate = node.generationRate || 5; // Increased default generation
                if (node.load < node.maxCapacity) {
                    node.load = Math.min(node.maxCapacity, node.load + genRate);
                }
            }
        });
    }

    updateCongestion() {
        this.edges.forEach(edge => {
            // Congestion increases when flow approaches max capacity
            const utilization = edge.flow / edge.maxFlow;

            // Hysteresis for stability
            if (utilization > 0.9) {
                edge.congestionLevel = Math.min(1, edge.congestionLevel + 0.05);
                edge.state = EDGE_STATE.CONGESTED;
            } else if (utilization > 0.7) {
                edge.congestionLevel = Math.min(0.8, edge.congestionLevel + 0.02);
                if (edge.congestionLevel > 0.5) edge.state = EDGE_STATE.CONGESTED;
            } else {
                edge.congestionLevel = Math.max(0, edge.congestionLevel - 0.05);
                if (edge.congestionLevel < 0.3) {
                    edge.state = EDGE_STATE.NORMAL;
                }
            }
        });

        // Update node status based on load
        this.nodes.forEach(node => {
            const loadRatio = node.load / node.capacity;

            if (loadRatio > 0.9) {
                node.status = 'critical';
            } else if (loadRatio > 0.7) {
                node.status = 'warning';
            } else {
                node.status = 'stable';
            }
        });
    }

    updateMetrics() {
        let totalLoad = 0;
        let criticalNodes = 0;
        let totalEvacuated = 0;
        let congestionPoints = 0;

        this.nodes.forEach(node => {
            totalLoad += node.load;
            if (node.status === 'critical') criticalNodes++;
            if (node.type === NODE_TYPES.SINK || node.type === NODE_TYPES.HOSPITAL) {
                totalEvacuated += node.processedCount || 0;
            }
        });

        this.edges.forEach(edge => {
            if (edge.state === EDGE_STATE.CONGESTED || edge.state === EDGE_STATE.BLOCKED) {
                congestionPoints++;
            }
        });

        const totalFlow = Array.from(this.edges.values()).reduce((sum, e) => sum + e.flow, 0);

        // Calculate System Status
        let riskScore = (criticalNodes / Math.max(1, this.nodes.size)) * 100;
        // Boost risk if congestion is high
        if (congestionPoints > 2) riskScore += 20;

        riskScore = Math.min(100, Math.max(0, riskScore));

        let systemStatus = 'NOMINAL';
        if (riskScore > 80) systemStatus = 'CRITICAL';
        else if (riskScore > 40) systemStatus = 'UNSTABLE';

        this.metrics = {
            throughput: totalFlow,
            riskLevel: Math.floor(riskScore),
            activeEntities: this.nodes.size,
            avgEvacuationTime: this.time / 10, // Convert ticks to seconds
            totalEvacuated: totalEvacuated,
            congestionPoints: congestionPoints,
            totalLoad: totalLoad,
            systemStatus: systemStatus
        };
    }

    recordHistory() {
        if (this.time % 10 === 0) { // Record every second
            this.flowHistory.push({
                time: this.time,
                throughput: this.metrics.throughput,
                congestion: this.metrics.congestionPoints
            });

            // Keep only last 100 records
            if (this.flowHistory.length > 100) {
                this.flowHistory.shift();
            }
        }
    }

    // --- Scenarios ---

    loadScenario(scenarioFunc) {
        this.nodes.clear();
        this.edges.clear();
        this.time = 0;
        this.flowHistory = [];

        if (typeof scenarioFunc === 'function') {
            scenarioFunc(this);
        }
        this.notify();
    }

    // --- Optimization & Analytics ---

    findBottlenecks() {
        // Return edges with high congestion or sustained high load
        return Array.from(this.edges.values()).filter(edge =>
            edge.congestionLevel > 0.6 || edge.state === EDGE_STATE.CONGESTED
        );
    }

    optimizeFlow() {
        // 1. Capture State BEFORE
        const metricsBefore = { ...this.metrics };
        const bottlenecks = this.findBottlenecks();
        const actions = [];
        let optimizedCount = 0;

        // 2. Apply Interventions

        // Action A: Upgrade Capacity on Bottlenecks
        bottlenecks.forEach(edge => {
            const oldCap = edge.maxFlow;
            edge.maxFlow = Math.floor(edge.maxFlow * 1.5); // +50% capacity
            edge.congestionLevel = 0; // Reset congestion
            edge.state = EDGE_STATE.NORMAL;

            const sourceNode = this.nodes.get(edge.source);
            const targetNode = this.nodes.get(edge.target);
            const label = `${sourceNode ? sourceNode.label : 'Unknown'} -> ${targetNode ? targetNode.label : 'Unknown'}`;

            actions.push(`EXPAND_CAPACITY: [${label}] ${oldCap} -> ${edge.maxFlow}`);
            optimizedCount++;
        });

        // Action B: Load Balancing on Critical Nodes
        this.nodes.forEach(node => {
            if (node.load > node.maxCapacity * 0.9) {
                const oldCap = node.maxCapacity;
                node.maxCapacity = Math.floor(node.maxCapacity * 1.25); // +25% buffer
                node.status = 'stable';

                actions.push(`EMERGENCY_BUFFER: [${node.label}] ${oldCap} -> ${node.maxCapacity}`);
                optimizedCount++;
            }
        });

        // Action C: Rerouting Pathfinding
        this.recalculatePathfinding();
        actions.push("PROTOCOL: Global Pathfinding Recalculated");

        // 3. Capture State AFTER (Projected)
        // We simulate a metrics update to show immediate projected impact
        const projectMetrics = () => {
            // Heuristic projection (since real metrics update next tick)
            // Assumption: Removing bottlenecks improves throughput and lowers risk
            const projectedRisk = Math.max(0, metricsBefore.riskLevel - (optimizedCount * 5));
            const projectedThroughput = Math.floor(metricsBefore.throughput * 1.15); // Assume 15% boost

            return {
                riskLevel: projectedRisk,
                throughput: projectedThroughput,
                systemStatus: projectedRisk > 40 ? 'UNSTABLE' : 'NOMINAL'
            };
        };
        const metricsAfter = projectMetrics();

        // Update live metrics immediately so UI reflects "After" state
        this.metrics.riskLevel = metricsAfter.riskLevel;
        this.metrics.systemStatus = metricsAfter.systemStatus;

        this.notify();

        return {
            actions,
            metricsBefore,
            metricsAfter,
            optimizationScore: optimizedCount
        };
    }

    reset() {
        this.nodes.clear();
        this.edges.clear();
        this.time = 0;
        this.flowHistory = [];
        this.metrics = {
            throughput: 0,
            riskLevel: 0,
            activeEntities: 0,
            avgEvacuationTime: 0,
            totalEvacuated: 0,
            congestionPoints: 0,
            totalLoad: 0
        };
        this.notify();
        console.log('Simulation Engine Reset');
    }

    // --- Subscriptions ---

    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this));
    }

    // --- Utility Methods ---

    getNodeById(id) {
        return this.nodes.get(id);
    }

    getEdgeById(id) {
        return this.edges.get(id);
    }

    getNodesByType(type) {
        return Array.from(this.nodes.values()).filter(n => n.type === type);
    }

    getConnectedEdges(nodeId) {
        return Array.from(this.edges.values()).filter(
            e => e.source === nodeId || e.target === nodeId
        );
    }
}
