import { EDGE_STATE, NODE_TYPES } from '../simulation/engine.js';
import { loadCityScenario, loadHospitalScenario, loadSupplyChainScenario, loadDhakaMetroScenario, loadDataCenterScenario, loadFloodDisasterScenario } from '../simulation/scenarios.js';

export const DEMO_SCENARIO = [
    { delay: 1000, text: "Initialize Urban Evacuation Protocol" },
    { delay: 5000, text: "Trigger Seismic Event at North Bridge" },
    { delay: 10000, text: "Optimize Emergency Routing" },
    { delay: 15000, text: "Generate Status Report" }
];

// Helper to parse natural language for entities and quantities
function parseEntities(text) {
    const config = {
        hospitals: 0,
        bridges: 0,
        zones: 0,
        hubs: 0,
        sinks: 0,
        sources: 0,
        warehouses: 0
    };

    // Regex to find patterns like "3 hospitals", "2 bridges", "a zone"
    const patterns = [
        { type: 'hospitals', regex: /(\d+|a|an|one|two|three|four|five)\s+hospital/i },
        { type: 'bridges', regex: /(\d+|a|an|one|two|three|four|five)\s+bridge/i },
        { type: 'zones', regex: /(\d+|a|an|one|two|three|four|five)\s+zone/i },
        { type: 'hubs', regex: /(\d+|a|an|one|two|three|four|five)\s+(hub|junction)/i },
        { type: 'sinks', regex: /(\d+|a|an|one|two|three|four|five)\s+(sink|shelter|exit)/i },
        { type: 'sources', regex: /(\d+|a|an|one|two|three|four|five)\s+(source|village|input)/i },
        { type: 'warehouses', regex: /(\d+|a|an|one|two|three|four|five)\s+warehouse/i }
    ];

    patterns.forEach(p => {
        const match = text.match(p.regex);
        if (match) {
            let count = 1;
            const val = match[1].toLowerCase();
            if (val === 'a' || val === 'an' || val === 'one') count = 1;
            else if (val === 'two') count = 2;
            else if (val === 'three') count = 3;
            else if (val === 'four') count = 4;
            else if (val === 'five') count = 5;
            else count = parseInt(val) || 1;

            config[p.type] = count;
        }
    });

    return config;
}

