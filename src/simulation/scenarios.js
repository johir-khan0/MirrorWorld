import { NODE_TYPES } from './engine.js';

export function loadCityScenario(engine) {
    // Enhanced 3D City Evacuation Scenario
    // Coordinates are in a 1000x1000 grid, with Z for elevation

    // -- Hospitals (Safe Zones / Sinks) --
    const h1 = engine.addNode({
        label: 'General Hospital',
        x: 250,
        y: 150,
        z: 0,
        type: NODE_TYPES.HOSPITAL,
        capacity: 800,
        load: 0
    });

    const h2 = engine.addNode({
        label: 'Trauma Center',
        x: 750,
        y: 150,
        z: 0,
        type: NODE_TYPES.HOSPITAL,
        capacity: 600,
        load: 0
    });

    const h3 = engine.addNode({
        label: 'Emergency Shelter',
        x: 500,
        y: 50,
        z: 0,
        type: NODE_TYPES.SINK,
        capacity: 1000,
        load: 0
    });

    // -- Residential Zones (Sources) --
    const r1 = engine.addNode({
        label: 'Downtown District',
        x: 250,
        y: 800,
        z: 0,
        type: NODE_TYPES.SOURCE,
        load: 850,
        capacity: 1000,
        generationRate: 2 // People per tick
    });

    const r2 = engine.addNode({
        label: 'North Suburbs',
        x: 500,
        y: 900,
        z: 0,
        type: NODE_TYPES.SOURCE,
        load: 600,
        capacity: 800,
        generationRate: 1.5
    });

    const r3 = engine.addNode({
        label: 'Industrial Zone',
        x: 750,
        y: 800,
        z: 0,
        type: NODE_TYPES.SOURCE,
        load: 400,
        capacity: 600,
        generationRate: 1
    });

    const r4 = engine.addNode({
        label: 'East Residential',
        x: 900,
        y: 500,
        z: 0,
        type: NODE_TYPES.SOURCE,
        load: 500,
        capacity: 700,
        generationRate: 1.2
    });

    // -- Critical Infrastructure (Hubs/Bridges) --
    const bridgeNorth = engine.addNode({
        label: 'North Bridge',
        x: 500,
        y: 300,
        z: 20,
        type: NODE_TYPES.BRIDGE,
        capacity: 1500,
        load: 0
    });

    const bridgeSouth = engine.addNode({
        label: 'South Bridge',
        x: 500,
        y: 700,
        z: 20,
        type: NODE_TYPES.BRIDGE,
        capacity: 1500,
        load: 0
    });

    const centralHub = engine.addNode({
        label: 'Central Plaza',
        x: 500,
        y: 500,
        z: 0,
        type: NODE_TYPES.HUB,
        capacity: 2500,
        load: 0
    });

    const eastHub = engine.addNode({
        label: 'East Junction',
        x: 750,
        y: 500,
        z: 0,
        type: NODE_TYPES.HUB,
        capacity: 1200,
        load: 0
    });

    const westHub = engine.addNode({
        label: 'West Junction',
        x: 250,
        y: 500,
        z: 0,
        type: NODE_TYPES.HUB,
        capacity: 1200,
        load: 0
    });

    // -- Road Network (Edges) --

    // North Flow - Suburbs to Bridges
    engine.addEdge(r2, bridgeNorth, { maxFlow: 80, label: 'Highway 1' });
    engine.addEdge(bridgeNorth, h3, { maxFlow: 100, label: 'Express Route' });
    engine.addEdge(bridgeNorth, centralHub, { maxFlow: 120, label: 'Main Avenue' });

    // South Flow - Downtown to Bridges
    engine.addEdge(r1, bridgeSouth, { maxFlow: 150, label: 'Downtown Expressway' });
    engine.addEdge(r3, bridgeSouth, { maxFlow: 100, label: 'Industrial Road' });
    engine.addEdge(bridgeSouth, centralHub, { maxFlow: 180, label: 'Central Corridor' });

    // East Flow
    engine.addEdge(r4, eastHub, { maxFlow: 90, label: 'East Highway' });
    engine.addEdge(eastHub, centralHub, { maxFlow: 100, label: 'Cross Street' });
    engine.addEdge(eastHub, h2, { maxFlow: 80, label: 'Hospital Route' });

    // West Flow
    engine.addEdge(r1, westHub, { maxFlow: 100, label: 'West Boulevard' });
    engine.addEdge(westHub, centralHub, { maxFlow: 100, label: 'Main Street' });
    engine.addEdge(westHub, h1, { maxFlow: 90, label: 'Medical Drive' });

    // Central Distribution to Hospitals
    engine.addEdge(centralHub, h1, { maxFlow: 150, label: 'Emergency Route 1' });
    engine.addEdge(centralHub, h2, { maxFlow: 150, label: 'Emergency Route 2' });
    engine.addEdge(centralHub, h3, { maxFlow: 120, label: 'Shelter Route' });

    // Cross-Hospital Transfers
    engine.addEdge(h1, h2, { maxFlow: 30, label: 'Inter-Hospital Transfer' });
    engine.addEdge(h2, h3, { maxFlow: 30, label: 'Overflow Route' });

    // Alternative Routes (Lower capacity)
    engine.addEdge(r3, eastHub, { maxFlow: 60, label: 'Alternate Route' });
    engine.addEdge(bridgeNorth, h1, { maxFlow: 70, label: 'North Bypass' });
    engine.addEdge(bridgeNorth, h2, { maxFlow: 70, label: 'North Bypass 2' });
}

