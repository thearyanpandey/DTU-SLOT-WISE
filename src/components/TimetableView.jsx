import React from 'react';
import { Calendar, Download, ArrowLeft } from 'lucide-react';
import { TIME_SLOTS, DAYS } from '../utils/timetableFilter';

const PASTEL_COLORS = [
    'bg-[#E8DEF8]', // Lilac
    'bg-[#Cce5ff]', // Light Blue
    'bg-[#F0F4C3]', // Light Lime
    'bg-[#F8D8D8]', // Light Red
    'bg-[#D7E8CD]', // Light Green
    'bg-[#FAD2E1]', // Light Pink
];

// Consistent color mapping based on content
const getColorForContent = (text) => {
    if (!text) return 'bg-transparent';
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PASTEL_COLORS.length;
    return PASTEL_COLORS[index];
};

const TimetableView = ({
    gridData,
    handleCellEdit,
    handleDownloadExcel,
    handleDownloadICS,
    onBack
}) => {

    // Helper to check if two cells should be merged
    const shouldMerge = (day, timeIndex) => {
        if (timeIndex === 0) return false;
        const currentTime = TIME_SLOTS[timeIndex];
        const prevTime = TIME_SLOTS[timeIndex - 1];

        const currentContent = gridData[day]?.[currentTime];
        const prevContent = gridData[day]?.[prevTime];

        // Merge if content is identical and not empty
        return currentContent && prevContent && currentContent === prevContent;
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8">
                <button
                    onClick={onBack}
                    className="px-5 py-2 rounded-full border border-[#7CA986] text-[#55875F] bg-[#E8F3EB] hover:bg-[#DCEEDB] transition-colors font-medium flex items-center gap-2"
                >
                    <ArrowLeft size={18} /> Back to Edit
                </button>
                <h2 className="text-3xl font-bold text-[#2D3436] hidden md:block">Your Personalized Timetable</h2>
                <div className="w-[120px]"></div>
            </div>

            <div className="bg-[#FEFCE8] p-6 rounded-3xl shadow-lg border border-[#EEE] overflow-x-auto">
                <div className="min-w-[800px] flex">

                    {/* Time Column */}
                    <div className="flex-none w-24">
                        <div className="h-16 border-b border-[#E0E0E0] p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</div>
                        {TIME_SLOTS.map((time) => (
                            <div key={time} className="h-28 border-b border-[#E0E0E0] last:border-b-0 p-2 text-xs font-semibold text-gray-400 flex items-center justify-center text-center">
                                {time}
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    <div className="flex-1 flex">
                        {DAYS.map((day) => (
                            <div key={day} className="flex-1 min-w-[140px] flex flex-col border-l border-[#E0E0E0]">
                                {/* Header */}
                                <div className="h-16 border-b border-[#E0E0E0] flex items-center justify-center p-2">
                                    <span className="text-lg font-semibold text-[#2D3436]">{day}</span>
                                </div>

                                {/* Slots */}
                                <div className="flex-1 relative">
                                    {TIME_SLOTS.map((time, index) => {
                                        const isMerged = shouldMerge(day, index);

                                        // If merged, we don't render anything in this slot (the previous slot will expand)
                                        // BUT, in CSS Grid/Flex this is hard.
                                        // Better approach: 
                                        // iterate and build "blocks". 

                                        return null;
                                    })}

                                    {/* Grid Render Logic using rendering blocks instead of map 1:1 */}
                                    {(() => {
                                        const blocks = [];
                                        let i = 0;
                                        while (i < TIME_SLOTS.length) {
                                            const time = TIME_SLOTS[i];
                                            const content = gridData[day]?.[time];
                                            const startIndex = i;

                                            // Look ahead for merges
                                            let span = 1;
                                            if (content) {
                                                while (i + span < TIME_SLOTS.length) {
                                                    const nextTime = TIME_SLOTS[i + span];
                                                    const nextContent = gridData[day]?.[nextTime];
                                                    if (nextContent === content) {
                                                        span++;
                                                    } else {
                                                        break;
                                                    }
                                                }
                                            }

                                            // Style calc
                                            const colorClass = getColorForContent(content);
                                            const heightClass = `h-[${span * 7}rem]`; // 7rem is 28 (h-28)
                                            // Tailwind arbitrary values might not work dynamically for calc. 
                                            // Using style attribute for precise height
                                            const heightStyle = { height: `${span * 7}rem` };

                                            blocks.push(
                                                <div
                                                    key={`${day}-${time}`}
                                                    className="w-full border-b border-[#E0E0E0] p-2 relative group"
                                                    style={heightStyle}
                                                >
                                                    <div className={`w-full h-full rounded-xl transition-all hover:shadow-md ${content ? colorClass : 'hover:bg-gray-50'}`}>
                                                        <textarea
                                                            value={content || ''}
                                                            onChange={(e) => handleCellEdit(day, time, e.target.value)} // Note: simple edit only affects top cell if merged? 
                                                            // For a perfect "merged" edit, we might need to update all covered slots.
                                                            // But for now, let's just update the specific slot. 
                                                            // Wait, if it's merged, editing the textarea should probably break the merge if content changes?
                                                            // Or update all slots?
                                                            // Simplest "Edit" logic: If I change a merged block, I probably want to change the Whole Class.
                                                            // So handleCellEdit should propogate to all slots if we are in a merged block? 
                                                            // Or just render individual slots if text differs?
                                                            // Let's stick to standard editing: 
                                                            // If I edit a merged block, I'll update `startIndex`... wait.
                                                            // If I change the text, it will no longer match the next block, so the merge will break automatically on next render!
                                                            // That is actually perfect behavior. "Splitting" a class by renaming one hour.

                                                            className={`w-full h-full bg-transparent resize-none outline-none p-3 text-sm font-medium text-[#2D3436] placeholder-gray-300`}
                                                            placeholder="+"
                                                        />
                                                    </div>
                                                </div>
                                            );

                                            i += span;
                                        }
                                        return blocks;
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
                <button
                    onClick={handleDownloadICS}
                    className="bg-[#55875F] hover:bg-[#46704E] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                    <Calendar size={20} /> Add to Google Calendar
                </button>
                <button
                    onClick={handleDownloadExcel}
                    className="bg-[#E2F0E5] hover:bg-[#D1E6D5] text-[#2D3436] px-6 py-3 rounded-full font-bold flex items-center gap-2 border border-[#C0DCCB] shadow transition-transform active:scale-95"
                >
                    <Download size={20} /> Download as Excel (.xlsx)
                </button>
            </div>
        </div>
    );
};

export default TimetableView;