function generateProceduralScenario(engine, config) {
    engine.nodes.clear();
    engine.edges.clear();

    // Default if nothing specified
    if (Object.values(config).every(v => v === 0)) {
        config.zones = 2;
        config.bridges = 1;
        config.hubs = 1;
        config.sinks = 1;
    }

    const createdNodes = {
        sources: [],
        hubs: [],
        bridges: [],
        sinks: []
    };

    // 1. Create Nodes
    // Layout strategy: Sources at top/left, Sinks at bottom/right

    // Sources
    const sourceCount = config.sources || config.zones || 0;
    for (let i = 0; i < sourceCount; i++) {
        const id = engine.addNode({
            label: `Source Zone ${String.fromCharCode(65 + i)}`,
            x: 100 + (Math.random() * 200),
            y: 100 + (i * 150),
            type: NODE_TYPES.SOURCE,
            load: 500 + Math.floor(Math.random() * 500),
            capacity: 1000
        });
        createdNodes.sources.push(id);
    }

    // Hubs
    const hubCount = config.hubs || config.warehouses || 1;
    for (let i = 0; i < hubCount; i++) {
        const id = engine.addNode({
            label: `Junction ${i + 1}`,
            x: 400 + (Math.random() * 100),
            y: 300 + (i * 200),
            type: NODE_TYPES.HUB,
            capacity: 1500
        });
        createdNodes.hubs.push(id);
    }

    // Bridges
    const bridgeCount = config.bridges || 0;
    for (let i = 0; i < bridgeCount; i++) {
        const id = engine.addNode({
            label: `Bridge ${String.fromCharCode(65 + i)}`,
            x: 550,
            y: 200 + (i * 250),
            z: 20,
            type: NODE_TYPES.BRIDGE,
            capacity: 1000
        });
        createdNodes.bridges.push(id);
    }

    // Sinks / Hospitals
    const sinkCount = config.sinks || config.hospitals || 1;
    for (let i = 0; i < sinkCount; i++) {
        const type = config.hospitals > 0 ? NODE_TYPES.HOSPITAL : NODE_TYPES.SINK;
        const label = config.hospitals > 0 ? `General Hospital ${i + 1}` : `Safe Zone ${i + 1}`;
        const id = engine.addNode({
            label: label,
            x: 800 + (Math.random() * 100),
            y: 200 + (i * 200),
            type: type,
            capacity: 2000
        });
        createdNodes.sinks.push(id);
    }

    // 2. Create Connections (Edges)
    // Heuristic: Source -> Hub -> Bridge -> Sink

    // Connect Sources to Hubs (or Bridges if no Hubs)
    createdNodes.sources.forEach(sourceId => {
        const targetGroup = createdNodes.hubs.length > 0 ? createdNodes.hubs : (createdNodes.bridges.length > 0 ? createdNodes.bridges : createdNodes.sinks);
        if (targetGroup.length > 0) {
            const targetId = targetGroup[Math.floor(Math.random() * targetGroup.length)];
            engine.addEdge(sourceId, targetId, { maxFlow: 100 });
        }
    });

    // Connect Hubs to Bridges (or Sinks if no Bridges)
    createdNodes.hubs.forEach(hubId => {
        const targetGroup = createdNodes.bridges.length > 0 ? createdNodes.bridges : createdNodes.sinks;
        if (targetGroup.length > 0) {
            // Connect to a random target, maybe 2 if possible for redundancy
            const targetId = targetGroup[Math.floor(Math.random() * targetGroup.length)];
            engine.addEdge(hubId, targetId, { maxFlow: 150 });
        }
    });

    // Connect Bridges to Sinks
    createdNodes.bridges.forEach(bridgeId => {
        if (createdNodes.sinks.length > 0) {
            const targetId = createdNodes.sinks[Math.floor(Math.random() * createdNodes.sinks.length)];
            engine.addEdge(bridgeId, targetId, { maxFlow: 120 });
        }
    });

    engine.start();
    return createdNodes;
}

