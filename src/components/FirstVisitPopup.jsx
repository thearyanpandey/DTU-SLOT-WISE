import React from 'react';
import { ExternalLink, Check, Key } from 'lucide-react';

export default function FirstVisitPopup({ onClose }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-md bg-black/40 h-screen w-screen animate-in fade-in duration-300">
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-lg mx-4 transform transition-all scale-100 border border-gray-100">
                <div className="mb-6 flex justify-center">
                    <div className="bg-[#F2F9F3] p-4 rounded-full">
                        <Key className="w-8 h-8 text-[#55875F]" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-[#2D3436] mb-3">
                    Welcome to DTU Slot Wise!
                </h2>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    To generate your timetable, this application requires a Google Gemini API Key. Do you have one ready?
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-[#55875F] hover:bg-[#446e4c] text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        <Check size={18} />
                        Yes, I have it
                    </button>

                    <a
                        href="https://aistudio.google.com/app/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-white hover:bg-gray-50 text-[#55875F] border-2 border-[#E8F3EB] rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group"
                    >
                        No, get API key
                        <ExternalLink size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </a>
                </div>

                <p className="mt-6 text-xs text-gray-400">
                    We don't store your keys on our servers. They are used locally in your browser.
                </p>
            </div>
        </div>
    );
}
