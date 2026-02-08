import { GoogleGenerativeAI } from "@google/generative-ai";

// Access API key from Vite environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Mock response for when API is unavailable or for testing.
 */
function getMockTopology() {
    return {
        nodes: [
            { type: "HOSPITAL", x: 400, y: 300, label: "Detected_Hospital" },
            { type: "ZONE", x: 200, y: 400, label: "Residential_Area" },
            { type: "BRIDGE", x: 600, y: 350, label: "Conn_Bridge" }
        ],
        edges: [
            { source: "Detected_Hospital", target: "Conn_Bridge" },
            { source: "Residential_Area", target: "Detected_Hospital" }
        ]
    };
}

/**
 * Sends an image to Gemini Vision to extract simulation topology (nodes and edges).
 * @param {string} base64Image - The image data in base64 format.
 * @returns {Promise<{nodes: Array, edges: Array}>} - Structured topology data.
 */
export async function analyzeMapImage(base64Image) {
    try {
        // Prepare Base64 string (remove header if present)
        const mimeType = "image/png"; // Assuming PNG or JPEG
        const imagePart = {
            inlineData: {
                data: base64Image.split(',')[1] || base64Image,
                mimeType
            }
        };

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Analyze this image carefully. It may be a map, a satellite view, a diagram, or a photo of an object (like a toy hospital, a building model, or a sketch).
            
            Your goal is to extract a "Simulation Topology" from this visual input.
            
            1. **Detect Objects/Entities**: Look for anything that could represent a city element.
               - If it's a photo of a single object (e.g., a "red cube" or "toy car"), interpret it as a specific node type (e.g., ZONE or VEHICLE) placed at the center.
               - If it's a map/diagram, detect multiple distinct elements.
            
            2. **Map to Node Types**: Match detected objects to these exact types:
               - **HOSPITAL**: Any red cross, blue building, medical sign, or "hospital" text.
               - **WAREHOUSE**: Boxes, large square buildings, "storage", or "factory" icons.
               - **ZONE**: General residential blocks, houses, or circled areas.
               - **BRIDGE**: Connections over rivers, text "bridge", or long rectangular strips.
               - **HUB**: Intersections, roundabouts, or central connection points.
               - **SOURCE**: Entry points, arrows pointing 'in', or "start" labels.
               - **SINK**: Exit points, safety zones, arrows pointing 'out', or "end" labels.
               - **SHELTER**: Safe houses, green areas, or tent icons.

            3. **Coordinate Systems (CRITICAL)**:
               - **X and Y**: Map the image space to a virtual grid of 0 to 1000.
                 - X=0 is Left, X=1000 is Right.
                 - Y=0 is Top, Y=1000 is Bottom.
               - **Z (Elevation/Height)**: You can now specify 'z' (0-100) and 'height' (1-50).
                 - If an object looks tall (like a skyscraper), set 'height' high (e.g., 20) and 'z' to 0.
                 - If an object is flying or floating, set 'z' high (e.g., 50).
                 - Default 'z' is 0. Default 'height' is calculated by the engine based on load.

            4. **Infer Connections (Edges)**:
               - If objects are close or connected by lines/roads, create an edge.
               - If it's a single object photo, no edges are needed.

            5. **Explanation & Workflow**:
               - Provide a text explanation of what these nodes do and how they interact.
               - Describe the potential workflow (e.g. "Patients arrive at Zone A and are transported to Hospital...").

            Return ONLY a raw valid JSON object (no markdown formatting, no backticks).
            Structure:
            {
              "explanation": "Detected a medical triaging system. Patients from the Residential Zone are routed to the central Hospital via the bridge...",
              "nodes": [
                { 
                  "type": "HOSPITAL", 
                  "x": 500, "y": 500, "z": 0,
                  "height": 10,
                  "label": "Detected_Obj_1" 
                },
                ...
              ],
              "edges": [
                { "source": "Detected_Obj_1", "target": "Detected_Obj_2" }
              ]
            }
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        
        // Clean markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.warn("Gemini API Error (Falling back to Mock):", error);
        // Simulate network delay
        await new Promise(r => setTimeout(r, 2000));
        return getMockTopology();
    }
}

/**
 * Sends a text scenario description to Gemini to generate simulation topology.
 * @param {string} description - The user's scenario description.
 * @returns {Promise<{nodes: Array, edges: Array}>} - Structured topology data.
 */
export async function analyzeScenarioText(description) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are an expert simulation architect.
            The user wants to create a city/logistics/network simulation based on this description:
            "${description}"

            Generate a valid JSON object representing the simulation topology (nodes and edges).
            
            Rules:
            - Create between 5 and 15 nodes based on the complexity.
            - Use 0-1000 scale for X and Y coordinates. Layout them logically (e.g., Sources on one side, Sinks on other, Hubs in middle).
            - **Z and Height**: Use "z" (0-100) and "height" (1-50) to create 3D verticality.
            - Node Types allowed: HOSPITAL, ZONE, BRIDGE, HUB, SOURCE, SINK, WAREHOUSE.
            - Label nodes descriptively (e.g., "North_Storage", "Main_Bridge").
            - Connect relevant nodes with edges.
            - **Explanation**: Include a field "explanation" describing your design, the role of key nodes, and the intended workflow.

            Return ONLY valid JSON (no markdown):
            {
            "explanation": "I have designed a disaster relief supply chain. The Main Warehouse feeds smaller hubs...",
            "nodes": [
                { "type": "HOSPITAL", "x": 120, "y": 450, "z": 0, "height": 15, "label": "Central_ER" },
                ...
            ],
            "edges": [
                { "source": "NodeLabel1", "target": "NodeLabel2", "maxFlow": 100 }
            ]
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.warn("Gemini Text API Error:", error);
        // Fallback to procedure generation based on keywords if needed, 
        // but for now let's return a simple mock or throw to let the UI handle it.
        await new Promise(r => setTimeout(r, 1500));
        return getMockTopology(); 
    }
}