// Additional scenario: Hospital Emergency Department
export function loadDhakaMetroScenario(engine) {
    // REAL WORLD SCENARIO 1: Dhaka Metro Rail Rush Hour (Mirpur 10)
    // Complexity: High density, rigid paths (escalators/gates), strict bottlenecks

    // -- Sources (Crowd Inflow) --
    // Gates release people in bursts
    const gateA = engine.addNode({ label: 'Entry Gate A (East)', x: 100, y: 850, z: 0, type: NODE_TYPES.SOURCE, load: 800, capacity: 1000, generationRate: 4 });
    const gateB = engine.addNode({ label: 'Entry Gate B (West)', x: 900, y: 850, z: 0, type: NODE_TYPES.SOURCE, load: 800, capacity: 1000, generationRate: 4 });
    const incomingTrain = engine.addNode({ label: 'Arr. Train (Uttara)', x: 500, y: 100, z: 30, type: NODE_TYPES.SOURCE, load: 1200, capacity: 1500, generationRate: 0 }); // Burst release

    // -- Hubs (Processing Points) --
    // Level 1: Ticket & Security
    const ticketCounter = engine.addNode({ label: 'Ticket Counters', x: 500, y: 750, z: 0, type: NODE_TYPES.HUB, capacity: 300, load: 100 });
    const securityCheck = engine.addNode({ label: 'Security Check', x: 500, y: 650, z: 0, type: NODE_TYPES.HUB, capacity: 200, load: 50 }); // Bottleneck

    // Level 2: Concourse
    const concourse = engine.addNode({ label: 'Concourse Hall', x: 500, y: 500, z: 15, type: NODE_TYPES.HUB, capacity: 2000, load: 200 });
    
    // Level 3: Platform Access
    const escalatorUp = engine.addNode({ label: 'Escalators (UP)', x: 300, y: 400, z: 20, type: NODE_TYPES.BRIDGE, capacity: 100, load: 80 });
    const stairsUp = engine.addNode({ label: 'Stairs (UP)', x: 700, y: 400, z: 20, type: NODE_TYPES.BRIDGE, capacity: 150, load: 50 });

    // -- Sinks (Destinations) --
    const platformAgargaon = engine.addNode({ label: 'Platform (To Agargaon)', x: 300, y: 100, z: 30, type: NODE_TYPES.SINK, capacity: 3000, processedCount: 0 });
    const exitGates = engine.addNode({ label: 'Exit Gates', x: 500, y: 950, z: 0, type: NODE_TYPES.SINK, capacity: 1000, processedCount: 0 });

    // -- Connections --
    // Entry Flow
    engine.addEdge(gateA, ticketCounter, { maxFlow: 20 });
    engine.addEdge(gateB, ticketCounter, { maxFlow: 20 });
    engine.addEdge(ticketCounter, securityCheck, { maxFlow: 15 }); // Slow processing
    engine.addEdge(securityCheck, concourse, { maxFlow: 30 });
    
    // To Platform
    engine.addEdge(concourse, escalatorUp, { maxFlow: 10 }); // Mechanical limit
    engine.addEdge(concourse, stairsUp, { maxFlow: 25 });
    engine.addEdge(escalatorUp, platformAgargaon, { maxFlow: 20 });
    engine.addEdge(stairsUp, platformAgargaon, { maxFlow: 25 });

    // Exit Flow (Arrivals)
    engine.addEdge(incomingTrain, concourse, { maxFlow: 60 }); // Rapid unloading
    engine.addEdge(concourse, exitGates, { maxFlow: 40 });
}

