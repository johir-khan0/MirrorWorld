import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyA8nZiJ_wGMa4OPnojEFRn098y8wMdKUhk";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Sends an image to Gemini Vision to extract simulation topology (nodes and edges).
 * @param {string} base64Image - The image data in base64 format.
 * @returns {Promise<{nodes: Array, edges: Array}>} - Structured topology data.
 */
export async function analyzeMapImage(base64Image) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
        Analyze this map/diagram and extract the logical topology for a flow simulation.
        Identify key entities and their relative positions (0-1000 scale for X and Y).
        
        Entities to look for:
        - Hospital (Emergency Care)
        - Warehouse (Storage)
        - Zone (Residential/Industrial area)
        - Bridge (Connection over water/gap)
        - Hub (Network switching point)
        - Source (Origin of people/flow)
        - Sink (Destination/Shelter)

        Return ONLY a JSON object with the following structure:
        {
          "nodes": [
            { "type": "HOSPITAL", "x": 120, "y": 450, "label": "Community_Clinic" },
            ...
          ],
          "edges": [
            { "source": "node_index_or_label_1", "target": "node_index_or_label_2", "maxFlow": 100 },
            ...
          ]
        }
        
        Ensure X and Y coordinates are between 0 and 1000.
        Provide logical labels based on visual context.
    `;

    // Extract MIME type and data
    const mimeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: imageData,
                mimeType: mimeType
            },
        },
    ]);

    const responseText = result.response.text();

    // Extract JSON from response (handling potential markdown blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("Failed to parse Gemini response as JSON: " + responseText);
    }

    return JSON.parse(jsonMatch[0]);
}
