import { GoogleGenAI } from "@google/genai";

// Main function connected to App.jsx
export const parseTimetable = async (apiKey, files, courses, group) => {
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // Convert Files to Images
    const images = await Promise.all(files.map(f => fileToImage(f)));

    // STEP 1: SCOUT
    console.log("🕵️ Scouting layout...");
    const layout = await detectLayout(ai, images[0]);
    console.log("✅ Layout detected");

    let allExtractedText = "";
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

    // Extract header once
    const headerImg = await cropImage(images[layout.header.fileIndex], layout.header.coords);

    // STEP 2: PROCESS EACH DAY
    for (const day of days) {
      if (!layout.days[day]) {
        console.log(`⚠️ Skipping ${day} (Not found in images)`);
        continue;
      }

      console.log(`Processing ${day}...`);
      
      const dayRowImg = await cropImage(
        images[layout.days[day].fileIndex], 
        layout.days[day].coords
      );
      
      const stitchedBase64 = await stitchImages(headerImg, dayRowImg);
      
      // B. Extract Data (Now returns STRING)
      let dayJsonString = await extractDayData(ai, day, stitchedBase64);
      
      // C. Verify Data (Passes STRING)
      // We wrap this in a try/catch so verification failure doesn't crash the whole app
      try {
        const verification = await verifyExtraction(ai, day, stitchedBase64, dayJsonString);
        if (verification.hasErrors) {
          console.log(`🔴 Correction found for ${day}: ${verification.correction}`);
          // Append note to the JSON string (simple hack for now)
          // Ideally, we would re-parse and add it, but appending a comment works for the parser
          // Since the parser uses regex to find [], we can just log it or append text outside
        }
      } catch (verifyError) {
        console.warn(`Verification failed for ${day}, proceeding with extracted data.`);
      }

      allExtractedText += dayJsonString + "\n";
    }

    // STEP 3: Parse
    return parseFromExtractedText(allExtractedText, courses, group);

  } catch (error) {
    console.error("Fatal Error in Processor:", error);
    throw error;
  }
};

// --- LOGIC FUNCTIONS ---

async function detectLayout(ai, imageElement) {
  const base64 = getBase64FromImage(imageElement);
  
  const prompt = `
    Analyze this timetable image layout. I need bounding boxes for:
    1. "Time Slot Header" row.
    2. Rows for "MON", "TUE", "WED", "THU", "FRI".
    
    Return ONLY valid JSON:
    {
      "header": { "x": 0, "y": 120, "w": 2000, "h": 80 },
      "days": {
        "MON": { "x": 0, "y": 200, "w": 2000, "h": 150 }
      }
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash", // Use 2.0 Flash for speed
    contents: [
      { inlineData: { mimeType: "image/png", data: base64 } },
      { text: prompt }
    ],
    generationConfig: { responseMimeType: "application/json" }
  });

  const cleanedText = cleanJsonString(response.text);
  const parsed = JSON.parse(cleanedText);

  return {
    header: { fileIndex: 0, coords: parsed.header },
    days: Object.keys(parsed.days).reduce((acc, key) => {
      acc[key] = { fileIndex: 0, coords: parsed.days[key] };
      return acc;
    }, {})
  };
}

async function extractDayData(ai, day, base64Image) {
  const prompt = `
  Image: Top row is Time Headers. Bottom row is ${day} Schedule.
  
  TASK: Extract data for ${day} as a JSON Array.
  RULES:
  1. Output format: [{"day": "${day}", "time": "8-9", "subject": "Math", "type": "L"}]
  2. If a box spans columns (e.g. 10-12), create entries for 10-11 AND 11-12.
  3. Include "day": "${day}" in every object.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash", 
    contents: [
      { inlineData: { mimeType: "image/png", data: base64Image } },
      { text: prompt }
    ],
    generationConfig: { responseMimeType: "application/json" }
  });

  // Return the raw cleaned string so verification can read it
  return cleanJsonString(response.text);
}

async function verifyExtraction(ai, day, base64Image, extractedJsonString) {
  const prompt = `
  Image: Timetable for ${day}.
  Extracted JSON: ${extractedJsonString}

  TASK: Check for MISSING items in the JSON compared to the image.
  Return JSON: { "valid": true } OR { "valid": false, "correction": "Missing Lab G2 in 10-11" }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      { inlineData: { mimeType: "image/png", data: base64Image } },
      { text: prompt }
    ],
    generationConfig: { responseMimeType: "application/json" }
  });

  const cleanedText = cleanJsonString(response.text);
  const result = JSON.parse(cleanedText);
  
  if (result.valid) return { hasErrors: false };
  return { hasErrors: true, correction: result.correction };
}

// --- HELPERS ---

// Helper to strip Markdown code blocks
function cleanJsonString(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

export const parseFromExtractedText = (rawText, userCoursesStr, userGroup) => {
  let allEntries = [];
  const validCourses = userCoursesStr.split(',').map(c => c.trim().toUpperCase());
  
  try {
    const matches = rawText.match(/\[.*?\]/gs);
    if (matches) {
      matches.forEach(match => {
        try {
          const dayEntries = JSON.parse(match);
          if (Array.isArray(dayEntries)) {
            allEntries = [...allEntries, ...dayEntries];
          }
        } catch (e) { console.error("JSON parse error for chunk", e); }
      });
    }
  } catch (e) {
    console.error("Global parse error", e);
    return [];
  }

  return allEntries.map(entry => ({
      day: entry.day || "Unknown",
      time: entry.time,
      subject: entry.subject,
      type: entry.type || "L"
  })).filter(item => {
    const subject = item.subject.toUpperCase();
    const isElective = validCourses.some(c => subject.includes(c));
    return isElective || subject.includes(userGroup); 
  });
};

const fileToImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const cropImage = (image, coords) => {
  const canvas = document.createElement('canvas');
  canvas.width = coords.w;
  canvas.height = coords.h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, coords.x, coords.y, coords.w, coords.h, 0, 0, coords.w, coords.h);
  
  const newImg = new Image();
  return new Promise(resolve => {
    newImg.onload = () => resolve(newImg);
    newImg.src = canvas.toDataURL();
  });
};

const stitchImages = (imgTop, imgBottom) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(imgTop.width, imgBottom.width);
  canvas.height = imgTop.height + imgBottom.height;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgTop, 0, 0);
  ctx.drawImage(imgBottom, 0, imgTop.height);
  
  return Promise.resolve(canvas.toDataURL().split(',')[1]);
};

const getBase64FromImage = (img) => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL().split(',')[1];
};