export function loadDataCenterScenario(engine) {
    // REAL WORLD SCENARIO 2: Cloud Data Center DDoS Attack
    // Complexity: High velocity flow, load balancers, redundancy

    // -- Sources (Traffic) --
    const organicTraffic = engine.addNode({ label: 'User Traffic (Organic)', x: 100, y: 500, z: 50, type: NODE_TYPES.SOURCE, load: 500, capacity: 10000, generationRate: 10 });
    const botnetAsia = engine.addNode({ label: 'Botnet (Region AS)', x: 100, y: 200, z: 50, type: NODE_TYPES.SOURCE, load: 2000, capacity: 5000, generationRate: 50 });
    const botnetEu = engine.addNode({ label: 'Botnet (Region EU)', x: 100, y: 800, z: 50, type: NODE_TYPES.SOURCE, load: 3000, capacity: 5000, generationRate: 60 });

    // -- Defense Layer --
    const edgeFirewall = engine.addNode({ label: 'WAF (Edge Firewall)', x: 300, y: 500, z: 40, type: NODE_TYPES.BRIDGE, capacity: 4000, load: 1000 });
    const scrubber = engine.addNode({ label: 'DDoS Scrubber', x: 300, y: 700, z: 40, type: NODE_TYPES.HUB, capacity: 5000, load: 0 });

    // -- App Layer --
    const loadBalancer = engine.addNode({ label: 'Load Balancer', x: 500, y: 500, z: 30, type: NODE_TYPES.HUB, capacity: 2000, load: 200 });
    
    const serviceAuth = engine.addNode({ label: 'Auth Service', x: 700, y: 300, z: 20, type: NODE_TYPES.HUB, capacity: 800, load: 50 });
    const serviceDb = engine.addNode({ label: 'Primary DB Cluster', x: 800, y: 500, z: 10, type: NODE_TYPES.HUB, capacity: 1500, load: 100 });
    const workers = engine.addNode({ label: 'Worker Nodes', x: 700, y: 700, z: 20, type: NODE_TYPES.HUB, capacity: 1200, load: 100 });

    // -- Sinks --
    const success200 = engine.addNode({ label: '200 OK (Served)', x: 900, y: 500, z: 0, type: NODE_TYPES.SINK, capacity: 100000, processedCount: 0 });
    const dropped403 = engine.addNode({ label: '403 Blocked', x: 400, y: 900, z: 0, type: NODE_TYPES.SINK, capacity: 100000, processedCount: 0 });

    // -- Network Links --
    // Attack Vectors
    engine.addEdge(organicTraffic, edgeFirewall, { maxFlow: 50 });
    engine.addEdge(botnetAsia, edgeFirewall, { maxFlow: 150 }); 
    engine.addEdge(botnetEu, edgeFirewall, { maxFlow: 180 });

    // Defense Routing
    engine.addEdge(edgeFirewall, loadBalancer, { maxFlow: 100 }); // Clean traffic
    engine.addEdge(edgeFirewall, scrubber, { maxFlow: 200 }); // Suspicious
    engine.addEdge(scrubber, dropped403, { maxFlow: 200 }); // Blocked
    engine.addEdge(scrubber, loadBalancer, { maxFlow: 20 }); // Cleaned re-entry

    // App Logic
    engine.addEdge(loadBalancer, serviceAuth, { maxFlow: 60 });
    engine.addEdge(loadBalancer, workers, { maxFlow: 80 });
    engine.addEdge(serviceAuth, serviceDb, { maxFlow: 40 });
    engine.addEdge(workers, serviceDb, { maxFlow: 50 });
    
    // Success State
    engine.addEdge(serviceDb, success200, { maxFlow: 100 });
}

