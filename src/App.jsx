import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from "@google/genai";
import { saveAs } from 'file-saver';
import { parseTimetable, parseFromExtractedText } from './utils/geminiProcessor';
import ManualCorrection from './ManualCorrection';
import { 
  Upload, 
  FileSpreadsheet, 
  Loader2, 
  Eye, 
  Download, 
  RefreshCw,
  AlertCircle 
} from 'lucide-react';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [courses, setCourses] = useState('PE302, PE304, HU302, E1, E2, E4');
  const [group, setGroup] = useState('G3');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timetable, setTimetable] = useState(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!apiKey || files.length === 0) {
      setError("Please provide API Key and upload files");
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      // Method 1: Use the main parser
      const data = await parseTimetable(apiKey, files, courses, group);
      setTimetable(data);
      
      // Also extract raw text for debugging
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const base64 = await fileToBase64(files[0]);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: files[0].type,
              data: base64,
            },
          },
          { text: "Extract all text exactly as shown, preserving line breaks and layout:" }
        ]
      });
      setExtractedText(response.text);
      
    } catch (error) {
      console.error("Generation error:", error);
      setError(`Error: ${error.message}. Check console for details.`);
    }
    setLoading(false);
  };

  // Alternative: Parse directly from extracted text
  const parseFromText = () => {
    if (!extractedText) {
      setError("No extracted text available");
      return;
    }
    
    try {
      const data = parseFromExtractedText(extractedText, courses, group);
      setTimetable(data);
      setError('');
    } catch (error) {
      console.error("Parse error:", error);
      setError(`Parse error: ${error.message}`);
    }
  };

  const handleManualSave = (correctedTimetable) => {
    setTimetable(correctedTimetable);
    setShowCorrection(false);
  };

  const downloadExcel = () => {
    if (!timetable || timetable.length === 0) {
      setError("No timetable data to download");
      return;
    }

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    const times = ['8-9', '9-10', '10-11', '11-12', '12-1', 
                   '1-2', '2-3', '3-4', '4-5', '5-6'];
    
    const excelData = times.map(time => {
      const row = { Time: time };
      days.forEach(day => {
        const slots = timetable.filter(t => t.day === day && t.time === time);
        if (slots.length > 0) {
          row[day] = slots.map(s => `${s.subject} (${s.type})`).join(' / ');
        } else {
          row[day] = '';
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timetable");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    saveAs(data, `${group}_Timetable.xlsx`);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🎓 AI Timetable Generator</h1>
              <p className="text-gray-600 mt-1">Upload your timetable images and get personalized schedule</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => setDebugMode(!debugMode)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                {debugMode ? 'Hide Debug' : 'Show Debug'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-700 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Input Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gemini API Key
                  </label>
                  <input 
                    type="password" 
                    placeholder="Enter your Gemini API key" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lab Group
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g., G3" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selected Courses (comma-separated)
                </label>
                <input 
                  type="text" 
                  placeholder="PE302, PE304, HU302, E1, E5" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={courses}
                  onChange={(e) => setCourses(e.target.value)}
                />
              </div>

              <div className="border-3 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <input 
                  type="file" 
                  multiple 
                  onChange={(e) => {
                    setFiles(Array.from(e.target.files));
                    setError('');
                  }} 
                  className="hidden" 
                  id="file-upload"
                  accept=".png,.jpg,.jpeg,.pdf"
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <span className="text-lg font-medium text-gray-700 mb-1">
                    {files.length > 0 ? `${files.length} files selected` : "Upload Timetable Images"}
                  </span>
                  <span className="text-sm text-gray-500">
                    Upload main timetable and elective timetable (PDF or images)
                  </span>
                </label>
              </div>

              <button 
                onClick={handleGenerate} 
                disabled={loading || !apiKey || files.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 font-medium text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Processing Timetable...
                  </>
                ) : (
                  'Generate Timetable'
                )}
              </button>
            </div>

            {/* Preview Panel */}
            <div className="space-y-4">
              {timetable && timetable.length > 0 && !showCorrection && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                  <h3 className="font-bold text-green-800 mb-3 flex items-center">
                    <Eye className="mr-2" /> Timetable Ready!
                  </h3>
                  <div className="mb-4">
                    <p className="text-sm text-green-700">
                      Found <span className="font-bold">{timetable.length}</span> classes
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowCorrection(true)}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-3 rounded-lg hover:from-yellow-600 hover:to-yellow-700 flex justify-center items-center gap-2 mb-3"
                  >
                    <RefreshCw size={18} /> Review & Edit
                  </button>
                  <button 
                    onClick={downloadExcel} 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-lg hover:from-green-700 hover:to-emerald-700 flex justify-center items-center gap-2"
                  >
                    <FileSpreadsheet size={18} /> Download Excel
                  </button>
                </div>
              )}

              {extractedText && debugMode && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="font-medium text-gray-700 mb-2">Extracted Text Preview</h4>
                  <div className="text-xs text-gray-600 bg-gray-900 text-green-400 p-3 rounded-lg h-40 overflow-auto font-mono">
                    <pre>{extractedText.substring(0, 500)}...</pre>
                  </div>
                  <button 
                    onClick={parseFromText}
                    className="w-full mt-3 text-sm bg-gray-200 hover:bg-gray-300 p-2 rounded-lg"
                  >
                    Parse From This Text
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manual Correction Interface */}
        {showCorrection && (
          <div className="mb-6">
            <ManualCorrection 
              initialTimetable={timetable}
              onSave={handleManualSave}
            />
          </div>
        )}

        {/* Timetable Preview */}
        {timetable && timetable.length > 0 && !showCorrection && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Generated Timetable Preview</h2>
              <button
                onClick={downloadExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download size={18} /> Download
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 font-medium text-gray-700">Time</th>
                    {['MON', 'TUE', 'WED', 'THU', 'FRI'].map(day => (
                      <th key={day} className="border p-3 font-medium text-gray-700">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['8-9', '9-10', '10-11', '11-12', '12-1', '1-2', '2-3', '3-4', '4-5', '5-6'].map(time => (
                    <tr key={time}>
                      <td className="border p-3 font-medium bg-gray-50">{time}</td>
                      {['MON', 'TUE', 'WED', 'THU', 'FRI'].map(day => {
                        const slots = timetable.filter(t => t.day === day && t.time === time);
                        return (
                          <td key={`${day}-${time}`} className="border p-3">
                            {slots.length > 0 ? (
                              <div className="space-y-1">
                                {slots.map((slot, idx) => (
                                  <div key={idx} className={`p-2 rounded ${slot.type === 'P' ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-800'}`}>
                                    <div className="font-medium">{slot.subject}</div>
                                    <div className="text-xs opacity-75">{slot.type === 'P' ? 'Lab' : 'Lecture'}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-center py-2">—</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-blue-800">
                    Found {timetable.length} classes. Review and edit if needed before downloading.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
};