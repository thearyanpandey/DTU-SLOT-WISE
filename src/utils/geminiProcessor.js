import { GoogleGenAI } from "@google/genai";

export const generateTimetable = async (apiKey, files, userCourses, userGroup) => {
  const ai = new GoogleGenAI({ apiKey });

  // Convert files to base64
  const fileParts = await Promise.all(
    files.map(async (file) => ({
      inlineData: {
        mimeType: file.type,
        data: await fileToBase64(file),
      },
    }))
  );

    const prompt = `
  You are a University Timetable Parser. 
  
  **User Profile:**
  - Selected Courses: ${userCourses}
  - Lab Group: ${userGroup}
  
  **Task:**
  Analyze the attached timetable images (Main Timetable and Elective Timetable).
  Generate a personalized weekly schedule JSON for this specific user.
  
  **Rules:**
  1. **Course Filtering:** Only include classes that match the "Selected Courses".
  2. **Lab Group Filtering:** - If a class is a Lab/Practical (usually marked "P" or "Lab"), check the Group (G1, G2, G3).
     - ONLY include the lab if the group matches "${userGroup}".
     - If the text says "G1, G2" and user is G3, EXCLUDE it.
     - If the text says "G3" or "All Groups", INCLUDE it.
  3. **Electives:**
     - Identify slots for Electives (E1, E2, ... E6).
     - Only include the Elective code if it is in the "Selected Courses" list.
  4. **Structure:**
     - Return a clean JSON array of objects. Each object represents a class slot.
     - Keys: "day" (MON, TUE...), "time" (e.g., "8-9", "9-10"), "subject", "type" (L/P), "room" (optional).
  
  **Conflict Resolution:**
  - If Main Timetable and Elective Timetable have a class at the same time, prefer the specific Course Code over a generic "E" code.
  
  Output the JSON strictly.
  `;

  const contents = [
    ...fileParts,
    { text: prompt }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    generationConfig: { 
      responseMimeType: "application/json" 
    }
  });

  return JSON.parse(response.text);
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
};