export function loadFloodDisasterScenario(engine) {
    // REAL WORLD SCENARIO 3: Flash Flood Evacuation (Sylhet Region)
    // Context: Rivers overflowing, villagers moving to high ground (Shelters)
    
    // -- Sources (Villages in Low Lands) --
    // Z coordinate reflects elevation. Lower Z = Higher Risk.
    const villageA = engine.addNode({ label: 'Village Lowland (Risk: HIGH)', x: 200, y: 800, z: -5, type: NODE_TYPES.SOURCE, load: 1500, capacity: 2000, generationRate: 0 }); // Static population to evacuate
    const villageB = engine.addNode({ label: 'Riverbank Community', x: 300, y: 600, z: -2, type: NODE_TYPES.SOURCE, load: 1000, capacity: 1500, generationRate: 0 });
    
    // -- Hubs (Transit Points / Dry Ground) --
    const highwayJunction = engine.addNode({ label: 'Avg. Highway Junction', x: 500, y: 500, z: 10, type: NODE_TYPES.HUB, capacity: 3000, load: 50 });
    const boatTerminal = engine.addNode({ label: 'Rescue Boat Terminal', x: 400, y: 400, z: 5, type: NODE_TYPES.HUB, capacity: 500, load: 20 });
    
    // -- Crucial Bridges (Vulnerable) --
    const oldBridge = engine.addNode({ label: 'Old Wooden Bridge', x: 400, y: 700, z: 10, type: NODE_TYPES.BRIDGE, capacity: 200, load: 0 }); // Low capacity bottleneck
    const mainBridge = engine.addNode({ label: 'Concrete Bridge', x: 600, y: 600, z: 15, type: NODE_TYPES.BRIDGE, capacity: 1000, load: 0 });

    // -- Sinks (Shelters / High Ground) --
    const shelterSchool = engine.addNode({ label: 'Primary School Shelter', x: 600, y: 200, z: 25, type: NODE_TYPES.SINK, capacity: 1200, processedCount: 0 });
    const shelterCollege = engine.addNode({ label: 'College Multi-purpose', x: 800, y: 200, z: 30, type: NODE_TYPES.SINK, capacity: 2000, processedCount: 0 });
    const helipad = engine.addNode({ label: 'Emergency Helipad', x: 850, y: 100, z: 40, type: NODE_TYPES.SINK, capacity: 500, processedCount: 0 });

    // -- Routing (Escape Routes) --
    
    // From Village A (Most Critical)
    engine.addEdge(villageA, oldBridge, { maxFlow: 15 }); // Very slow connection
    engine.addEdge(villageA, boatTerminal, { maxFlow: 30 }); // Rescue boats
    
    // From Village B
    engine.addEdge(villageB, mainBridge, { maxFlow: 80 }); 
    engine.addEdge(villageB, boatTerminal, { maxFlow: 20 });
    
    // Intermediate
    engine.addEdge(oldBridge, highwayJunction, { maxFlow: 20 });
    engine.addEdge(mainBridge, highwayJunction, { maxFlow: 80 });
    engine.addEdge(boatTerminal, highwayJunction, { maxFlow: 25 });
    
    // To Shelters
    engine.addEdge(highwayJunction, shelterSchool, { maxFlow: 50 });
    engine.addEdge(highwayJunction, shelterCollege, { maxFlow: 80 });
    engine.addEdge(highwayJunction, helipad, { maxFlow: 10 }); // Airlift limited
}

