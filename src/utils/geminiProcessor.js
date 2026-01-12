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
    CRITICAL: Return PURE JSON only.

    USER CONTEXT:
    - Selected Courses: ${userCourses}
    - Lab Group: ${userGroup}

    TASK: Extract elective timetable (TABLE 2 format)

    INPUT: Simple table with:
    - Days: MON, TUE, WED, THU, FRI
    - Times: 8-9, 9-10, etc.
    - Each cell: Elective code ("E1", "E2", ... "E6") or "Core" or empty

    EXTRACTION:
    - For each cell:
    - If contains "E1", "E2", ..., "E6" → extract that code
    - If "Core" → ignore (skip)
    - Empty → skip

    FILTERING:
    - ONLY include elective slots where the elective code (E1-E6) corresponds to a course in [${userCourses}]
    - If a course code in selected courses starts with or maps to an elective (e.g., course "CS401" is listed as "E1"), include that elective slot

    OUTPUT: JSON array:
    [
    {"day": "MON", "time": "8-9", "elective_code": "E1"},
    {"day": "MON", "time": "9-10", "elective_code": "E1"},
    // ... only for elective slots matching user's selected courses
    ]

    IMPORTANT:
    - Return all elective slots first, filtering will be done in post-processing
    - Preserve exact elective codes (E1, E2, etc.)
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