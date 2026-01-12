import React, { useState } from 'react';
import { generateTimetable } from './utils/geminiProcessor';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [courses, setCourses] = useState('PE302, PE304, HU302, E1, E2, E3');
  const [group, setGroup] = useState('G3');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timetable, setTimetable] = useState(null);

  const handleGenerate = async () => {
    if (!apiKey || files.length === 0) return alert("Please provide API Key and upload files");
    
    setLoading(true);
    try {
      const data = await generateTimetable(apiKey, files, courses, group);
      setTimetable(data);
    } catch (error) {
      console.error(error);
      alert("Error generating timetable. Check console details.");
    }
    setLoading(false);
  };

  const downloadExcel = () => {
    if (!timetable) return;

    // Transform JSON to Excel Grid format
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    const times = ['8-9', '9-10', '10-11', '11-12', '12-1', '1-2', '2-3', '3-4', '4-5', '5-6'];
    
    const excelData = times.map(time => {
      const row = { Time: time };
      days.forEach(day => {
        const slot = timetable.find(t => t.day === day && t.time === time);
        row[day] = slot ? `${slot.subject} (${slot.type})` : '';
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timetable");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `${group}_Timetable.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-blue-600">🎓 AI Timetable Generator</h1>
        
        {/* Input Section */}
        <div className="space-y-4 mb-6">
          <input 
            type="password" 
            placeholder="Enter Gemini API Key" 
            className="w-full p-2 border rounded"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Courses (e.g. PE302, E1)" 
              className="p-2 border rounded"
              value={courses}
              onChange={(e) => setCourses(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Group (e.g. G3)" 
              className="p-2 border rounded"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            />
          </div>

          <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center cursor-pointer hover:bg-gray-50">
            <input 
              type="file" 
              multiple 
              onChange={(e) => setFiles(Array.from(e.target.files))} 
              className="hidden" 
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">
                {files.length > 0 ? `${files.length} files selected` : "Upload Timetable Images (Main & Elective)"}
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <button 
          onClick={handleGenerate} 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 flex justify-center items-center"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Generate Timetable"}
        </button>

        {/* Results Preview */}
        {timetable && (
          <div className="mt-8">
            <h3 className="font-bold mb-3">Preview:</h3>
            <div className="bg-gray-100 p-4 rounded-lg h-64 overflow-auto text-xs font-mono">
              {JSON.stringify(timetable, null, 2)}
            </div>
            <button 
              onClick={downloadExcel} 
              className="w-full mt-4 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 flex justify-center items-center gap-2"
            >
              <FileSpreadsheet size={20} /> Download Excel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}