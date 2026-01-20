const TIME_SLOTS = [
  "8-9", "9-10", "10-11", "11-12", "12-1",
  "1-2", "2-3", "3-4", "4-5", "5-6"
];

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

/**
 * Filters timetable data based on user courses and group
 * @param {Array} timetable - Raw timetable data from parser
 * @param {string} courses - Comma-separated course codes (e.g., "PE302, PE304, HU302")
 * @param {string} group - User's group identifier (e.g., "G3")
 * @returns {Object} Grid data organized by day and time slot
 */
export function filterTimetable(timetable, courses, group) {
  if (!timetable || timetable.length === 0) {
    return {};
  }

  try {
    const userCourses = courses
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(Boolean);

    const userGroup = group.trim().toUpperCase();
    const newGrid = {};

    // Initialize empty grid
    DAYS.forEach(day => {
      newGrid[day] = {};
      TIME_SLOTS.forEach(time => newGrid[day][time] = "");
    });

    // Process each timetable slot
    timetable.forEach(slot => {
      const distinctClasses = slot.raw_content.split(' || ');

      const matchingClasses = distinctClasses.filter(classText => {
        const textUpper = classText.toUpperCase();
        const normalizedText = textUpper.replace(/\s+/g, '');

        // Check if class matches any user course
        const hasCourseMatch = userCourses.some(course => {
          if (course.length <= 3) {
            // For short codes like E1, E2, use word boundary matching
            const regex = new RegExp(`\\b${course}\\b`, 'i');
            return regex.test(textUpper);
          }
          // For longer codes, use contains matching
          return normalizedText.includes(course);
        });

        if (!hasCourseMatch) return false;

        // Check group matching
        // Matches G1, G2, P1, P2 etc. (case insensitive)
        const groupRegex = /(?:G|P)\s?\d+/gi;
        const groupsFound = textUpper.match(groupRegex) || [];
        // Normalize: "G 1" -> "G1", "P 2" -> "P2"
        const cleanGroups = groupsFound.map(g => g.replace(/\s+/g, ''));

        if (cleanGroups.length > 0) {
          // Strict match: User must provide specific group like "G1" or "P1"
          // We compare the normalized user group (e.g. "P1") against found groups
          const normalizedUserGroup = userGroup.replace(/\s+/g, '');
          return cleanGroups.includes(normalizedUserGroup);
        }

        // If no group specified in class, include it
        return true;
      });

      // Add matching classes to grid
      if (matchingClasses.length > 0) {
        const dayKey = slot.day.toUpperCase();
        if (newGrid[dayKey]) {
          newGrid[dayKey][slot.time] = matchingClasses.join('\n');
        }
      }
    });

    return newGrid;
  } catch (err) {
    console.error("Filtering error:", err);
    return {};
  }
}

export { TIME_SLOTS, DAYS };