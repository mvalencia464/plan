
import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { MONTH_NAMES, WEEKDAYS, WEEKDAY_INITIALS, Task, ColorKey, PreloadedEvent } from '../types';

interface MonthFocusProps {
  year: number;
  monthIndex: number;
  tasksByDate: Record<string, { tasks: Task[], objectives?: string, notes?: string }>;
  colorKeys: ColorKey[];
  preloadedEvents?: PreloadedEvent[];
  onUpdateTasks: (date: string, tasks: Task[]) => void;
  onUpdateMeta: (monthIndex: number, type: 'objectives' | 'notes', value: string) => void;
  activeKeyId: string | null;
  readOnly?: boolean;
}

const MonthTaskItem = memo(({
  task,
  dateStr,
  readOnly,
  editingTaskId,
  draggedTaskId,
  handleDragStart,
  handleDropOnTask,
  setEditingTaskId,
  setEditingTaskText,
  editingTaskText,
  setEditingTaskTextValue,
  onEditKeyDown,
  handleSaveEdit,
  toggleTask,
  copyTaskToNextDay,
  removeTask,
  editInputRef
}: {
  task: Task;
  dateStr: string;
  readOnly: boolean;
  editingTaskId: string | null;
  draggedTaskId: string | null;
  handleDragStart: (e: React.DragEvent, date: string, taskId: string) => void;
  handleDropOnTask: (e: React.DragEvent, targetDate: string, targetTaskId: string) => void;
  setEditingTaskId: (id: string | null) => void;
  setEditingTaskText: (text: string) => void;
  editingTaskText: string;
  setEditingTaskTextValue: (text: string) => void;
  onEditKeyDown: (e: React.KeyboardEvent, date: string) => void;
  handleSaveEdit: (date: string) => void;
  toggleTask: (date: string, taskId: string) => void;
  copyTaskToNextDay: (date: string, task: Task) => void;
  removeTask: (date: string, taskId: string) => void;
  editInputRef: React.RefObject<HTMLInputElement | null>;
}) => {
  const isEditing = editingTaskId === task.id;

  return (
    <div
      draggable={!readOnly && !editingTaskId}
      onDragStart={(e) => !readOnly && handleDragStart(e, dateStr, task.id)}
      onDrop={(e) => !readOnly && handleDropOnTask(e, dateStr, task.id)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!readOnly) {
          setEditingTaskId(task.id);
          setEditingTaskTextValue(task.text);
        }
      }}
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center gap-1.5 group/task relative py-1 px-1.5 rounded border border-transparent hover:border-black/5 hover:bg-white/80 transition-all ${!readOnly ? 'cursor-grab active:cursor-grabbing' : ''} ${draggedTaskId === task.id ? 'opacity-30' : ''} ${isEditing ? 'bg-white shadow-sm ring-1 ring-black/5 z-20' : ''}`}
    >
      {isEditing ? (
        <input
          ref={editInputRef}
          type="text"
          value={editingTaskText}
          onChange={(e) => setEditingTaskTextValue(e.target.value)}
          onKeyDown={(e) => onEditKeyDown(e, dateStr)}
          onBlur={() => handleSaveEdit(dateStr)}
          className="w-full text-[11px] font-bold p-0 border-none focus:ring-0 bg-transparent"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <input
            type="checkbox"
            checked={task.completed}
            disabled={readOnly}
            onChange={() => toggleTask(dateStr, task.id)}
            className="h-3.5 w-3.5 rounded-sm border-gray-400 text-black focus:ring-black cursor-pointer z-10 shrink-0 disabled:opacity-50"
          />
          <span className={`text-[11px] leading-tight flex-1 transition-all ${task.completed ? 'line-through text-gray-400' : 'text-gray-800 font-bold'}`}>
            {task.text}
          </span>

          {!readOnly && (
            <div className="flex gap-0.5 opacity-0 group-hover/task:opacity-100 transition-all">
              <button
                onClick={(e) => { e.stopPropagation(); copyTaskToNextDay(dateStr, task); }}
                title="Duplicate"
                className="p-1 hover:bg-green-50 text-green-500 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-100 active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeTask(dateStr, task.id); }}
                title="Delete"
                className="p-1 hover:bg-red-50 text-red-500 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-100 active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});

const MonthDayCell = memo(({
  dayNum,
  isDay,
  dateStr,
  isToday,
  dayTasks,
  dayEvents,
  highlight,
  readOnly,
  editingDay,
  editingTaskId,
  draggedTaskId,
  newTaskText,
  setEditingDay,
  setNewTaskText,
  onKeyDown,
  handleAddTask,
  handleDragOver,
  handleDropOnDay,
  handleDragStart,
  handleDropOnTask,
  setEditingTaskId,
  setEditingTaskText,
  editingTaskText,
  setEditingTaskTextValue,
  onEditKeyDown,
  handleSaveEdit,
  toggleTask,
  copyTaskToNextDay,
  removeTask,
  inputRef,
  editInputRef,
  weekDayName
}: {
  dayNum: number;
  isDay: boolean;
  dateStr: string;
  isToday: boolean;
  dayTasks: Task[];
  dayEvents: PreloadedEvent[];
  highlight: { baseColorClass: string; borderColorClass: string } | null;
  readOnly: boolean;
  editingDay: string | null;
  editingTaskId: string | null;
  draggedTaskId: string | null;
  newTaskText: string;
  setEditingDay: (day: string | null) => void;
  setNewTaskText: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent, date: string) => void;
  handleAddTask: (date: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDropOnDay: (e: React.DragEvent, targetDate: string) => void;
  handleDragStart: (e: React.DragEvent, date: string, taskId: string) => void;
  handleDropOnTask: (e: React.DragEvent, targetDate: string, targetTaskId: string) => void;
  setEditingTaskId: (id: string | null) => void;
  setEditingTaskText: (text: string) => void;
  editingTaskText: string;
  setEditingTaskTextValue: (text: string) => void;
  onEditKeyDown: (e: React.KeyboardEvent, date: string) => void;
  handleSaveEdit: (date: string) => void;
  toggleTask: (date: string, taskId: string) => void;
  copyTaskToNextDay: (date: string, task: Task) => void;
  removeTask: (date: string, taskId: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  weekDayName: string;
}) => {
  return (
    <div
      onClick={() => !readOnly && isDay && !editingTaskId && setEditingDay(dateStr)}
      onDragOver={handleDragOver}
      onDrop={(e) => !readOnly && isDay && handleDropOnDay(e, dateStr)}
      className={`min-h-[120px] md:min-h-[160px] p-2 transition-all relative group flex flex-col ${isDay ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 hidden md:flex'
        } ${isToday ? 'ring-4 ring-blue-500 ring-inset z-10' : ''}`}
    >
      {isDay && (
        <>
          {highlight && (
            <div
              className={`absolute inset-0 ${highlight.baseColorClass} border-y-2 ${highlight.borderColorClass} pointer-events-none z-0`}
              style={{ opacity: 0.05 }}
            />
          )}

          <div className="flex justify-between items-center mb-2 z-10 relative pointer-events-none">
            <div className="flex items-baseline gap-2">
              <span className={`text-base font-black ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {dayNum}
              </span>
              <span className="md:hidden text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {weekDayName}
              </span>
            </div>
            {isToday && <span className="text-[7px] uppercase bg-blue-500 text-white px-1.5 py-0.5 rounded-full animate-pulse font-black">Today</span>}
          </div>

          <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar z-10 relative">
            {dayEvents.map(evt => (
              <div
                key={evt.id || Math.random()}
                className={`flex items-start gap-1.5 py-1 px-1.5 rounded text-[10px] font-bold leading-tight mb-1 border-l-2 shadow-sm ${evt.category === 'milestone' ? 'bg-amber-50 border-amber-400 text-amber-900' :
                    evt.category === 'holiday' ? 'bg-purple-50 border-purple-400 text-purple-900' :
                      'bg-blue-50 border-blue-400 text-blue-900'
                  }`}
              >
                <span className="opacity-70 text-[9px] mt-0.5">●</span>
                <span>{evt.title}</span>
              </div>
            ))}

            {dayTasks.map(task => (
              <MonthTaskItem
                key={task.id}
                task={task}
                dateStr={dateStr}
                readOnly={readOnly}
                editingTaskId={editingTaskId}
                draggedTaskId={draggedTaskId}
                handleDragStart={handleDragStart}
                handleDropOnTask={handleDropOnTask}
                setEditingTaskId={setEditingTaskId}
                setEditingTaskText={setEditingTaskText}
                editingTaskText={editingTaskText}
                setEditingTaskTextValue={setEditingTaskTextValue}
                onEditKeyDown={onEditKeyDown}
                handleSaveEdit={handleSaveEdit}
                toggleTask={toggleTask}
                copyTaskToNextDay={copyTaskToNextDay}
                removeTask={removeTask}
                editInputRef={editInputRef}
              />
            ))}

            {editingDay === dateStr && !readOnly ? (
              <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => onKeyDown(e, dateStr)}
                  onBlur={() => handleAddTask(dateStr)}
                  placeholder="New Task..."
                  className="w-full text-[11px] py-1.5 px-2 border-b-2 border-black focus:ring-0 focus:outline-none bg-white font-bold"
                />
              </div>
            ) : (
              !editingTaskId && !readOnly && (
                <div className="h-6 flex items-center justify-center opacity-0 group-hover:opacity-40 text-[8px] font-black uppercase text-gray-400 mt-2 cursor-pointer border border-dashed border-gray-200 rounded pointer-events-none">
                  + Task
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
});

const isDateInRange = (dateStr: string, start?: string, end?: string) => {
  if (!start || !end) return false;
  const s = start < end ? start : end;
  const e = start < end ? end : start;
  return dateStr >= s && dateStr <= e;
};

const MonthFocus: React.FC<MonthFocusProps> = ({
  year, monthIndex, tasksByDate, colorKeys, preloadedEvents = [], onUpdateTasks, onUpdateMeta, activeKeyId, readOnly = false
}) => {
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedSourceDate, setDraggedSourceDate] = useState<string | null>(null);

  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    if (editingDay && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingDay]);

  useEffect(() => {
    if (editingTaskId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTaskId]);

  const handleAddTask = useCallback((date: string) => {
    if (!newTaskText.trim()) {
      setEditingDay(null);
      return;
    }
    const currentTasks = tasksByDate[date]?.tasks || [];
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      text: newTaskText,
      completed: false
    };
    onUpdateTasks(date, [...currentTasks, newTask]);
    setNewTaskText("");
    setEditingDay(date);
  }, [newTaskText, tasksByDate, onUpdateTasks]);

  const handleSaveEdit = useCallback((date: string) => {
    if (!editingTaskId) return;
    const currentTasks = tasksByDate[date]?.tasks || [];
    if (!editingTaskText.trim()) {
      onUpdateTasks(date, currentTasks.filter(t => t.id !== editingTaskId));
    } else {
      const updated = currentTasks.map(t =>
        t.id === editingTaskId ? { ...t, text: editingTaskText } : t
      );
      onUpdateTasks(date, updated);
    }
    setEditingTaskId(null);
    setEditingTaskText("");
  }, [editingTaskId, editingTaskText, tasksByDate, onUpdateTasks]);

  const onKeyDown = useCallback((e: React.KeyboardEvent, date: string) => {
    if (e.key === 'Enter') handleAddTask(date);
    if (e.key === 'Escape') setEditingDay(null);
  }, [handleAddTask]);

  const onEditKeyDown = useCallback((e: React.KeyboardEvent, date: string) => {
    if (e.key === 'Enter') handleSaveEdit(date);
    if (e.key === 'Escape') {
      setEditingTaskId(null);
      setEditingTaskText("");
    }
  }, [handleSaveEdit]);

  const toggleTaskCallback = useCallback((date: string, taskId: string) => {
    const currentTasks = tasksByDate[date]?.tasks || [];
    const updated = currentTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    onUpdateTasks(date, updated);
  }, [tasksByDate, onUpdateTasks]);

  const removeTaskCallback = useCallback((date: string, taskId: string) => {
    const currentTasks = tasksByDate[date]?.tasks || [];
    onUpdateTasks(date, currentTasks.filter(t => t.id !== taskId));
  }, [tasksByDate, onUpdateTasks]);

  const copyTaskToNextDayCallback = useCallback((date: string, task: Task) => {
    const currentDate = new Date(date + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDateStr = currentDate.toISOString().split('T')[0];
    const nextTasks = tasksByDate[nextDateStr]?.tasks || [];
    const newTask = { ...task, id: Math.random().toString(36).substr(2, 9), completed: false };
    onUpdateTasks(nextDateStr, [...nextTasks, newTask]);
  }, [tasksByDate, onUpdateTasks]);

  const handleDragStartCallback = useCallback((e: React.DragEvent, date: string, taskId: string) => {
    if (editingTaskId) return;
    setDraggedTaskId(taskId);
    setDraggedSourceDate(date);
    e.dataTransfer.effectAllowed = 'move';
  }, [editingTaskId]);

  const handleDragOverCallback = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDropOnDayCallback = useCallback((e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    if (!draggedTaskId || !draggedSourceDate || draggedSourceDate === targetDate) return;
    const sourceTasks = tasksByDate[draggedSourceDate]?.tasks || [];
    const taskToMove = sourceTasks.find(t => t.id === draggedTaskId);
    if (!taskToMove) return;
    onUpdateTasks(draggedSourceDate, sourceTasks.filter(t => t.id !== draggedTaskId));
    const targetTasks = tasksByDate[targetDate]?.tasks || [];
    onUpdateTasks(targetDate, [...targetTasks, taskToMove]);
    setDraggedTaskId(null);
    setDraggedSourceDate(null);
  }, [draggedTaskId, draggedSourceDate, tasksByDate, onUpdateTasks]);

  const handleDropOnTaskCallback = useCallback((e: React.DragEvent, targetDate: string, targetTaskId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!draggedTaskId || !draggedSourceDate) return;
    const sourceTasks = tasksByDate[draggedSourceDate]?.tasks || [];
    const taskToMove = sourceTasks.find(t => t.id === draggedTaskId);
    if (!taskToMove) return;
    const updatedSource = sourceTasks.filter(t => t.id !== draggedTaskId);
    if (draggedSourceDate === targetDate) {
      const targetIdx = updatedSource.findIndex(t => t.id === targetTaskId);
      const reordered = [...updatedSource];
      reordered.splice(targetIdx, 0, taskToMove);
      onUpdateTasks(targetDate, reordered);
    } else {
      onUpdateTasks(draggedSourceDate, updatedSource);
      const targetTasks = tasksByDate[targetDate]?.tasks || [];
      const targetIdx = targetTasks.findIndex(t => t.id === targetTaskId);
      const inserted = [...targetTasks];
      inserted.splice(targetIdx, 0, taskToMove);
      onUpdateTasks(targetDate, inserted);
    }
    setDraggedTaskId(null);
    setDraggedSourceDate(null);
  }, [draggedTaskId, draggedSourceDate, tasksByDate, onUpdateTasks]);

  const getDayHighlight = useCallback((dateStr: string) => {
    const activeKey = colorKeys.find(key => isDateInRange(dateStr, key.startDate, key.endDate));
    if (!activeKey) return null;
    const baseColorClass = activeKey.color;
    const borderColorClass = activeKey.color.replace('bg-', 'border-');
    return { baseColorClass, borderColorClass };
  }, [colorKeys]);

  const currentMonthKeys = colorKeys.filter(key => {
    if (!key.startDate || !key.endDate || !key.label.trim()) return false;
    const start = new Date(key.startDate + 'T00:00:00');
    const end = new Date(key.endDate + 'T00:00:00');
    const viewStart = new Date(year, monthIndex, 1);
    const viewEnd = new Date(year, monthIndex + 1, 0);
    return (start <= viewEnd && end >= viewStart);
  });

  return (
    <div className="bg-white shadow-2xl border border-gray-300 overflow-hidden">
      <div className="bg-black text-white text-center py-5 border-b border-black">
        <h2 className="text-3xl font-black uppercase tracking-[0.4em]">
          {MONTH_NAMES[monthIndex]}
        </h2>
      </div>

      <div className="hidden md:grid grid-cols-7 border-b-2 border-black">
        {WEEKDAYS.map((day, i) => (
          <div key={day} className="bg-gray-50 border-r border-gray-200 last:border-r-0 text-gray-900 text-center py-3 text-[11px] font-black uppercase tracking-widest">
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{WEEKDAY_INITIALS[i]}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 auto-rows-fr bg-gray-300 gap-px">
        {Array.from({ length: 35 }).map((_, i) => {
          const dayNum = i - startOffset + 1;
          const isDay = dayNum > 0 && dayNum <= daysInMonth;
          const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const dayTasks = tasksByDate[dateStr]?.tasks || [];
          const dayEvents = preloadedEvents.filter(e => e.date === dateStr);
          const highlight = isDay ? getDayHighlight(dateStr) : null;
          const weekDayName = WEEKDAYS[i % 7];

          return (
            <MonthDayCell
              key={i}
              dayNum={dayNum}
              isDay={isDay}
              dateStr={dateStr}
              isToday={isToday}
              dayTasks={dayTasks}
              dayEvents={dayEvents}
              highlight={highlight}
              readOnly={readOnly}
              editingDay={editingDay}
              editingTaskId={editingTaskId}
              draggedTaskId={draggedTaskId}
              newTaskText={newTaskText}
              setEditingDay={setEditingDay}
              setNewTaskText={setNewTaskText}
              onKeyDown={onKeyDown}
              handleAddTask={handleAddTask}
              handleDragOver={handleDragOverCallback}
              handleDropOnDay={handleDropOnDayCallback}
              handleDragStart={handleDragStartCallback}
              handleDropOnTask={handleDropOnTaskCallback}
              setEditingTaskId={setEditingTaskId}
              setEditingTaskText={setEditingTaskText}
              editingTaskText={editingTaskText}
              setEditingTaskTextValue={setEditingTaskText}
              onEditKeyDown={onEditKeyDown}
              handleSaveEdit={handleSaveEdit}
              toggleTask={toggleTaskCallback}
              copyTaskToNextDay={copyTaskToNextDayCallback}
              removeTask={removeTaskCallback}
              inputRef={inputRef}
              editInputRef={editInputRef}
              weekDayName={weekDayName}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 border-t-2 border-black bg-white divide-x divide-black/10">
        <div className="p-8">
          <label className="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-5 border-b border-gray-100 pb-2 flex justify-between items-center">
            <span>Dashboard Initiatives</span>
            <span className="text-[8px] text-blue-500 font-bold uppercase">Sync Active</span>
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto mb-6 pr-2 custom-scrollbar">
            {currentMonthKeys.map(key => (
              <div key={key.id} className="flex items-center gap-3 p-2.5 bg-gray-50 border-l-4 border-gray-300 rounded-r shadow-sm">
                <div className={`w-3.5 h-3.5 rounded-sm ${key.color} shrink-0 shadow-inner`} />
                <div className="flex-1">
                  <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{key.label || 'Untitled Strategy'}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{key.startDate} → {key.endDate}</p>
                </div>
              </div>
            ))}
            {currentMonthKeys.length === 0 && (
              <div className="text-[10px] text-gray-300 italic py-6 text-center border border-dashed border-gray-100 rounded">No initiatives overlapping this month.</div>
            )}
          </div>

          <label className="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-4 border-b border-gray-100 pb-2 mt-8">Monthly Objectives:</label>
          <textarea
            className="w-full h-32 text-sm font-medium border-none focus:ring-0 resize-none placeholder:text-gray-200 italic leading-relaxed bg-gray-50/30 rounded p-2"
            placeholder="Key targets for this month..."
            value={tasksByDate[`meta-${monthIndex}`]?.objectives || ""}
            readOnly={readOnly}
            onChange={(e) => onUpdateMeta(monthIndex, 'objectives', e.target.value)}
          />
        </div>
        <div className="p-8">
          <label className="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-4 border-b border-gray-100 pb-2">War Logs / Review:</label>
          <textarea
            className="w-full h-[calc(100%-2rem)] text-sm font-medium border-none focus:ring-0 resize-none placeholder:text-gray-200 italic leading-relaxed bg-gray-50/30 rounded p-2"
            placeholder="Reflection, lessons, outcomes..."
            value={tasksByDate[`meta-${monthIndex}`]?.notes || ""}
            readOnly={readOnly}
            onChange={(e) => onUpdateMeta(monthIndex, 'notes', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default MonthFocus;
