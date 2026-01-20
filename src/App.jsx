import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { parseTimetable } from './utils/geminiProcessor';
import { filterTimetable, TIME_SLOTS, DAYS } from './utils/timetableFilter';
import { Eye } from 'lucide-react';

// Components
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import TimetableView from './components/TimetableView';
import About from './components/About';
import FirstVisitPopup from './components/FirstVisitPopup';

// --- CONFIGURATION ---
const DAY_MAP = { "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5 };

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [courses, setCourses] = useState('');
  const [group, setGroup] = useState('');

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timetable, setTimetable] = useState(null);
  const [gridData, setGridData] = useState({});
  const [error, setError] = useState('');

  const [showChillPopup, setShowChillPopup] = useState(false);
  const [showFirstVisitPopup, setShowFirstVisitPopup] = useState(false);
  const [visitCount, setVisitCount] = useState(0);

  // Routing State: 'home' | 'timetable' | 'about'
  const [currentView, setCurrentView] = useState('home');

  useEffect(() => {
    // Check Date for "Chill Mode"
    const today = new Date();
    const month = today.getMonth();
    if (month === 5 || month === 6) { // June or July
      setShowChillPopup(true);
    }

    // Check First Visit
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setShowFirstVisitPopup(true);
    }

    const storedCount = localStorage.getItem('siteVisits');
    let newCount = storedCount ? parseInt(storedCount) + 1 : 1245;
    localStorage.setItem('siteVisits', newCount);
    setVisitCount(newCount);
  }, []);

  const handleCloseFirstVisit = () => {
    localStorage.setItem('hasVisited', 'true');
    setShowFirstVisitPopup(false);
  };

  // Filter timetable whenever dependencies change
  useEffect(() => {
    if (!timetable) return;
    const filteredGrid = filterTimetable(timetable, courses, group);
    setGridData(filteredGrid);
    if (currentView !== 'about') {
      setCurrentView('timetable');
    }
  }, [timetable, courses, group]);

  const handleNavigate = (view) => {
    setCurrentView(view);
    if (view === 'home') {
      setTimetable(null);
      setGridData({});
    }
  };

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
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), `Timetable_${group || 'Personalized'}.xlsx`);
  };

  const handleDownloadICS = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const month = today.getMonth();

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
      // Process slots for merging
      let i = 0;
      while (i < TIME_SLOTS.length) {
        const timeSlot = TIME_SLOTS[i];
        const cellContent = gridData[dayName]?.[timeSlot];

        if (!cellContent) {
          i++;
          continue;
        }

        // Check for merge
        let span = 1;
        while (i + span < TIME_SLOTS.length) {
          const nextTime = TIME_SLOTS[i + span];
          const nextContent = gridData[dayName]?.[nextTime];
          if (nextContent === cellContent) {
            span++;
          } else {
            break;
          }
        }

        // We have a block from index i to i+span-1 (inclusive)
        const events = cellContent.split('\n');

        events.forEach(eventText => {
          if (!eventText.trim()) return;

          const [startStr] = timeSlot.split('-');
          let startHour = parseInt(startStr);
          if (startHour >= 1 && startHour <= 6) startHour += 12; // PM adjustment logic (simple)

          const endHour = startHour + span; // Duration is simply span hours

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

          // Simple Title Extraction
          let title = "CLASS";
          const courseCodeRegex = /\b([A-Z]{1,4}[\s-]?[0-9]{1,3})\b/i;
          const match = eventText.match(courseCodeRegex);

          const userCoursesArr = courses.split(',').map(c => c.trim());
          const shortCodeMatch = userCoursesArr.find(c =>
            c.length <= 3 && new RegExp(`\\b${c}\\b`, 'i').test(eventText)
          );

          if (shortCodeMatch) {
            title = shortCodeMatch.toUpperCase();
          } else if (match) {
            title = match[0].toUpperCase().replace(/\s/, '');
          } else {
            title = eventText.split(' ')[0];
          }

          const locationDetails = eventText.replace(/\n/g, ' ').substring(0, 60);

          icsContent += "\r\n" + [
            "BEGIN:VEVENT",
            `SUMMARY:${title}`,
            `DESCRIPTION:${eventText.replace(/\n/g, ' ')}`,
            `DTSTART:${dtStart}`,
            `DTEND:${dtEnd}`,
            `RRULE:FREQ=WEEKLY;UNTIL=${recurUntil}`,
            `LOCATION:${locationDetails}`,
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

        i += span; // Skip processed slots
      }
    });

    icsContent += "\r\nEND:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    saveAs(blob, `University_Schedule_${group || 'Personalized'}.ics`);
  };

  const handleGenerate = async () => {
    if (!apiKey && files.length === 0) {
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
      else {
        setTimetable(data);
        // View updated in useEffect
      }
    } catch (error) {
      setError(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'about':
        return <About />;
      case 'timetable':
        return (
          <TimetableView
            gridData={gridData}
            handleCellEdit={handleCellEdit}
            handleDownloadExcel={handleDownloadExcel}
            handleDownloadICS={handleDownloadICS}
            onBack={() => handleNavigate('home')}
          />
        );
      case 'home':
      default:
        return (
          <LandingPage
            apiKey={apiKey} setApiKey={setApiKey}
            courses={courses} setCourses={setCourses}
            group={group} setGroup={setGroup}
            files={files} setFiles={setFiles}
            handleGenerate={handleGenerate}
            loading={loading}
            error={error}
          />
        );
    }
  };

  return (
    <>
      {showChillPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40 h-screen w-screen">
          <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-2xl mx-4 transform transition-all hover:scale-105">
            <div className="mb-6 text-6xl">🌴 🍹 🏖️</div>
            <h1 className="text-4xl font-extrabold text-[#2D3436] mb-4">Chill out Bro!</h1>
            <p className="text-xl text-gray-600 font-medium">Thoda kam padh. It's vacation time!</p>
            <p className="mt-4 text-sm text-gray-400">(Application is disabled for June/July breaks)</p>
            <button onClick={() => setShowChillPopup(false)} className="mt-8 px-6 py-2 bg-[#F2F9F3] hover:bg-[#E2F0E5] rounded-full text-[#55875F] font-semibold text-sm transition-colors border border-[#C0DCCB]">Okay, I'll relax (Close)</button>
          </div>
        </div>
      )}

      {showFirstVisitPopup && (
        <FirstVisitPopup onClose={handleCloseFirstVisit} />
      )}

      <Layout onNavigate={handleNavigate}>
        {renderContent()}
      </Layout>

      {/* Visit Counter */}
      <div className="fixed bottom-6 right-6 z-40 bg-gray-900/90 backdrop-blur text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-mono border border-gray-700">
        <Eye size={14} className="text-[#6AA374]" />
        <span>Visits: {visitCount.toLocaleString()}</span>
      </div>
    </>
  );
}