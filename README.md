<<<<<<< HEAD
# MirrorWorld AI — 3D Decision Testing Environment

![Version](https://img.shields.io/badge/version-2.0.4--BETA-blue)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![Three.js](https://img.shields.io/badge/Three.js-Enabled-black?logo=three.js)

**MirrorWorld AI** is an immersive 3D simulation platform that transforms natural language descriptions into live, interactive digital twins. Test real-world scenarios before implementation through visual, physics-based simulations.

---

## 🌟 Key Features

### 🎯 Three-Layer Architecture

1. **User Intent Layer** — Natural language processing
   - Describe scenarios in plain English
   - No complex configuration needed
   - Instant system generation

2. **Simulation Logic Layer** — Real physics-based simulation
   - Time-step precision flow mechanics
   - Capacity constraints & bottleneck detection
   - Dynamic rerouting & congestion modeling
   - Cause-and-effect behavior

3. **Decision Optimization Layer** — Smart analysis & suggestions
   - Automatic bottleneck identification
   - Flow distribution optimization
   - Before/after comparison metrics
   - Real-time improvement suggestions

### 🎨 Immersive 3D Visualization

- **Interactive 3D Environment** powered by Three.js
- **Animated Flow Particles** showing real-time movement
- **Dynamic Camera Controls** (orbit, pan, zoom)
- **Color-Coded Status** (green → yellow → red)
- **Realistic Lighting & Materials**
- **Toggle between 2D and 3D views**

### 🚀 Real-World Scenarios

#### 1. **Disaster Evacuation**
```
"Create a coastal city evacuation model"
```
- Test evacuation routes
- Identify bottlenecks
- Optimize flow before emergencies

#### 2. **Hospital Emergency Department**
```
"Load hospital scenario"
```
- Monitor patient flow
- Reduce waiting times
- Optimize resource allocation

#### 3. **Supply Chain Logistics**
```
"Create supply chain scenario"
```
- Track inventory movement
- Optimize delivery routes
- Reduce operational costs

---

## 🎮 Getting Started

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Navigate to `http://localhost:5173`

---

## 💬 Natural Language Commands

### Scenario Creation
```
"Create a flood evacuation scenario"
"Load hospital scenario"
"Create supply chain"
```

### What-If Experiments
```
"What if North Bridge collapses?"
"Remove Central Plaza"
"Block South Bridge"
```

### Optimization
```
"Optimize evacuation time"
"Reduce congestion"
"Improve flow efficiency"
```

### System Control
```
"Show status"
"Repair system"
"Start simulation"
"Stop simulation"
"Reset"
```

### Help
```
"Help"
"Show commands"
```

---

## 🎛️ 3D Controls

| Action | Control |
|--------|---------|
| **Rotate View** | Left Click + Drag |
| **Pan Camera** | Right Click + Drag |
| **Zoom** | Mouse Scroll |
| **Toggle 2D/3D** | Click "3D VIEW" button in header |

---

## 🏗️ Architecture

### Core Components

```
src/
├── simulation/
│   ├── engine.js          # Physics simulation engine
│   ├── scenarios.js       # Pre-built scenarios
│   └── SimulationContext.jsx
├── visualization/
│   ├── GraphVisualizer.jsx    # 2D visualization
│   └── GraphVisualizer3D.jsx  # 3D visualization (Three.js)
├── chat/
│   ├── ChatPanel.jsx      # Natural language interface
│   └── mockAI.js          # Command processor
└── metrics/
    └── MetricsPanel.jsx   # Real-time metrics display
```

### Simulation Engine Features

- **Time-step simulation** (10 ticks/second)
- **Flow conservation** physics
- **Congestion modeling** with dynamic capacity reduction
- **Bottleneck detection** algorithm
- **Automatic optimization** with capacity adjustments
- **History tracking** for analysis

---

## 📊 Metrics & Analytics

Real-time monitoring includes:

- **Throughput** — Units flowing per tick
- **Total Load** — Current entities in system
- **Critical Nodes** — Overloaded locations
- **Congestion Points** — Bottleneck count
- **Bottleneck Analysis** — Severity ranking
- **Simulation Time** — Elapsed time tracking

---

## 🎨 Visual Design

### Node Types (3D Shapes)

| Type | Shape | Color | Purpose |
|------|-------|-------|---------|
| **SOURCE** | Cone | Cyan | Origin points (residential zones, warehouses) |
| **SINK** | Cylinder | Green | Destinations (hospitals, stores) |
| **HUB** | Octahedron | Blue | Junctions (plazas, distribution centers) |
| **BRIDGE** | Octahedron | Blue (elevated) | Critical infrastructure |

### Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| **Stable** | Green | Normal operation (<70% capacity) |
| **Warning** | Yellow | High load (70-90% capacity) |
| **Critical** | Red | Overloaded (>90% capacity) |

### Edge States

| State | Color | Opacity |
|-------|-------|---------|
| **Normal** | Cyan | 60-100% (based on flow) |
| **Congested** | Orange | 60-100% |
| **Blocked** | Red | 30% |

---

## 🧪 Example Workflow

### 1. Create Scenario
```
User: "Create evacuation scenario"
System: ✓ Loads city with 2,350 people, 3 hospitals, 5 hubs, 2 bridges
```

### 2. Observe Simulation
- Watch 3D flow particles move through network
- Monitor metrics panel for throughput
- Identify congestion (yellow/red nodes)

### 3. Test What-If
```
User: "What if North Bridge collapses?"
System: ⚠️ 4 routes severed, 380 units/min capacity lost
```
- Observe traffic rerouting
- See congestion increase
- Note evacuation time impact

### 4. Optimize
```
User: "Optimize flow"
System: ✓ 3 bottlenecks addressed, capacity +30%, congestion reduced
```
- Watch improvements in real-time
- Compare before/after metrics
- Verify reduced evacuation time

---

## 🔬 Technical Stack

- **React 19.2** — UI framework
- **Three.js** — 3D rendering
- **@react-three/fiber** — React renderer for Three.js
- **@react-three/drei** — Three.js helpers
- **Vite** — Build tool
- **Zustand** — State management (via context)
- **Framer Motion** — Animations
- **Lucide React** — Icons

---

## 🎯 Use Cases

### Emergency Management
- Test evacuation plans
- Identify critical infrastructure
- Optimize emergency response

### Healthcare Operations
- Model patient flow
- Reduce ER waiting times
- Optimize resource allocation

### Supply Chain
- Simulate logistics networks
- Identify delivery bottlenecks
- Optimize inventory distribution

### Urban Planning
- Test traffic patterns
- Evaluate infrastructure changes
- Predict congestion points

---

## 🚀 Future Enhancements

- [ ] AI-powered scenario generation from text
- [ ] Historical data import
- [ ] Multi-scenario comparison
- [ ] Export simulation results
- [ ] Real-time collaboration
- [ ] Advanced pathfinding algorithms
- [ ] Machine learning optimization
- [ ] VR/AR support

---

## 📝 License

MIT License — Free to use and modify

---

## 🤝 Contributing

Contributions welcome! This is a decision testing environment, not just a chatbot.

**Core Philosophy:**
> "Users should feel like they're inside the system, not looking at data."

---

## 📧 Support

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ for better decision-making through simulation**
=======
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
>>>>>>> origin/main
