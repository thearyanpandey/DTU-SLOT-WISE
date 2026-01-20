import { GoogleGenAI } from "@google/genai";

// Main function connected to App.jsx
export const parseTimetable = async (apiKey, files) => {
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });


    const imageParts = await Promise.all(files.map(f => fileToGenerativePart(f)));

    console.log("🚀 Sending images to Gemini for Raw Extraction...");


    const prompt = `
      You are a raw data extractor for university timetables.
      I have uploaded ${files.length} image(s) of timetable grids.
      
      TASK:
      Convert the visual grid into a comprehensive, flat JSON list representing every active time slot. Do NOT filter any data.

      INSTRUCTIONS:
      1.  **Analyze Grid:** Identify the headers defining Days (rows: MON, TUE...) and Times (columns: 8-9, 9-10...).
      2.  **Iterate & Extract:** Go through every intersection of Day and Time.
      3.  **Handling Multiple Items in One Slot (Vertical Stacking):**
          - Many grid cells contain multiple distinct classes stacked vertically.
          - Extract all text for *each* distinct stack item.
          - Join these distinct items together using exactly this separator: " || " (space pipe pipe space).
      4.  **Handling Time Spans (Horizontal Spanning):**
          - If a single visual block spans across multiple column headers (e.g., a Lab block 10-12), generate SEPARATE JSON entries for each hourly interval (e.g., one for 10-11, one for 11-12).
          - Both entries should contain the same raw content text.
      5.  **Content:** The "raw_content" string should include EVERYTHING in that block: course codes, type (L/P), professors, rooms.

      OUTPUT FORMAT (JSON Array ONLY):
      [
        { "day": "MON", "time": "8-9", "raw_content": "E1 L PE308 GET PROF.NAVEEN || L PE308 GET PROF.ANIL" },
        { "day": "MON", "time": "11-12", "raw_content": "P PE 302 LAB G1 MUKESH S D" },
        { "day": "MON", "time": "12-1", "raw_content": "P PE 302 LAB G1 MUKESH S D" }
      ]
      
      Return only valid JSON.
    `;


    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Switched to a standard valid model name
      contents: [
        // Map images to the format expected by this SDK
        ...imageParts.map(part => ({
          inlineData: {
            mimeType: part.mimeType,
            data: part.data
          }
        })),
        { text: prompt }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    console.log("Raw Gemini Response Keys:", Object.keys(response || {}));

    let rawText = "";
    if (typeof response.text === 'function') {
      rawText = response.text();
    } else if (response.text) {
      rawText = response.text;
    } else if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts[0].text) {
      // Fallback for raw candidate structure
      rawText = response.candidates[0].content.parts[0].text;
    } else {
      console.error("Unknown response structure:", JSON.stringify(response, null, 2));
      throw new Error("Invalid response from Gemini AI. Please check API Key and try again.");
    }

    const jsonString = cleanJsonString(rawText);
    let parsedData = JSON.parse(jsonString);

    if (!Array.isArray(parsedData)) {
      console.warn("AI did not return an array. Attempting to wrap.");
      parsedData = [parsedData];
    }

    console.log(`✅ Extracted ${parsedData.length} raw time slots.`);
    return parsedData;

  } catch (error) {
    console.error("Raw Processor Error:", error);
    throw error;
  }
};

// --- HELPER FUNCTIONS ---

const cleanJsonString = (text) => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
};

const fileToGenerativePart = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // The SDK needs the base64 string without the prefix
      const base64Data = reader.result.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64Data
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};