# MirrorWorld AI  3D Generative Simulation Environment

![Version](https://img.shields.io/badge/version-2.1.0--BETA-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Three.js](https://img.shields.io/badge/Three.js-Enabled-black?logo=three.js)
![Gemini AI](https://img.shields.io/badge/AI-Gemini_1.5_Flash-magenta?logo=google-gemini)

**MirrorWorld AI** is an advanced 3D simulation platform that allows users to generate, visualize, and interact with complex systems using natural language and computer vision. By integrating Google's **Gemini 1.5 Pro/Flash**, it transforms text descriptions and uploaded diagrams into live, physics-based digital twins.

---

##  Purpose

The goal of MirrorWorld is to bridge the gap between **abstract ideas** and **concrete simulations**. Instead of manually coding nodes and edges, users can simply say *"Build a city with 3 hospitals and high traffic"* or upload a sketch of a network, and the AI will construct a fully interactive 3D model.

This tool is designed for **decision intelligence**allowing you to test "What If" scenarios in real-time.

---

##  Use Cases

MirrorWorld is versatile and can be applied in various domains:

1.  **Urban Planning & Smart Cities**
    *   Simulate traffic flow, congestion, and public transit optimization.
    *   Test evacuation routes for disaster management (floods, earthquakes).

2.  **Healthcare Operations**
    *   Model patient flow through hospitals.
    *   Optimize emergency room triage and resource allocation during surges.

3.  **Supply Chain & Logistics**
    *   Visualize distribution networks (warehouses to hubs to retailers).
    *   Identify bottlenecks in delivery routes.

4.  **Network Topology**
    *   Visualize server clusters and data flow.
    *   Simulate load balancing and connection failures.

---

##  Setup Guideline

Follow these steps to get MirrorWorld running locally.

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn
*   A Google Gemini API Key

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Musfiq-003/MirrorWorld.git
    cd MirrorWorld
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    *   Create a `.env` file in the root directory.
    *   Add your Gemini API Key (get one from [Google AI Studio](https://aistudio.google.com/)).
    ```env
    VITE_GEMINI_API_KEY=your_actual_api_key_here
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    *   Open your browser at `http://localhost:5173`.

---

##  How to Use

### 1. The Intelligence Layer (Chat)
The sidebar is your command center. You can interact via:
*   **Text Mode**: Type commands like *"Create a futuristic city with floating drones"* or *"Simulate a hospital under high load"*.
*   **Vision Mode**: Click the **Image Icon** to upload a map, diagram, or sketch. The AI will analyze the image and reconstruct the topology in 3D.

### 2. The 3D Viewport
*   **Rotate**: Left-click + Drag.
*   **Pan**: Right-click + Drag.
*   **Zoom**: Scroll wheel.
*   **Select**: Click on any node to see its details (load, capacity, status).

### 3. Simulation Controls
*   **Play/Pause**: Start or stop the physics engine.
*   **Manual Control**: Use the "Settings" icon to manually drop nodes (Hospitals, Bridges, etc.) into the world.
*   **God Mode**: Trigger disasters or miracles using natural language (e.g., *"Collapse the main bridge"*).

---

##  AI Capabilities

MirrorWorld uses a sophisticated prompt engineering layer to communicate with Gemini:

*   **Spatial Reasoning**: The AI understands coordinate systems (X, Y, Z) and can place objects at specific altitudes (e.g., flying drones vs. ground vehicles).
*   **Architectural Explanation**: After generating a world, the AI acts as an architect, explaining *why* it placed certain buildings where it did and how the system flows.

---

##  Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

---

##  License

This project is licensed under the MIT License.

