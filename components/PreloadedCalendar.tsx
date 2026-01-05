import React, { useState } from 'react';
import { MONTH_NAMES, WEEKDAY_INITIALS, PreloadedEvent } from '../types';

interface PreloadedCalendarProps {
  year: number;
  events: PreloadedEvent[];
  onAddEvent?: (event: PreloadedEvent) => void;
  onUpdateEvent?: (oldEvent: PreloadedEvent, newEvent: PreloadedEvent) => void;
  onDeleteEvent?: (event: PreloadedEvent) => void;
  onClearEvents?: () => void;
}

const PreloadedCalendar: React.FC<PreloadedCalendarProps> = ({ year, events, onAddEvent, onUpdateEvent, onDeleteEvent, onClearEvents }) => {
  const COLUMNS = 37;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<PreloadedEvent | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<PreloadedEvent['category']>('milestone');
  const [newEventDate, setNewEventDate] = useState('');

  const getGCalLink = (event: PreloadedEvent) => {
    const date = event.date.replace(/-/g, '');
    const title = encodeURIComponent(`[Stoke Planner] ${event.title}`);
    const details = encodeURIComponent(`Strategic Milestone from your Stoke Planner Strategy.\nCategory: ${event.category}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}/${date}&details=${details}`;
  };

  const exportAllToICal = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Stoke Planner//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";
    
    events.forEach(e => {
      const date = e.date.replace(/-/g, '');
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:[Stoke Planner Strategy] ${e.title}\n`;
      icsContent += `DESCRIPTION:Category: ${e.category}\n`;
      icsContent += `DTSTART;VALUE=DATE:${date}\n`;
      icsContent += `DTEND;VALUE=DATE:${date}\n`;
      icsContent += "TRANSP:TRANSPARENT\n";
      icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Stoke_Planner_Preloaded_${year}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDayClick = (dateStr: string) => {
    if (!onAddEvent) return;
    setSelectedDate(dateStr);
    setEditingEvent(null);
    setNewEventDate(dateStr);
    setNewEventTitle('');
    setNewEventCategory('milestone');
    setIsModalOpen(true);
  };

  const handleEditClick = (event: PreloadedEvent) => {
    setEditingEvent(event);
    setSelectedDate(event.date);
    setNewEventDate(event.date);
    setNewEventTitle(event.title);
    setNewEventCategory(event.category);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (event: PreloadedEvent) => {
    if (onDeleteEvent && window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
        onDeleteEvent(event);
    }
  };

  const handleSaveEvent = () => {
    if (!newEventTitle || !newEventDate) return;

    if (editingEvent && onUpdateEvent) {
        onUpdateEvent(editingEvent, {
            ...editingEvent,
            date: newEventDate,
            title: newEventTitle,
            category: newEventCategory,
        });
    } else if (onAddEvent) {
        onAddEvent({
            date: newEventDate,
            title: newEventTitle,
            category: newEventCategory,
        });
    }
    setIsModalOpen(false);
  };

  const renderDayInitials = () => {
    const initials = [];
    for (let i = 0; i < COLUMNS; i++) {
      initials.push(WEEKDAY_INITIALS[i % 7]);
    }
    return (
      <div className="flex border-b border-gray-100 pb-2">
        <div className="w-16 md:w-20 shrink-0" />
        <div className="grid grid-cols-[repeat(37,minmax(0,1fr))] flex-1">
          {initials.map((char, idx) => {
            const isWeekend = idx % 7 === 5 || idx % 7 === 6;
            return (
              <div key={idx} className={`aspect-square flex items-center justify-center text-[8px] md:text-[10px] font-bold select-none relative ${isWeekend ? 'text-gray-400' : 'text-gray-200'}`}>
                {char}
                {isWeekend && (
                  <div className="absolute inset-0 bg-gray-100/60 -z-10 rounded-t-sm" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getMonthData = (monthIndex: number) => {
    const firstDay = new Date(year, monthIndex, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    return { startOffset, daysInMonth };
  };

  const renderMonthRows = () => {
    return MONTH_NAMES.map((month, mIdx) => {
      const { startOffset, daysInMonth } = getMonthData(mIdx);
      
      return (
        <div key={month} className="flex items-center group relative h-8 md:h-10">
          <div className="w-16 md:w-20 shrink-0 text-right pr-3 md:pr-4 text-[9px] md:text-xs font-bold text-gray-300 tracking-tight uppercase truncate">
            {month.substring(0, 3)}
          </div>

          <div className="grid grid-cols-[repeat(37,minmax(0,1fr))] flex-1 h-full items-center">
            {Array.from({ length: COLUMNS }).map((_, colIdx) => {
              const dayNumber = colIdx - startOffset + 1;
              const isActualDay = dayNumber > 0 && dayNumber <= daysInMonth;
              const isWeekend = colIdx % 7 === 5 || colIdx % 7 === 6;
              
              const dateStr = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
              const dayEvents = events.filter(e => e.date === dateStr);
              const hasEvent = dayEvents.length > 0;

              return (
                <div 
                  key={colIdx} 
                  className={`aspect-square flex items-center justify-center relative ${isActualDay ? 'cursor-pointer' : 'pointer-events-none'}`}
                  onClick={() => isActualDay && handleDayClick(dateStr)}
                >
                  {isActualDay && (
                    <>
                      <div 
                        className={`w-[85%] h-[85%] flex items-center justify-center text-[9px] md:text-[11px] font-medium rounded-sm transition-all duration-300 relative ${hasEvent ? 'bg-black text-white shadow-lg scale-110 z-10 font-bold' : isWeekend ? 'text-gray-500 bg-gray-300/30 hover:bg-gray-300/50' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
                      >
                        {dayNumber}
                        {hasEvent && (
                           <div className="absolute bottom-0.5 w-1 h-1 bg-white rounded-full"></div>
                        )}
                      </div>
                      
                      {hasEvent && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-44 bg-white shadow-2xl rounded-md border border-gray-100 p-3 z-50 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity" onClick={(e) => e.stopPropagation()}>
                          {dayEvents.map((e, idx) => (
                            <div key={idx} className="mb-3 last:mb-0 group/event">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-black uppercase text-[7px] text-blue-600 tracking-widest">{e.category}</span>
                                <div className="flex gap-1 opacity-0 group-hover/event:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleEditClick(e)}
                                        className="text-gray-400 hover:text-blue-500"
                                        title="Edit"
                                    >
                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClick(e)}
                                        className="text-gray-400 hover:text-red-500"
                                        title="Delete"
                                    >
                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                              </div>
                              <span className="text-[10px] text-gray-900 font-bold block mb-2">{e.title}</span>
                              <a 
                                href={getGCalLink(e)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 hover:bg-blue-50 text-[8px] font-black uppercase text-gray-500 hover:text-blue-600 rounded border border-gray-100 transition-colors"
                              >
                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19,4H18V2H16V4H8V2H6V4H5C3.89,4 3,4.9 3,6V20C3,21.1 3.89,22 5,22H19C20.1,22 21,21.1 21,20V6C21,4.9 20.1,4 19,4M19,20H5V10H19V20M9,14H7V12H9V14M13,14H11V12H13V14M17,14H15V12H17V14M9,18H7V16H9V18M13,18H11V16H13V18M17,18H15V16H17V18Z"/></svg>
                                Sync Milestone
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  
                  {isWeekend && (
                    <div className="absolute inset-y-0 w-full bg-gray-100/40 -z-10" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100 print-area w-full overflow-hidden">
        <div className="flex justify-between items-center mb-10 md:mb-16 px-2">
          <div className="max-w-2xl">
            <p className="text-sm md:text-xl text-gray-400 font-medium tracking-tight italic">
              "A fool with a plan can beat a genius without a plan."
            </p>
            <div className="mt-4 flex gap-4 no-print">
              <button 
                onClick={exportAllToICal}
                disabled={events.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-30 active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/></svg>
                Export Map (.ics)
              </button>
              
              {onClearEvents && events.length > 0 && (
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all events from the calendar?')) {
                      onClearEvents();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-red-500 border border-red-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95"
                >
                   Clear Map
                </button>
              )}
            </div>
          </div>
          <div className="text-4xl md:text-8xl font-black tracking-tighter text-gray-200 select-none">{year}</div>
        </div>

        <div className="w-full">
          {renderDayInitials()}
          <div className="mt-4 space-y-1 md:space-y-1.5">
            {renderMonthRows()}
          </div>
          <div className="mt-10 border-t border-gray-50 pt-2">
            {renderDayInitials()}
          </div>
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-4 md:gap-12 no-print border-t border-gray-50 pt-8 opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-black rounded-sm relative flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full absolute bottom-0.5"></div>
            </div>
            <span className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-black">Strategic Milestone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-sm" />
            <span className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-black">Sync Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200/60 rounded-sm" />
            <span className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-black">Weekend</span>
          </div>
        </div>
      </div>

      {/* Add/Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-gray-100">
            <h3 className="text-lg font-black uppercase tracking-tight mb-4">
                {editingEvent ? 'Edit Strategy Event' : 'Add Strategy Event'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Date</label>
                <input 
                  type="date" 
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Event Title</label>
                <input 
                  type="text" 
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g. Q1 Review"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Category</label>
                <select 
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value as PreloadedEvent['category'])}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="milestone">Milestone</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 rounded transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEvent}
                disabled={!newEventTitle.trim() || !newEventDate}
                className="flex-1 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PreloadedCalendar;