export function loadHospitalScenario(engine) {
    // ER Department Flow Simulation

    const entrance = engine.addNode({
        label: 'ER Entrance',
        x: 200,
        y: 500,
        z: 0,
        type: NODE_TYPES.SOURCE,
        load: 300,
        capacity: 500,
        generationRate: 3 // New patients arriving
    });

    const triage = engine.addNode({
        label: 'Triage',
        x: 400,
        y: 500,
        z: 0,
        type: NODE_TYPES.HUB,
        capacity: 200,
        load: 0
    });

    const critical = engine.addNode({
        label: 'Critical Care',
        x: 600,
        y: 300,
        z: 0,
        type: NODE_TYPES.SINK,
        capacity: 100,
        load: 0
    });

    const standard = engine.addNode({
        label: 'Standard Care',
        x: 600,
        y: 500,
        z: 0,
        type: NODE_TYPES.SINK,
        capacity: 150,
        load: 0
    });

    const minor = engine.addNode({
        label: 'Minor Treatment',
        x: 600,
        y: 700,
        z: 0,
        type: NODE_TYPES.SINK,
        capacity: 200,
        load: 0
    });

    // Flow paths
    engine.addEdge(entrance, triage, { maxFlow: 50, label: 'Intake' });
    engine.addEdge(triage, critical, { maxFlow: 20, label: 'Critical Path' });
    engine.addEdge(triage, standard, { maxFlow: 30, label: 'Standard Path' });
    engine.addEdge(triage, minor, { maxFlow: 40, label: 'Minor Path' });
}

// Supply Chain Scenario
export function loadSupplyChainScenario(engine) {
    const warehouse = engine.addNode({
        label: 'Central Warehouse',
        x: 200,
        y: 500,
        z: 0,
        type: NODE_TYPES.SOURCE,
        load: 1000,
        capacity: 2000,
        generationRate: 5
    });

    const distCenter1 = engine.addNode({
        label: 'Distribution North',
        x: 500,
        y: 300,
        z: 0,
        type: NODE_TYPES.HUB,
        capacity: 500,
        load: 0
    });

    const distCenter2 = engine.addNode({
        label: 'Distribution South',
        x: 500,
        y: 700,
        z: 0,
        type: NODE_TYPES.HUB,
        capacity: 500,
        load: 0
    });

    const store1 = engine.addNode({
        label: 'Store A',
        x: 800,
        y: 200,
        z: 0,
        type: NODE_TYPES.SINK,
        capacity: 300,
        load: 0
    });

    const store2 = engine.addNode({
        label: 'Store B',
        x: 800,
        y: 400,
        z: 0,
        type: NODE_TYPES.SINK,
        capacity: 300,
        load: 0
    });

    const store3 = engine.addNode({
        label: 'Store C',
        x: 800,
        y: 600,
        z: 0,
        type: NODE_TYPES.SINK,
        capacity: 300,
        load: 0
    });

    const store4 = engine.addNode({
        label: 'Store D',
        x: 800,
        y: 800,
        z: 0,
        type: NODE_TYPES.SINK,
        capacity: 300,
        load: 0
    });

    // Distribution routes
    engine.addEdge(warehouse, distCenter1, { maxFlow: 100, label: 'Truck Route 1' });
    engine.addEdge(warehouse, distCenter2, { maxFlow: 100, label: 'Truck Route 2' });

    engine.addEdge(distCenter1, store1, { maxFlow: 50, label: 'Delivery 1A' });
    engine.addEdge(distCenter1, store2, { maxFlow: 50, label: 'Delivery 1B' });

    engine.addEdge(distCenter2, store3, { maxFlow: 50, label: 'Delivery 2C' });
    engine.addEdge(distCenter2, store4, { maxFlow: 50, label: 'Delivery 2D' });
}

