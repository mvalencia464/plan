
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  color?: string;
}

export interface DayData {
  tasks: Task[];
}

export interface ColorKey {
  id: string;
  label: string;
  color: string; // Tailwind class like bg-red-500
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface RiceProject {
  id: string;
  name: string;
  reach: number;
  impact: number; // 0.25 to 3
  confidence: number; // 0 to 100 (%)
  effort: number; // man-months
  score: number;
}

export interface PreloadedEvent {
  date: string;
  title: string;
  category: 'health' | 'work' | 'personal' | 'holiday' | 'milestone';
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const WEEKDAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];

export const PRESET_COLORS = [
  { name: 'Red', class: 'bg-red-500' },
  { name: 'Orange', class: 'bg-orange-500' },
  { name: 'Yellow', class: 'bg-yellow-400' },
  { name: 'Green', class: 'bg-green-500' },
  { name: 'Cyan', class: 'bg-cyan-400' },
  { name: 'Blue', class: 'bg-blue-500' },
  { name: 'Indigo', class: 'bg-indigo-600' },
  { name: 'Purple', class: 'bg-purple-500' },
  { name: 'Pink', class: 'bg-pink-500' },
  { name: 'Slate', class: 'bg-slate-400' },
];

export const INITIAL_KEYS: ColorKey[] = [];