export function processCommand(text, engine) {
    const input = text.toLowerCase();

    // Base Response Object
    let response = {
        text: '',
        action: 'IDLE',
        reasoning: null,
        data: null
    };

    // --- Intent: Dynamic Scenario Generation (NLP) ---
    // Matches: "Create a...", "Simulate...", "Build...", "Generate..." containing entity names
    if ((input.includes('create') || input.includes('simulate') || input.includes('generate') || input.includes('build')) &&
        (input.includes('hospital') || input.includes('bridge') || input.includes('zone') || input.includes('evacuation') || input.includes('city'))) {

        response.reasoning = [
            'Parsing intent entities...',
            'Constructing topology...',
            'Synthesizing graph...',
            'Initializing flow...'
        ];

        // 1. Parse Entities
        const config = parseEntities(input);

        // 2. Generate
        try {
            engine.stop();
            const nodes = generateProceduralScenario(engine, config);

            // 3. Formulate Response
            const parts = [];
            if (config.zones || config.sources) parts.push(`${config.zones || config.sources || 'Multiple'} Zones`);
            if (config.bridges) parts.push(`${config.bridges} Bridges`);
            if (config.hospitals) parts.push(`${config.hospitals} Hospitals`);
            if (config.sinks) parts.push(`${config.sinks} Sinks`);

            const summary = parts.length > 0 ? parts.join(', ') : 'Standard Configuration';

            response.text = `Custom scenario generated with the following configuration: ${summary}. Simulation is now active.`;
            response.action = 'SCENARIO_LOADED';
        } catch (e) {
            console.error(e);
            response.text = "Error: Scenario generation failed. Reverting to default city model.";
            loadCityScenario(engine);
            engine.start();
        }

        return response;
    }

    // --- Intent: Scenario Generation (Legacy / Presets) ---
    if ((input.includes('scenario') || input.includes('load')) && !input.includes('create')) {

        response.reasoning = [
            'Loading preset configuration...',
            'Initializing scenario actors...',
            'Starting simulation...'
        ];

        let mode = 'CITY';
        if (input.includes('hospital') || input.includes('medical')) mode = 'HOSPITAL';
        if (input.includes('supply') || input.includes('warehouse')) mode = 'SUPPLY';
        if (input.includes('flood')) mode = 'FLOOD';
        if (input.includes('metro')) mode = 'METRO';
        if (input.includes('data') || input.includes('ddos')) mode = 'DATACENTER';

        // Reset Engine
        try {
            engine.stop();
            engine.nodes.clear();
            engine.edges.clear();
            engine.notify();

            if (mode === 'HOSPITAL') {
                loadHospitalScenario(engine);
                response.text = "Emergency Triage scenario loaded. Configuration: 2 Triage units, 3 Operating Rooms, 1 Morgue. Simulation is active.";
            } else if (mode === 'SUPPLY') {
                loadSupplyChainScenario(engine);
                response.text = "Logistics Chain Alpha loaded. Configuration: 3 Warehouses, 12 Retail Nodes. Simulation is active.";
            } else if (mode === 'FLOOD') {
                loadFloodDisasterScenario(engine);
                response.text = "Flash Flood Evacuation (Sylhet) scenario loaded. Risk factor: Rising water levels. Active assets: Boats, Shelters, Helipad. Simulation is active.";
            } else if (mode === 'METRO') {
                loadDhakaMetroScenario(engine);
                response.text = "Dhaka Metro Rush Hour scenario loaded. Location: Mirpur-10 Station. Crowd level: Peak (8000/hr). Simulation is active.";
            } else if (mode === 'DATACENTER') {
                loadDataCenterScenario(engine);
                response.text = "Cloud Datacenter DDoS scenario loaded. Threat detected: Botnet Attack (Asia). Defense: WAF Active. Simulation is active.";
            } else {
                loadCityScenario(engine);
                response.text = "Coastal City Evacuation Prime scenario loaded. Configuration: 2 Bridges, 4 Zones, 1 Safe Harbor. Simulation is active.";
            }

            engine.start();
            response.action = 'SCENARIO_LOADED';
        } catch (error) {
            console.error("Scenario Load Error:", error);
            response.text = `Error: Critical failure during load. Debug: ${error.message}. Reverting to Safe Mode...`;
            engine.nodes.clear();
            engine.edges.clear();
            loadCityScenario(engine);
            engine.start();
        }

        return response;
    }

    // --- Intent: "What If" / Damage Simulation (Bengali/English) --- 
    if (input.includes('what if') || input.includes('jodi') || input.includes('break') || input.includes('destroy') || input.includes('collapse') || input.includes('noshto') || input.includes('bhenge') || input.includes('block')) {

        response.reasoning = [
            'Simulating failure event...',
            'Calculating topology change...',
            'Analyzing cascading effects...'
        ];

        // Find targets
        const nodes = Array.from(engine.nodes.values());
        let targetNode = null;

        // Try to match specific node names or types
        if (input.includes('bridge') || input.includes('setu')) {
            targetNode = nodes.find(n => n.type === NODE_TYPES.BRIDGE && n.status !== 'failed');
        } else {
            // Basic text matching
            targetNode = nodes.find(n => input.includes(n.label.toLowerCase()));
        }

        // If no specific target found, pick a critical one (for demo effect)
        if (!targetNode) {
            targetNode = nodes.find(n => n.type === NODE_TYPES.BRIDGE) || nodes[Math.floor(Math.random() * nodes.length)];
        }

        if (targetNode) {
            // Apply Damage
            engine.removeNode(targetNode.id); // This triggers automatic recalculatePathfinding() in engine

            response.text = `Alert! Catastrophic failure detected at ${targetNode.label}. The node is now offline. I'm recalculating paths to route traffic around the failure. Expect significant congestion spikes in nearby zones.`;
            response.action = 'THREAT_EVENT';
            return response;
        }
    }

    // --- Intent: Optimization (Bengali/English) ---
    if (input.includes('optimize') || input.includes('fix') || input.includes('improve') || input.includes('komao') || input.includes('better') || input.includes('solve')) {

        response.reasoning = [
            'Identifying bottlenecks...',
            'Analyzing flow heuristics...',
            'Adjusting edge weights...',
            'Re-balancing load distribution...'
        ];

        // Run Engine Optimization
        const report = engine.optimizeFlow();

        // Format Report
        const changeLog = report.actions.slice(0, 3).map(a => `  - ${a}`).join('\n');
        const remaining = report.actions.length > 3 ? `\n  - ...and ${report.actions.length - 3} more` : '';

        const riskDiff = report.metricsBefore.riskLevel - report.metricsAfter.riskLevel;
        const flowDiff = report.metricsAfter.throughput - report.metricsBefore.throughput;
        const flowPct = report.metricsBefore.throughput > 0 ? Math.round((flowDiff / report.metricsBefore.throughput) * 100) : 100;

        response.text = `Strategic optimization complete. I've executed the following actions:
${changeLog}${remaining}

Here is the impact analysis:
• Risk Level decreased by ${riskDiff}% (${report.metricsBefore.riskLevel}% → ${report.metricsAfter.riskLevel}%)
• Throughput increased by ${flowPct}% (${Math.round(report.metricsBefore.throughput)}/t → ${Math.round(report.metricsAfter.throughput)}/t)
• System Status changed from ${report.metricsBefore.systemStatus} to ${report.metricsAfter.systemStatus}.`;

        response.action = 'OPTIMIZATION';
        return response;
    }

    // --- Intent: Node Creation (e.g., "Add a hospital at x=200, y=300") ---
    if ((input.includes('add') || input.includes('create') || input.includes('place')) &&
        (input.includes('node') || input.includes('hospital') || input.includes('warehouse') ||
            input.includes('zone') || input.includes('hub') || input.includes('bridge') || input.includes('sink') || input.includes('source'))) {

        response.reasoning = [
            'Parsing coordinates...',
            'Allocating resource...',
            'Synthesizing node...'
        ];

        let type = NODE_TYPES.HUB;
        if (input.includes('hospital')) type = NODE_TYPES.HOSPITAL;
        if (input.includes('warehouse')) type = NODE_TYPES.WAREHOUSE;
        if (input.includes('bridge')) type = NODE_TYPES.BRIDGE;
        if (input.includes('zone')) type = NODE_TYPES.ZONE;
        if (input.includes('sink')) type = NODE_TYPES.SINK;
        if (input.includes('source')) type = NODE_TYPES.SOURCE;

        // Try to find coordinates
        const xMatch = input.match(/x\s*=\s*(\d+)/) || input.match(/x\s*(\d+)/);
        const yMatch = input.match(/y\s*=\s*(\d+)/) || input.match(/y\s*(\d+)/);
        const zMatch = input.match(/z\s*=\s*(\d+)/) || input.match(/z\s*(\d+)/);

        const x = xMatch ? parseInt(xMatch[1]) : Math.random() * 800 + 100;
        const y = yMatch ? parseInt(yMatch[1]) : Math.random() * 800 + 100;
        const z = zMatch ? parseInt(zMatch[1]) : (type === NODE_TYPES.BRIDGE ? 50 : 0);

        // Try to find label
        const labelMatch = input.match(/called\s+([a-zA-Z0-9_\s]+)/) || input.match(/named\s+([a-zA-Z0-9_\s]+)/);
        const label = labelMatch ? labelMatch[1].trim() : `${type}_${Math.floor(Math.random() * 1000)}`;

        engine.addNode({
            type,
            x,
            y,
            z,
            label,
            capacity: input.includes('capacity') ? parseInt(input.match(/capacity\s+(\d+)/)?.[1] || 500) : 500,
            load: input.includes('load') ? parseInt(input.match(/load\s+(\d+)/)?.[1] || 0) : 0
        });

        response.text = `I've created a new node "${label}" of type ${type} at coordinates [${Math.round(x)}, ${Math.round(y)}, ${Math.round(z)}].`;
        response.action = 'NODE_CREATED';
        return response;
    }

    // --- Intent: Edge/Connection Creation (e.g., "Connect Store A to Warehouse B") ---
    if (input.includes('connect') || input.includes('link') || input.includes('route') || input.includes('edge')) {
        response.reasoning = [
            'Analyzing network...',
            'Linking nodes...',
            'Calculating flow...'
        ];

        const nodes = Array.from(engine.nodes.values());
        let sourceNode, targetNode;

        // Try to find node names in input
        nodes.forEach(n => {
            if (input.includes(n.label.toLowerCase())) {
                if (!sourceNode) sourceNode = n;
                else if (!targetNode) targetNode = n;
            }
        });

        if (sourceNode && targetNode) {
            engine.addEdge(sourceNode.id, targetNode.id, {
                maxFlow: input.includes('capacity') ? parseInt(input.match(/capacity\s+(\d+)/)?.[1] || 50) : 50
            });

            response.text = `Link established. ${sourceNode.label} is now connected to ${targetNode.label}. The connection is online.`;
            response.action = 'EDGE_CREATED';
            return response;
        }

        response.text = "I couldn't identify the target nodes. Please check the node names and try again.";
        return response;
    }

    // --- Intent: Entity Removal (e.g., "Remove North Bridge") ---
    if (input.includes('remove') || input.includes('delete') || input.includes('destroy') || input.includes('clear')) {
        response.reasoning = [
            'Identifying target...',
            'Deallocating resources...',
            'Updating topology...'
        ];

        const nodes = Array.from(engine.nodes.values());
        const target = nodes.find(n => input.includes(n.label.toLowerCase()));

        if (target) {
            engine.removeNode(target.id);
            response.text = `Entity decommissioned. "${target.label}" has been successfully removed from the simulation.`;
            response.action = 'ENTITY_REMOVED';
            return response;
        }

        // Check if it's a "event" trigger instead of direct removal (keep existing logic)
        if (input.includes('collapse') || input.includes('block')) {
            // ...handled below in What-if logic
        } else {
            response.text = "I couldn't find the target entity to remove. Please check the name.";
            return response;
        }
    }

    // -- Intent: Load Scenarios --
    if (input.includes('load') || (input.includes('create') && input.includes('scenario'))) {
        response.reasoning = [
            'Parsing parameters...',
            'Generating topology...',
            'Initializing state...'
        ];

        if (input.includes('hospital') || input.includes('emergency') || input.includes('er')) {
            loadHospitalScenario(engine);
            engine.start();
            response.text = "Emergency Department scenario loaded. Triage, CCU, and Minor Treatment units are ready. Status: Active.";
            response.action = 'SCENARIO_LOADED';
            return response;
        }

        if (input.includes('supply') || input.includes('warehouse') || input.includes('logistics')) {
            loadSupplyChainScenario(engine);
            engine.start();
            response.text = "Supply Chain scenario activated. Warehouse, Distribution, and Retail nodes are now online.";
            response.action = 'SCENARIO_LOADED';
            return response;
        }

        // Default: City Evacuation
        loadCityScenario(engine);
        engine.start();
        response.text = "Urban Evacuation scenario loaded. Zones, Shelters, and Hubs have been established. Simulation has started.";
        response.action = 'SCENARIO_LOADED';
        return response;
    }

    // --- Intent: Status / Report / Metrics --
    if (input.includes('status') || input.includes('report') || input.includes('metrics') || input.includes('show')) {
        const { throughput, riskLevel, totalLoad } = engine.metrics;
        response.text = `Here is the current system status:\n• Throughput: ${Math.round(throughput)}/tick\n• Total Load: ${Math.round(totalLoad)}\n• Risk Level: ${riskLevel === 0 ? 'Nominal' : 'Elevated'}`;
        response.action = 'INFO';
        return response;
    }

    // --- Intent: Start/Stop Simulation --
    if (input.includes('start') || input.includes('run')) {
        engine.start();
        response.text = "Simulation started. Telemetry is now active.";
        response.action = 'START';
        return response;
    }
    if (input.includes('stop') || input.includes('pause')) {
        engine.stop();
        response.text = "Simulation paused.";
        response.action = 'STOP';
        return response;
    }
    if (input.includes('reset')) {
        engine.reset();
        response.text = "Simulation reset to initial state.";
        response.action = 'RESET';
        return response;
    }

    // Fallback
    response.text = "I didn't quite catch that. You can ask me to 'Add a hospital', 'Connect nodes', 'Load a scenario', or 'Optimize flow'.";
    response.action = 'FALLBACK';
    return response;
}
