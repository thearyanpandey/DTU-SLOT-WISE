import React, { useState, useEffect } from 'react';

const MESSAGES = [
    "Crunching the numbers...",
    "Deciphering your schedule...",
    "Consulting the AI oracles...",
    "Organizing chaos into calculus...",
    "Formatting pixels...",
    "Almost there...",
    "Generating calendar magic...",
    "Aligning the stars (and classes)..."
];

const ProgressBar = () => {
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState(MESSAGES[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((oldProgress) => {
                if (oldProgress >= 90) return 90; // Stall at 90% until done
                const diff = Math.random() * 10;
                return oldProgress + diff;
            });
        }, 500);

        const msgInterval = setInterval(() => {
            setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
        }, 2000);

        return () => {
            clearInterval(interval);
            clearInterval(msgInterval);
        };
    }, []);

    return (
        <div className="w-full max-w-sm mx-auto text-center">
            <div className="mb-2 flex justify-between text-xs font-semibold text-[#55875F] uppercase tracking-wider">
                <span>Processing</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-[#E2F0E5] rounded-full h-3 mb-3 overflow-hidden relative">
                <div
                    className="bg-gradient-to-r from-[#6AA374] to-[#8BBFA3] h-3 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                >
                    {/* Shimmer effect */}
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-[shimmer_2s_infinite]"></div>
                </div>
            </div>
            <p className="text-sm text-gray-500 font-medium italic animate-pulse">
                {message}
            </p>
        </div>
    );
};

export default ProgressBar;
