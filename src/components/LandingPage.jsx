import React from 'react';
import { Upload, Info } from 'lucide-react';
import ProgressBar from './ProgressBar';

const LandingPage = ({
    apiKey, setApiKey,
    courses, setCourses,
    group, setGroup,
    files, setFiles,
    handleGenerate,
    loading,
    error
}) => {

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files) {
            setFiles(Array.from(e.dataTransfer.files));
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div className="bg-[#FAF9F6] p-10 rounded-3xl shadow-xl w-full max-w-4xl border border-[#EEE] relative">
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-bold text-[#2D3436] mb-4">
                    Tame Your Semester Schedule.
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Upload your messy timetable details, and let AI craft your perfect, personalized calendar view in seconds.
                </p>
            </div>

            <div className="space-y-6">
                {/* API Key Input */}
                <div className="relative group/tooltip">
                    <input
                        type="password"
                        placeholder="Gemini API Key (Optional for Demo)"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full bg-[#F5F5F0] border border-gray-200 rounded-xl px-5 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8BBFA3] transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-help flex items-center">
                        <Info size={18} />
                        {/* Tooltip */}
                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 hidden group-hover/tooltip:block shadow-lg z-20">
                            <p className="font-bold mb-1">How to get Key:</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Go to Google AI Studio</li>
                                <li>Click "Get API Key"</li>
                                <li>Create key in new project</li>
                                <li>Copy and paste here</li>
                            </ol>
                            <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                    </div>
                </div>

                {/* Courses and Group Inputs */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-700 z-10">My Courses</span>
                        <input
                            type="text"
                            value={courses}
                            onChange={(e) => setCourses(e.target.value)}
                            placeholder="PE302, PE304, HU302, E2, E3"
                            className="w-full bg-[#F5F5F0] border border-gray-200 rounded-xl pl-28 pr-5 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8BBFA3] transition-all text-sm truncate placeholder-gray-400"
                        />
                    </div>
                    <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-700 z-10">My Groups/Labs</span>
                        <input
                            type="text"
                            value={group}
                            onChange={(e) => setGroup(e.target.value)}
                            placeholder="G2"
                            className="w-full bg-[#F5F5F0] border border-gray-200 rounded-xl pl-36 pr-5 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8BBFA3] transition-all text-sm truncate placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Drag and Drop Area */}
                <div
                    className="border-2 border-dashed border-[#C0DCCB] bg-[#F0F7F2] rounded-2xl p-10 text-center cursor-pointer transition-colors hover:bg-[#E8F3EB]"
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onClick={() => document.getElementById('file-upload').click()}
                >
                    <input
                        type="file"
                        id="file-upload"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[#55875F]">
                            <Upload size={24} />
                        </div>
                        <p className="text-gray-700 font-medium">
                            Drag & Drop your timetable file here.
                        </p>
                        <p className="text-sm text-gray-500">
                            Supports Images, or Paste text directly.
                        </p>
                        {files.length > 0 && (
                            <div className="mt-2 text-sm text-[#55875F] font-semibold">
                                {files.length} file(s) selected
                            </div>
                        )}
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-[#7CA986] hover:bg-[#6AA374] text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-[#7CA986]/30 transition-all transform active:scale-[0.99] flex justify-center items-center gap-2"
                >
                    {loading ? 'Processing...' : 'Generate My Timetable ✨'}
                </button>

                {loading && (
                    <div className="mt-4">
                        <ProgressBar />
                    </div>
                )}

                {error && (
                    <div className="text-center text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LandingPage;
