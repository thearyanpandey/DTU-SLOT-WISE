import React, { useState, useEffect } from 'react';
import { Edit2, Check, X, Grid3x3 } from 'lucide-react';

export default function ManualCorrection({ initialTimetable, onSave }) {
  const [timetable, setTimetable] = useState(initialTimetable);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const times = ['8-9', '9-10', '10-11', '11-12', '12-1', '1-2', '2-3', '3-4', '4-5', '5-6'];
  
  const getSlot = (day, time) => {
    return timetable.find(t => t.day === day && t.time === time);
  };
  
  const updateSlot = (day, time, updates) => {
    const newTimetable = [...timetable];
    const index = newTimetable.findIndex(t => t.day === day && t.time === time);
    
    if (index >= 0) {
      if (updates === null) {
        // Remove slot
        newTimetable.splice(index, 1);
      } else {
        // Update slot
        newTimetable[index] = { ...newTimetable[index], ...updates };
      }
    } else if (updates !== null) {
      // Add new slot
      newTimetable.push({ day, time, ...updates });
    }
    
    setTimetable(newTimetable);
  };
  
  const handleSave = () => {
    onSave(timetable);
  };
  
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          <Grid3x3 className="inline mr-2" />
          Manual Timetable Correction
        </h2>
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Save Corrections
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Time</th>
              {days.map(day => (
                <th key={day} className="border p-2">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map(time => (
              <tr key={time}>
                <td className="border p-2 font-medium">{time}</td>
                {days.map(day => {
                  const slot = getSlot(day, time);
                  const isEditing = editing && editing.day === day && editing.time === time;
                  
                  return (
                    <td key={`${day}-${time}`} className="border p-2 min-w-[120px]">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 border rounded px-2 py-1"
                            placeholder="PE302 (L)"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              if (editValue.trim()) {
                                const [subject, type] = editValue.split(/[()]/);
                                updateSlot(day, time, {
                                  subject: subject.trim(),
                                  type: type ? type.trim().charAt(0) : 'L'
                                });
                              }
                              setEditing(null);
                            }}
                            className="text-green-600"
                          >
                            <Check size={20} />
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="text-red-600"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">
                            {slot ? `${slot.subject} (${slot.type})` : '—'}
                          </span>
                          <button
                            onClick={() => {
                              setEditing({ day, time });
                              setEditValue(slot ? `${slot.subject} (${slot.type})` : '');
                            }}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-bold text-yellow-800 mb-2">Editing Tips:</h3>
        <ul className="text-sm text-yellow-700 list-disc pl-5 space-y-1">
          <li>Click the edit icon (✏️) to modify any cell</li>
          <li>Format: "SUBJECT (TYPE)" e.g., "PE302 (L)" or "E1 (L)"</li>
          <li>Leave empty or enter "—" to clear a slot</li>
          <li>Type 'L' for Lecture, 'P' for Practical/Lab</li>
        </ul>
      </div>
    </div>
  );
}