import React from 'react';

const About = () => {
    return (
        <div className="w-full max-w-4xl mx-auto p-8 bg-white/50 backdrop-blur-sm rounded-3xl shadow-sm">
            <h1 className="text-3xl font-bold text-[#2D3436] mb-6">How to Use UniFlow</h1>

            <div className="space-y-6 text-[#2D3436]">
                {/* Quick Steps */}
                <section>
                    <ul className="list-disc pl-5 space-y-2 text-gray-700 font-medium">
                        <li>Upload your <strong>Main Timetable</strong> and <strong>Elective Timetable</strong> images.</li>
                        <li>Enter your details below and click Generate.</li>
                    </ul>
                </section>

                {/* Input Warning */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                    <h3 className="font-bold text-blue-700 mb-1">⚠️ Important: Course Codes Only</h3>
                    <p className="text-blue-800 text-sm">
                        Please enter <strong>Subject Codes</strong> (e.g., <code className="bg-blue-100 px-1 rounded">PE302</code>, <code className="bg-blue-100 px-1 rounded">HU302</code>).<br />
                        Do <span className="underline">not</span> write the full subject name.
                    </p>
                </div>

                {/* Calendar Highlight */}
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl" role="img" aria-label="phone">📱</span>
                        <div>
                            <h3 className="font-bold text-amber-800 mb-1">Google Calendar Sync</h3>
                            <p className="text-amber-900 text-sm leading-relaxed">
                                When the calendar file downloads, <strong>share it to your phone</strong> first.
                                <br />
                                You will only see the <span className="inline-block bg-amber-200 px-2 py-0.5 rounded mx-1 font-bold text-amber-900 border border-amber-300">Add to Calendar</span> button when opening the file on a mobile device.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;