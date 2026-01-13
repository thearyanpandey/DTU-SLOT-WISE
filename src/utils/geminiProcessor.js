import { GoogleGenAI } from "@google/genai";

export const parseTimetable = async (apiKey, files, userCourses, userGroup) => {
  // Combine all files into one extraction
  const allText = await extractAllText(apiKey, files);
  
  // Parse using specialized parser for your university format
  const timetable = parseUniversityTimetable(allText, userCourses, userGroup);
  
  return timetable;
};

const extractAllText = async (apiKey, files) => {
  const ai = new GoogleGenAI({ apiKey });
  let allText = '';
  
  for (const file of files) {
    const base64 = await fileToBase64(file);
    
    const prompt = `
    Extract ALL text from this timetable image EXACTLY as it appears.
    Preserve the spatial layout as much as possible.
    Return the text in this format:
    
    DAY: [Day Name]
    8-9: [content for 8-9 slot]
    9-10: [content for 9-10 slot]
    10-11: [content for 10-11 slot]
    11-12: [content for 11-12 slot]
    12-1: [content for 12-1 slot]
    1-2: [content for 1-2 slot]
    2-3: [content for 2-3 slot]
    3-4: [content for 3-4 slot]
    4-5: [content for 4-5 slot]
    5-6: [content for 5-6 slot]
    
    For example:
    DAY: MON
    8-9: E1
    9-10: L PE308 GET PROF.N AVEEN KR TW4FF2
    10-11: P PE302 CNC & ROBOTICS LAB G1 MUKESH S D
    
    Continue for all days (MON, TUE, WED, THU, FRI).
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: file.type,
            data: base64,
          },
        },
        { text: prompt }
      ]
    });
    
    allText += response.text + '\n\n';
  }
  
  return allText;
};

const parseUniversityTimetable = (text, userCourses, userGroup) => {
  const courses = userCourses.split(',').map(c => c.trim().toUpperCase());
  const groupPattern = new RegExp(`\\b${userGroup}\\b`, 'i');
  
  const timetable = [];
  const lines = text.split('\n');
  let currentDay = '';
  
  // Time slots in order
  const timeSlots = ['8-9', '9-10', '10-11', '11-12', '12-1', 
                    '1-2', '2-3', '3-4', '4-5', '5-6'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect day
    if (line.startsWith('DAY:')) {
      currentDay = line.replace('DAY:', '').trim().toUpperCase();
      continue;
    }
    
    // Parse time slot
    for (const time of timeSlots) {
      if (line.startsWith(`${time}:`)) {
        const content = line.replace(`${time}:`, '').trim();
        
        if (!content || content === '—' || content === '--') {
          continue; // Skip empty slots
        }
        
        // Parse multiple courses in one cell
        const entries = splitCellContent(content);
        
        for (const entry of entries) {
          // Extract course code
          const courseCode = extractCourseCode(entry);
          
          if (!courseCode) continue;
          
          // Check if user selected this course
          const isSelected = courses.includes(courseCode) || 
                           (courseCode.startsWith('E') && courses.includes(courseCode));
          
          if (!isSelected) continue;
          
          // Check for lab group
          if (isLabOrPractical(entry)) {
            if (!groupPattern.test(entry)) {
              continue; // Skip if wrong group
            }
          }
          
          // Determine type
          const type = determineType(entry);
          
          timetable.push({
            day: currentDay,
            time: time,
            subject: courseCode,
            type: type,
            raw: entry // Keep for debugging
          });
        }
        
        break;
      }
    }
  }
  
  return timetable;
};

// Split cell content into separate course entries
const splitCellContent = (content) => {
  const entries = [];
  const lines = content.split('\n');
  let currentEntry = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Start new entry if line starts with course pattern
    if (trimmed.match(/^(L|P|T|E\d|PE\d|HU\d|XX)/) && currentEntry.length > 0) {
      entries.push(currentEntry.join(' '));
      currentEntry = [trimmed];
    } else {
      currentEntry.push(trimmed);
    }
  }
  
  // Add last entry
  if (currentEntry.length > 0) {
    entries.push(currentEntry.join(' '));
  }
  
  return entries;
};

// Extract course code from entry
const extractCourseCode = (entry) => {
  // Patterns for course codes
  const patterns = [
    /(?:L|P|T|)\s*(E[1-6])\b/i,
    /(?:L|P|T|)\s*(PE\d{3})\b/i,
    /(?:L|P|T|)\s*(HU\d{3})\b/i,
    /\b(E[1-6])\b/i,
    /\b(PE\d{3})\b/i,
    /\b(HU\d{3})\b/i,
    /\b(XX)\b/i
  ];
  
  for (const pattern of patterns) {
    const match = entry.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  
  return null;
};

// Check if entry is lab/practical
const isLabOrPractical = (entry) => {
  return entry.toLowerCase().includes('lab') || 
         entry.toLowerCase().includes('practical') ||
         entry.startsWith('P ');
};

// Determine class type
const determineType = (entry) => {
  if (entry.startsWith('L ') || entry.toLowerCase().includes('lecture')) return 'L';
  if (entry.startsWith('P ') || entry.toLowerCase().includes('lab') || 
      entry.toLowerCase().includes('practical')) return 'P';
  if (entry.startsWith('T ')) return 'T';
  return 'L'; // Default to Lecture
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

// Direct parsing from extracted text (alternative method)
export const parseFromExtractedText = (extractedText, userCourses, userGroup) => {
  const timetable = [];
  const courses = userCourses.split(',').map(c => c.trim().toUpperCase());
  const groupPattern = new RegExp(`\\b${userGroup}\\b`, 'i');
  
  // Parse the exact text format you showed in the screenshot
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const timeSlots = ['8-9', '9-10', '10-11', '11-12', '12-1', 
                    '1-2', '2-3', '3-4', '4-5', '5-6'];
  
  const lines = extractedText.split('\n');
  
  // Find where each day's content starts
  let currentDay = '';
  let inDaySection = false;
  let timeSlotIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for day headers like "**MON Row:**"
    for (const day of days) {
      if (line.includes(`${day} Row:`)) {
        currentDay = day;
        inDaySection = true;
        timeSlotIndex = 0;
        continue;
      }
    }
    
    if (!inDaySection) continue;
    
    // If we're in a day section and hit an empty line or next day, reset
    if (line === '' || line.includes('Row:')) {
      inDaySection = false;
      continue;
    }
    
    // Process content lines
    if (currentDay && timeSlotIndex >= 0 && timeSlotIndex < timeSlots.length) {
      const time = timeSlots[timeSlotIndex];
      const content = line;
      
      if (content && content !== 'XX') {
        // Extract courses from this line
        const courseMatches = extractCoursesFromText(content, courses, groupPattern);
        
        courseMatches.forEach(course => {
          timetable.push({
            day: currentDay,
            time: time,
            subject: course.code,
            type: course.type,
            room: course.room || ''
          });
        });
      }
      
      timeSlotIndex++;
    }
  }
  
  return timetable;
};

// Helper function to extract courses from text
const extractCoursesFromText = (text, courses, groupPattern) => {
  const foundCourses = [];
  
  // Split by common separators
  const segments = text.split(/\s{2,}|\n/).filter(s => s.trim());
  
  for (const segment of segments) {
    // Look for course codes
    const codeMatch = segment.match(/\b(PE\d{3}|HU\d{3}|E[1-6]|XX)\b/i);
    if (!codeMatch) continue;
    
    const courseCode = codeMatch[0].toUpperCase();
    
    // Check if user selected this course
    if (!courses.includes(courseCode) && !courseCode.startsWith('E')) {
      continue;
    }
    
    // Check for lab groups
    if (segment.toLowerCase().includes('lab')) {
      if (!groupPattern.test(segment)) {
        continue;
      }
    }
    
    // Determine type
    let type = 'L';
    if (segment.startsWith('P ') || segment.toLowerCase().includes('lab')) {
      type = 'P';
    } else if (segment.startsWith('T ')) {
      type = 'T';
    }
    
    // Extract room if available
    const roomMatch = segment.match(/(TW\d+[A-Z]\d+|ROOM\s+\w+)/i);
    
    foundCourses.push({
      code: courseCode,
      type: type,
      room: roomMatch ? roomMatch[0] : ''
    });
  }
  
  return foundCourses;
};