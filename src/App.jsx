import React, { useState } from 'react';
import * as XLSX from 'xlsx'; // Keeping for future use
import { saveAs } from 'file-saver'; // Keeping for future use
import { parseTimetable } from './utils/geminiProcessor';
import { 
  Upload, 
  Loader2, 
  Code,
  AlertCircle,
  FileJson // New icon for JSON view
} from 'lucide-react';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  // Keeping these states for your future filtering logic
  const [courses, setCourses] = useState('PE302, PE304, HU302, E1, E2, E3');
  const [group, setGroup] = useState('G3');
  
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timetable, setTimetable] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!apiKey || files.length === 0) {
      setError("Please provide API Key and upload files");
      return;
    }
    
    setError('');
    setLoading(true);
    setTimetable(null);

    try {
      // UPDATED: Only passing apiKey and files. 
      // The filtering (courses/group) will be handled in a later step as per your request.
      const data = await parseTimetable(apiKey, files);
      
      if (!data || data.length === 0) {
        setError("No data extracted. Please check your image clarity.");
      } else {
        setTimetable(data);
      }
      
    } catch (error) {
      console.error("Generation error:", error);
      setError(`Error: ${error.message}. Check console for details.`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">🎓 AI Timetable Extractor</h1>
            <p className="text-gray-600 mt-1">Raw Data Extraction Mode</p>
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
                {/* Inputs kept for future filtering logic */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lab Group (For Future Filtering)
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Courses (For Future Filtering)
                </label>
                <input 
                  type="text" 
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
                    setTimetable(null);
                  }} 
                  className="hidden" 
                  id="file-upload"
                  accept=".png,.jpg,.jpeg,.pdf,.webp"
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <span className="text-lg font-medium text-gray-700 mb-1">
                    {files.length > 0 ? `${files.length} files selected` : "Upload Timetable Images"}
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
                    Extracting Raw Data...
                  </>
                ) : (
                  'Extract All Classes'
                )}
              </button>
            </div>

            {/* Info Panel */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h3 className="font-bold text-blue-800 mb-2 flex items-center">
                  <Code className="mr-2" size={20} /> Developer Mode
                </h3>
                <p className="text-sm text-blue-700">
                  This version extracts <strong>everything</strong> visible in the grid. 
                  The JSON below will show all classes separated by "||" if they share a slot.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* JSON Display Area */}
        {timetable && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileJson className="text-blue-600" />
                Raw Extracted JSON
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {timetable.length} entries found
              </span>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-4 overflow-hidden">
              <div className="h-[500px] overflow-auto custom-scrollbar">
                <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(timetable, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}