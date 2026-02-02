
import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { MONTH_NAMES, ColorKey, PRESET_COLORS, RiceProject } from '../types';
import { supabase } from '../services/supabaseClient';

interface DashboardProps {
  year: number;
  onMonthClick: (monthIndex: number) => void;
  tasksByDate: Record<string, any>;
  colorKeys: ColorKey[];
  onUpdateKeys: (keys: ColorKey[]) => void;
  activeKeyId: string | null;
  setActiveKeyId: (id: string | null) => void;
  riceProjects?: RiceProject[];
  userId?: string;
  planId?: string;
  readOnly?: boolean;
}

const isDateInRange = (dateStr: string, start?: string, end?: string) => {
  if (!start || !end) return false;
  const s = start < end ? start : end;
  const e = start < end ? end : start;
  return dateStr >= s && dateStr <= e;
};

const DayCell = memo(({
  dayNum,
  isDay,
  dateStr,
  isToday,
  highlightColor,
  hasTasks,
  onMouseDown,
  onMouseEnter,
  onMouseUp
}: {
  dayNum: number;
  isDay: boolean;
  dateStr: string;
  isToday: boolean;
  highlightColor: string | null;
  hasTasks: boolean;
  onMouseDown: (dateStr: string) => void;
  onMouseEnter: (dateStr: string) => void;
  onMouseUp: () => void;
}) => {
  return (
    <div
      onMouseDown={() => isDay && onMouseDown(dateStr)}
      onMouseEnter={() => isDay && onMouseEnter(dateStr)}
      onMouseUp={onMouseUp}
      className={`aspect-square flex items-center justify-center text-[9px] relative cursor-crosshair select-none ${isDay ? (highlightColor ? `${highlightColor} text-white` : 'bg-white text-gray-700 hover:bg-gray-50') : 'bg-gray-50'}`}
    >
      {isDay && (
        <div className={`w-full h-full flex items-center justify-center ${isToday ? 'ring-2 ring-inset ring-blue-500 font-black z-10' : ''}`}>
          {dayNum}
          {hasTasks && !highlightColor && <div className="absolute bottom-0.5 w-1 h-1 bg-black rounded-full" />}
        </div>
      )}
    </div>
  );
});

