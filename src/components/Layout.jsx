import React from 'react';
import { Clock } from 'lucide-react';

const Layout = ({ children, onNavigate }) => {
    return (
        <div className="min-h-screen bg-[#F0F4EF] font-sans relative overflow-hidden">
            {/* Background Shapes & Pattern */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                {/* Subtle Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                </div>

                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[#E2F0E5] rounded-full blur-3xl opacity-60 animate-[pulse_8s_infinite]"></div>
                <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] bg-[#D0E8D5] rounded-full blur-3xl opacity-50 animate-[pulse_10s_infinite_1s]"></div>
                <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-[#CDE6D4] rounded-full blur-3xl opacity-50 animate-[pulse_12s_infinite]"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
                <div
                    className="flex items-center gap-2 bg-[#DCEEDB] px-4 py-2 rounded-full shadow-sm cursor-pointer hover:bg-[#CDE6D4] transition-colors"
                    onClick={() => onNavigate && onNavigate('home')}
                >
                    <Clock size={20} className="text-[#55875F]" />
                    <span className="text-xl font-bold text-[#55875F] tracking-tight">UniFlow</span>
                </div>
                <button
                    onClick={() => onNavigate && onNavigate('about')}
                    className="px-5 py-2 rounded-full border border-[#55875F] text-[#55875F] font-medium hover:bg-[#DCEEDB] transition-colors text-sm"
                >
                    About
                </button>
            </header>

            {/* Main Content */}
            <main className="relative z-10 w-full max-w-7xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
                {children}
            </main>
        </div>
    );
};

export default Layout;
