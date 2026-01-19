
export const filterTimetable = (rawTimetable, userCoursesStr, userGroup) => {
  
  const selectedCourses = userCoursesStr
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(c => c !== ''); 

  const myGroup = userGroup.trim().toUpperCase();

  
    const findGroupInText = (text) => {
    const match = text.match(/\b(G[1-9])\b/i); 
    return match ? match[1].toUpperCase() : null;
  };

  // 2. Process the Timetable
  const filteredSlots = [];

  rawTimetable.forEach(slot => {
   
    const items = slot.raw_content.split('||'); 
    
    const keptItems = items.filter(item => {
      const upperItem = item.toUpperCase();

      
      const hasCourse = selectedCourses.some(course => {
        
        return upperItem.includes(course);
      });

      if (!hasCourse) return false;

      
      const detectedGroup = findGroupInText(upperItem);
      
      if (detectedGroup) {
       
        return detectedGroup === myGroup;
      }
    
      return true;
    });

    
    if (keptItems.length > 0) {
      filteredSlots.push({
        day: slot.day,
        time: slot.time,
        
        content: keptItems.join(' / ').trim() 
      });
    }
  });

  return filteredSlots;
};