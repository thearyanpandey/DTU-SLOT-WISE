import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { parseTimetable } from './utils/geminiProcessor';
import { 
  Upload, Loader2, Edit3, Calendar, Download, Eye 
} from 'lucide-react';

// --- CONFIGURATION ---
const TIME_SLOTS = [
  "8-9", "9-10", "10-11", "11-12", "12-1", 
  "1-2", "2-3", "3-4", "4-5", "5-6"
];
const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const DAY_MAP = { "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5 };

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [courses, setCourses] = useState('PE302, PE304, HU302, E2, E3');
  const [group, setGroup] = useState('G3');
  
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timetable, setTimetable] = useState(null); 
  const [gridData, setGridData] = useState({}); 
  const [error, setError] = useState('');
  
  const [showChillPopup, setShowChillPopup] = useState(false);
  const [visitCount, setVisitCount] = useState(1245); 

  useEffect(() => {
    // Check Date for "Chill Mode"
    const today = new Date();
    const month = today.getMonth(); 
    if (month === 5 || month === 6) {
      setShowChillPopup(true);
    }
    const storedCount = localStorage.getItem('siteVisits');
    let newCount = storedCount ? parseInt(storedCount) + 1 : 1245;
    localStorage.setItem('siteVisits', newCount);
    setVisitCount(newCount);
  }, []);

  useEffect(() => {
    if (!timetable) return;
    try {
      const userCourses = courses.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
      const userGroup = group.trim().toUpperCase();
      const newGrid = {};

      DAYS.forEach(day => {
        newGrid[day] = {};
        TIME_SLOTS.forEach(time => newGrid[day][time] = "");
      });

      timetable.forEach(slot => {
        const distinctClasses = slot.raw_content.split(' || ');
        const matchingClasses = distinctClasses.filter(classText => {
          const textUpper = classText.toUpperCase();
          const normalizedText = textUpper.replace(/\s+/g, '');
          
          const hasCourseMatch = userCourses.some(course => {
             if (course.length <= 3) {
                const regex = new RegExp(`\\b${course}\\b`, 'i');
                return regex.test(textUpper);
             }
             return normalizedText.includes(course);
          });

          if (!hasCourseMatch) return false;

          const groupRegex = /G\s?\d/g; 
          const groupsFound = textUpper.match(groupRegex) || [];
          const cleanGroups = groupsFound.map(g => g.replace(/\s/, ''));

          if (cleanGroups.length > 0) {
            const userGroupNum = userGroup.replace(/\D/g, ''); 
            return cleanGroups.some(g => g.includes(userGroupNum));
          }
          return true; 
        });

        if (matchingClasses.length > 0) {
          const dayKey = slot.day.toUpperCase();
          if (newGrid[dayKey]) newGrid[dayKey][slot.time] = matchingClasses.join('\n');
        }
      });
      setGridData(newGrid);
    } catch (err) {
      console.error("Filtering error", err);
    }
  }, [timetable, courses, group]);

  const handleCellEdit = (day, time, value) => {
    setGridData(prev => ({
      ...prev,
      [day]: { ...prev[day], [time]: value }
    }));
  };

  const handleDownloadExcel = () => {
    const wsData = [["Day / Time", ...TIME_SLOTS]];
    DAYS.forEach(day => {
      const row = [day];
      TIME_SLOTS.forEach(time => row.push(gridData[day]?.[time] || ""));
      wsData.push(row);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timetable");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], {type: 'application/octet-stream'}), `Timetable_${group}.xlsx`);
  };

  // --- UPDATED ICS GENERATION LOGIC ---
  const handleDownloadICS = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const month = today.getMonth(); 
    
    // 1. Calculate Recurrence End Date (Floating Time)
    let recurUntil;
    if (month >= 0 && month <= 4) {
      recurUntil = `${currentYear}0501T235959`; 
    } else if (month >= 7 && month <= 11) {
      recurUntil = `${currentYear}1201T235959`; 
    } else {
      recurUntil = `${currentYear}1201T235959`; 
    }

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//TimetableExtractor//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH"
    ].join("\r\n");

    const formatLocalTime = (date) => {
      const pad = (n) => n < 10 ? '0' + n : n;
      return (
        date.getFullYear() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        'T' +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds())
      );
    };

    DAYS.forEach(dayName => {
      TIME_SLOTS.forEach(timeSlot => {
        const cellContent = gridData[dayName]?.[timeSlot];
        if (!cellContent) return;

        const events = cellContent.split('\n');
        
        events.forEach(eventText => {
          if (!eventText.trim()) return;

          // 2. Parse Start Hour
          const [startStr] = timeSlot.split('-');
          let startHour = parseInt(startStr);
          if (startHour >= 1 && startHour <= 6) startHour += 12;
          
          const endHour = startHour + 1;

          // 3. Find Next Occurrence
          const targetDayIndex = DAY_MAP[dayName];
          const nextDate = new Date();
          const currentDayIndex = nextDate.getDay(); 
          
          let daysUntil = targetDayIndex - currentDayIndex;
          if (daysUntil < 0) daysUntil += 7;
          
          nextDate.setDate(nextDate.getDate() + daysUntil);
          nextDate.setHours(startHour, 0, 0, 0);

          const dtStart = formatLocalTime(nextDate);
          
          const endDate = new Date(nextDate);
          endDate.setHours(endHour, 0, 0, 0);
          const dtEnd = formatLocalTime(endDate);

          // 4. IMPROVED Title Extraction
          // Regex looks for patterns like: ME302, ME 302, HU-302, E1, E2
          // Matches: Word characters 1-4 length, optional space/dash, digits 1-3 length
          const courseCodeRegex = /\b([A-Z]{1,4}[\s-]?[0-9]{1,3})\b/i;
          const match = eventText.match(courseCodeRegex);

          // Priority 1: Regex Match (e.g. "ME 302")
          // Priority 2: User Input Match (e.g. "E1")
          // Priority 3: First Word
          let title = "CLASS";
          
          // Check for short codes (E1, E2) from user input explicitly first (Regex can struggle with 2-char words)
          const userCoursesArr = courses.split(',').map(c => c.trim());
          const shortCodeMatch = userCoursesArr.find(c => 
            c.length <= 3 && new RegExp(`\\b${c}\\b`, 'i').test(eventText)
          );

          if (shortCodeMatch) {
            title = shortCodeMatch.toUpperCase();
          } else if (match) {
            title = match[0].toUpperCase().replace(/\s/, ''); // Normalize "ME 302" -> "ME302"
          } else {
             // Fallback: If starts with P/L, try to grab the next word
             const parts = eventText.split(' ');
             if ((parts[0] === 'P' || parts[0] === 'L') && parts[1]) {
                title = parts[1];
             } else {
                title = parts[0];
             }
          }

          // 5. IMPROVED Location (Use full details)
          // We clean up newlines to make it safe for ICS single-line field
          const locationDetails = eventText.replace(/\n/g, ' ').substring(0, 60); // Truncate slightly if too long

          icsContent += "\r\n" + [
            "BEGIN:VEVENT",
            `SUMMARY:${title}`,
            `DESCRIPTION:${eventText.replace(/\n/g, ' ')}`,
            `DTSTART:${dtStart}`,
            `DTEND:${dtEnd}`,
            `RRULE:FREQ=WEEKLY;UNTIL=${recurUntil}`,
            `LOCATION:${locationDetails}`, // UPDATED: Shows class details
            "STATUS:CONFIRMED",
            "SEQUENCE:0",
            "BEGIN:VALARM",
            "TRIGGER:-PT10M",
            "DESCRIPTION:Reminder",
            "ACTION:DISPLAY",
            "END:VALARM",
            "END:VEVENT"
          ].join("\r\n");
        });
      });
    });

    icsContent += "\r\nEND:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    saveAs(blob, `University_Schedule_${group}.ics`);
  };

  const handleGenerate = async () => {
    if (!apiKey || files.length === 0) {
      setError("Please provide API Key and upload files");
      return;
    }
    setError('');
    setLoading(true);
    setTimetable(null);
    setGridData({});

    try {
      const data = await parseTimetable(apiKey, files);
      if (!data || data.length === 0) setError("No data extracted.");
      else setTimetable(data);
    } catch (error) {
      setError(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans relative">
      
      {showChillPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40 h-screen w-screen">
          <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-2xl mx-4 transform transition-all hover:scale-105">
            <div className="mb-6 text-6xl">🌴 🍹 🏖️</div>
            <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Chill out Bro!</h1>
            <p className="text-xl text-gray-600 font-medium">Thoda kam padh. It's vacation time!</p>
            <p className="mt-4 text-sm text-gray-400">(Application is disabled for June/July breaks)</p>
            <button onClick={() => setShowChillPopup(false)} className="mt-8 px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-700 font-semibold text-sm transition-colors">Okay, I'll relax (Close)</button>
          </div>
        </div>
      )}

      <div className={`max-w-[95%] mx-auto transition-all ${showChillPopup ? 'blur-lg pointer-events-none' : ''}`}>
        
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-l-4 border-blue-600">
          <div className="flex justify-between items-start mb-4">
             <div>
               <h1 className="text-2xl font-bold text-gray-800">🎓 University Timetable Manager</h1>
               <p className="text-sm text-gray-500 mt-1">Upload images - Extract - Export</p>
             </div>
             <div className="text-right hidden sm:block">
               <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">v2.3 Smart ICS</span>
             </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-end">
             <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">API Key</label>
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
             </div>
             <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Courses</label>
                <input type="text" value={courses} onChange={(e) => setCourses(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
             </div>
             <div className="w-28">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Group</label>
                <input type="text" value={group} onChange={(e) => setGroup(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
             </div>
             
             <div className="flex gap-2">
                <label className="cursor-pointer bg-white hover:bg-gray-50 text-gray-700 p-2.5 rounded-lg border border-gray-300 shadow-sm flex items-center gap-2 transition-all">
                  <Upload size={18} className="text-gray-500" />
                  <span className="text-sm font-medium">Upload</span>
                  <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files))} />
                </label>

                <button onClick={handleGenerate} disabled={loading} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-md disabled:opacity-70 transition-all transform active:scale-95">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Process Timetable'}
                </button>
             </div>
          </div>
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 text-sm"><span className="mr-2">⚠️</span> {error}</div>}
        </div>

        {Object.keys(gridData).length > 0 && (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 mb-20">
            <div className="p-4 border-b bg-gray-50 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Edit3 size={18} className="text-blue-600" />
                <span className="font-semibold">Live Editor</span>
              </div>
              <div className="flex gap-3">
                <button onClick={handleDownloadExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm font-medium transition-colors">
                  <Download size={16} /> Excel (.xlsx)
                </button>
                <button onClick={handleDownloadICS} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm font-medium transition-colors">
                  <Calendar size={16} /> Calendar (.ics)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 bg-gray-100 border-b border-r border-gray-200 w-24 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 z-10">Day / Time</th>
                    {TIME_SLOTS.map(time => <th key={time} className="p-3 bg-gray-50 border-b border-r border-gray-200 min-w-[140px] text-xs font-bold text-gray-600 uppercase">{time}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {DAYS.map(day => (
                    <tr key={day} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 bg-white border-r border-gray-200 font-bold text-gray-700 text-sm sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{day}</td>
                      {TIME_SLOTS.map(time => (
                        <td key={`${day}-${time}`} className="p-0 border-r border-gray-100 relative group min-h-[100px]">
                          <textarea
                            value={gridData[day]?.[time] || ''}
                            onChange={(e) => handleCellEdit(day, time, e.target.value)}
                            className={`w-full h-28 p-3 text-sm resize-none outline-none transition-all ${gridData[day]?.[time] ? 'bg-orange-50/50 text-gray-900 font-medium' : 'bg-white text-gray-400 focus:bg-gray-50'} focus:ring-2 focus:ring-inset focus:ring-blue-500/50`}
                            placeholder="-"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-40 bg-gray-900/90 backdrop-blur text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-mono border border-gray-700">
        <Eye size={14} className="text-green-400" />
        <span>Visits: {visitCount.toLocaleString()}</span>
      </div>

    </div>
  );
}