const MiniMonth = memo(({
  monthIdx,
  year,
  onMonthClick,
  todayStr,
  highlightMap,
  tasksByDate,
  dragStart,
  dragCurrent, // [NEW] Accept dragCurrent
  previewColor, // [NEW] Accept previewColor
  onMouseDown,
  onMouseEnter,
  onMouseUp
}: {
  monthIdx: number;
  year: number;
  onMonthClick: (monthIndex: number) => void;
  todayStr: string;
  highlightMap: Record<string, string | null>;
  tasksByDate: Record<string, any>;
  dragStart: string | null;
  dragCurrent: string | null; // [NEW] Type definition
  previewColor: string | null; // [NEW] Type definition
  onMouseDown: (dateStr: string) => void;
  onMouseEnter: (dateStr: string) => void;
  onMouseUp: () => void;
}) => {
  const firstDay = new Date(year, monthIdx, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  return (
    <div className="flex-1 bg-white border border-gray-300 transition-all group min-w-[140px] shadow-sm hover:shadow-md">
      <div
        onClick={(e) => { e.stopPropagation(); onMonthClick(monthIdx); }}
        className="bg-black text-white text-[11px] font-black text-center py-1.5 uppercase tracking-widest cursor-pointer hover:bg-gray-800 transition-colors"
      >
        {MONTH_NAMES[monthIdx]}
      </div>
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[8px] text-gray-400 font-medium py-0.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {Array.from({ length: 35 }).map((_, i) => {
          const dayNum = i - startOffset + 1;
          const isDay = dayNum > 0 && dayNum <= daysInMonth;
          const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;

          // [OPTIMIZATION] Calculate drag highlight locally
          let highlightColor = isDay ? highlightMap[dateStr] : null;
          if (isDay && dragStart && dragCurrent && previewColor && isDateInRange(dateStr, dragStart, dragCurrent)) {
            highlightColor = previewColor;
          }

          const hasTasks = tasksByDate[dateStr]?.tasks?.length > 0;

          return (
            <DayCell
              key={i}
              dayNum={dayNum}
              isDay={isDay}
              dateStr={dateStr}
              isToday={isToday}
              highlightColor={highlightColor || null}
              hasTasks={hasTasks}
              onMouseDown={onMouseDown}
              onMouseEnter={onMouseEnter}
              onMouseUp={onMouseUp}
            />
          );
        })}
      </div>
    </div>
  );
});

const Dashboard: React.FC<DashboardProps> = ({
  year, onMonthClick, tasksByDate, colorKeys, onUpdateKeys, activeKeyId, setActiveKeyId, riceProjects = [], userId, planId, readOnly = false
}) => {
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragCurrent, setDragCurrent] = useState<string | null>(null);
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpenColorPicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateICSContent = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Stoke Planner//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";

    colorKeys.forEach(key => {
      if (key.startDate && key.endDate && key.label) {
        const start = key.startDate.replace(/-/g, '');
        const endDateObj = new Date(key.endDate + 'T00:00:00');
        endDateObj.setDate(endDateObj.getDate() + 1);
        const endYear = endDateObj.getFullYear();
        const endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0');
        const endDay = String(endDateObj.getDate()).padStart(2, '0');
        const end = `${endYear}${endMonth}${endDay}`;

        icsContent += "BEGIN:VEVENT\n";
        icsContent += `SUMMARY:[Stoke Planner] ${key.label}\n`;
        icsContent += `DTSTART;VALUE=DATE:${start}\n`;
        icsContent += `DTEND;VALUE=DATE:${end}\n`;
        icsContent += "TRANSP:TRANSPARENT\n";
        icsContent += "END:VEVENT\n";
      }
    });

    icsContent += "END:VCALENDAR";
    return icsContent;
  };

  const exportToICal = () => {
    const icsContent = generateICSContent();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `War_Map_Strategy_${year}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const publishToWeb = async () => {
    if (!userId) {
      alert('Please sign in to publish your calendar.');
      return;
    }

    setIsPublishing(true);
    try {
      const icsContent = generateICSContent();
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      // Use planId if available for unique filenames per plan, otherwise fallback to user/year
      const fileName = planId
        ? `${userId}/${planId}_${year}.ics`
        : `${userId}/war_map_${year}.ics`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('calendars')
        .upload(fileName, blob, {
          contentType: 'text/calendar',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('calendars')
        .getPublicUrl(fileName);

      setCalendarUrl(publicUrl);
    } catch (error: any) {
      console.error('Error publishing calendar:', error);
      alert(`Error publishing calendar: ${error.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const copyToClipboard = () => {
    if (calendarUrl) {
      navigator.clipboard.writeText(calendarUrl);
      alert('Calendar URL copied to clipboard! You can now subscribe in Google Calendar.');
    }
  };

  const getGCalLink = (key: ColorKey) => {
    if (!key.startDate || !key.endDate) return null;
    const start = key.startDate.replace(/-/g, '');
    const endDateObj = new Date(key.endDate + 'T00:00:00');
    endDateObj.setDate(endDateObj.getDate() + 1);
    const endYear = endDateObj.getFullYear();
    const endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDateObj.getDate()).padStart(2, '0');
    const end = `${endYear}${endMonth}${endDay}`;
    const title = encodeURIComponent(`[Stoke Planner] ${key.label}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}`;
  };

  const highlightMap = useMemo(() => {
    const map: Record<string, string | null> = {};

    // Static highlights from saved keys
    colorKeys.forEach(key => {
      if (!key.startDate || !key.endDate) return;
      const s = key.startDate < key.endDate ? key.startDate : key.endDate;
      const e = key.startDate < key.endDate ? key.endDate : key.startDate;

      // We only need to populate the map for dates that fall within the year's months
      // For performance, we could be even more specific, but this is a good start.
      // Actually, let's just use the isDateInRange logic but pre-computed.
    });

    return map;
  }, [colorKeys, year]);

  const getDayHighlight = useCallback((dateStr: string) => {
    // 1. Dragging: Show preview color
    if (dragStart && dragCurrent && isDateInRange(dateStr, dragStart, dragCurrent)) {
      if (activeKeyId) {
        // Editing existing key
        return colorKeys.find(k => k.id === activeKeyId)?.color || 'bg-blue-200';
      } else {
        // Creating new key - preview the next color
        return PRESET_COLORS[colorKeys.length % PRESET_COLORS.length].class;
      }
    }
    // 2. Static: Show saved color
    const activeKey = colorKeys.find(key => isDateInRange(dateStr, key.startDate, key.endDate));
    return activeKey ? activeKey.color : null;
  }, [colorKeys]); // Removed drag dependencies

  // [OPTIMIZATION] Static map only, no drag dependencies
  const staticHighlightMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (let m = 0; m < 12; m++) {
      const days = new Date(year, m + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        // Only calculate static colors
        const activeKey = colorKeys.find(key => isDateInRange(dateStr, key.startDate, key.endDate));
        map[dateStr] = activeKey ? activeKey.color : null;
      }
    }
    return map;
  }, [year, colorKeys]); // Only updates when year or keys change

  // [NEW] Determine preview color for passing to children
  const previewColor = useMemo(() => {
    if (activeKeyId) {
      return colorKeys.find(k => k.id === activeKeyId)?.color || 'bg-blue-200';
    } else {
      return PRESET_COLORS[colorKeys.length % PRESET_COLORS.length].class;
    }
  }, [activeKeyId, colorKeys]);

  const handleMouseDown = useCallback((dateStr: string) => {
    if (readOnly) return;
    setDragStart(dateStr);
    setDragCurrent(dateStr);
  }, [readOnly]);

  const handleMouseEnter = useCallback((dateStr: string) => {
    if (dragStart) {
      setDragCurrent(dateStr);
    }
  }, [dragStart]);

  const handleMouseUp = useCallback(() => {
    if (dragStart && dragCurrent) {
      const s = dragStart < dragCurrent ? dragStart : dragCurrent;
      const e = dragStart < dragCurrent ? dragCurrent : dragStart;

      if (activeKeyId) {
        onUpdateKeys(colorKeys.map(k => k.id === activeKeyId ? {
          ...k,
          startDate: s,
          endDate: e
        } : k));
        setActiveKeyId(null);
      } else {
        const newKey: ColorKey = {
          id: Math.random().toString(36).substr(2, 9),
          label: 'New Initiative',
          color: PRESET_COLORS[colorKeys.length % PRESET_COLORS.length].class,
          startDate: s,
          endDate: e
        };
        onUpdateKeys([...colorKeys, newKey]);
        setActiveKeyId(null);
      }
    }
    setDragStart(null);
    setDragCurrent(null);
  }, [dragStart, dragCurrent, activeKeyId, colorKeys, onUpdateKeys, setActiveKeyId]);

  const handleKeyUpdate = (id: string, updates: Partial<ColorKey>) => {
    onUpdateKeys(colorKeys.map(k => k.id === id ? { ...k, ...updates } : k));
  };

  const handleAddKey = () => {
    const newKey: ColorKey = {
      id: Math.random().toString(36).substr(2, 9),
      label: '',
      color: PRESET_COLORS[colorKeys.length % PRESET_COLORS.length].class,
    };
    onUpdateKeys([...colorKeys, newKey]);
    setActiveKeyId(newKey.id);
  };

  const handleRemoveKey = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onUpdateKeys(colorKeys.filter(k => k.id !== id));
    if (activeKeyId === id) setActiveKeyId(null);
  };

  const handlePromoteProject = (project: RiceProject) => {
    const newKey: ColorKey = {
      id: Math.random().toString(36).substr(2, 9),
      label: project.name,
      color: PRESET_COLORS[colorKeys.length % PRESET_COLORS.length].class,
      startDate: project.startDate,
      endDate: project.endDate
    };
    onUpdateKeys([...colorKeys, newKey]);
    setActiveKeyId(newKey.id);
  };

  // Filter top projects not already in keys
  const suggestedProjects = riceProjects
    .filter(p => !colorKeys.some(k => k.label.toLowerCase() === p.name.toLowerCase()))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 suggestions

  // Removed activeHighlightMap and rely on staticHighlightMap + local calculation

  return (
    <div className="flex flex-col xl:flex-row gap-8" onMouseUp={handleMouseUp}>
      <div className="flex-1">
        <h2 className="text-3xl font-black text-center mb-8 uppercase tracking-[0.3em] text-gray-800">
          War Map {year}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MONTH_NAMES.map((_, i) => (
            <MiniMonth
              key={i}
              monthIdx={i}
              year={year}
              onMonthClick={onMonthClick}
              todayStr={todayStr}
              highlightMap={staticHighlightMap}
              tasksByDate={tasksByDate}
              dragStart={dragStart}
              dragCurrent={dragCurrent}
              previewColor={previewColor}
              onMouseDown={handleMouseDown}
              onMouseEnter={handleMouseEnter}
              onMouseUp={handleMouseUp}
            />
          ))}
        </div>
      </div>

      <div className="w-full xl:w-96 bg-white border border-gray-300 flex flex-col h-fit sticky top-24 shadow-xl">
        <div className="bg-black text-white text-center font-black py-4 uppercase tracking-[0.2em] text-xs flex justify-between px-5 items-center">
          <div className="flex flex-col items-start text-left">
            <span>War Map Strategy</span>
            <span className="text-[7px] opacity-50 font-medium normal-case tracking-normal">Plot blocks by dragging on calendar</span>
          </div>
          {!readOnly && (
            <div className="flex gap-2 items-center">
              {/* Publish / Subscribe Button */}
              <button
                onClick={publishToWeb}
                title="Publish & Subscribe (Webcal)"
                disabled={isPublishing}
                className={`flex items-center gap-1.5 px-2 py-1 bg-blue-600 text-white rounded text-[9px] font-black uppercase tracking-wider hover:bg-blue-500 transition-all active:scale-95 ${isPublishing ? 'opacity-50 cursor-wait' : ''}`}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16,5V11H21V5M10,11H15V5H10M16,18H21V12H16M10,18H15V12H10M4,18H9V12H4M4,11H9V5H4V11Z" /></svg>
                Publish
              </button>

              <div className="w-px h-4 bg-gray-700 mx-1" />

              <button
                onClick={exportToICal}
                title="Download Strategy Calendar (.ics)"
                className="text-gray-400 hover:text-white transition-colors p-1 active:scale-90"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" /></svg>
              </button>
              <button onClick={handleAddKey} className="hover:text-green-400 text-xl transition-colors p-1 active:scale-90">+</button>
            </div>
          )}
        </div>

        {/* URL Display Area */}
        {calendarUrl && (
          <div className="bg-gray-100 p-3 border-b border-gray-200">
            <p className="text-[9px] font-bold uppercase text-gray-500 mb-1">Calendar Published!</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={calendarUrl}
                className="flex-1 text-[10px] bg-white border border-gray-200 p-1.5 rounded text-gray-600 focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="p-1.5 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                title="Copy URL"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              </button>
              <button
                onClick={() => setCalendarUrl(null)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                title="Close"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-[8px] text-gray-400 mt-1.5 leading-tight">
              Paste this URL into Google Calendar via "Add calendar" &gt; "From URL" to subscribe.
            </p>
          </div>
        )}

        <div className="divide-y divide-gray-100 overflow-y-auto max-h-[70vh]">
          {colorKeys.map(key => (
            <div
              key={key.id}
              onClick={() => !readOnly && setActiveKeyId(activeKeyId === key.id ? null : key.id)}
              className={`p-3 space-y-2 group cursor-pointer transition-all duration-200 ${activeKeyId === key.id ? 'bg-blue-50 ring-2 ring-inset ring-blue-200' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-3 relative">
                <div
                  className={`w-7 h-7 rounded shadow-inner border border-black/5 cursor-pointer relative ${key.color} flex items-center justify-center`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!readOnly) setOpenColorPicker(openColorPicker === key.id ? null : key.id);
                  }}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />

                  {openColorPicker === key.id && !readOnly && (
                    <div
                      ref={pickerRef}
                      className="absolute top-full left-0 mt-2 p-2 bg-white border border-gray-200 shadow-2xl rounded-lg grid grid-cols-5 gap-1.5 z-[100] w-[160px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c.class}
                          className={`w-6 h-6 rounded-sm border border-black/5 hover:scale-110 transition-transform ${c.class} ${key.color === c.class ? 'ring-2 ring-black ring-offset-1' : ''}`}
                          onClick={() => {
                            handleKeyUpdate(key.id, { color: c.class });
                            setOpenColorPicker(null);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <input
                  className="text-[11px] font-black text-gray-800 bg-transparent border-none focus:ring-0 w-full p-0 uppercase tracking-tight placeholder:text-gray-300"
                  value={key.label}
                  readOnly={readOnly}
                  placeholder="Initiative Title..."
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleKeyUpdate(key.id, { label: e.target.value })}
                />

                {!readOnly && (
                  <div className="flex gap-1.5 shrink-0">
                    {key.startDate && (
                      <a
                        href={getGCalLink(key) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Sync this block to Google Calendar"
                        className="text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all p-1 active:scale-90"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z" /></svg>
                      </a>
                    )}
                    <button
                      onClick={(e) => handleRemoveKey(e, key.id)}
                      title="Delete Key"
                      className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 active:scale-90"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                <input
                  type="date"
                  value={key.startDate || ''}
                  readOnly={readOnly}
                  onChange={(e) => handleKeyUpdate(key.id, { startDate: e.target.value })}
                  className="text-[10px] bg-gray-50 border border-gray-100 rounded px-2 py-1 w-full focus:ring-1 focus:ring-black focus:bg-white transition-colors"
                />
                <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">to</span>
                <input
                  type="date"
                  value={key.endDate || ''}
                  readOnly={readOnly}
                  onChange={(e) => handleKeyUpdate(key.id, { endDate: e.target.value })}
                  className="text-[10px] bg-gray-50 border border-gray-100 rounded px-2 py-1 w-full focus:ring-1 focus:ring-black focus:bg-white transition-colors"
                />
              </div>
            </div>
          ))}
          {colorKeys.length === 0 && (
            <div className="py-20 text-center px-8">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <span className="text-gray-300 text-xl font-bold">+</span>
              </div>
              <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest leading-relaxed">
                Strategy Key Empty.<br />Add a key to begin mapping your year.
              </p>
            </div>
          )}
        </div>

        {/* Suggested Projects Section */}
        {!readOnly && suggestedProjects.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50/50">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              Top RICE Initiatives
            </h4>
            <div className="space-y-2">
              {suggestedProjects.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePromoteProject(p)}
                  className="w-full text-left p-2 bg-white border border-gray-200 rounded shadow-sm hover:border-blue-400 hover:shadow-md transition-all group flex justify-between items-center"
                >
                  <div>
                    <div className="text-[10px] font-bold text-gray-800 leading-tight">{p.name}</div>
                    <div className="text-[8px] text-gray-400 font-medium">Score: {Math.round(p.score)}</div>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <span className="text-sm leading-none pb-0.5">+</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
