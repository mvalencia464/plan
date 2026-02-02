import { create } from 'zustand';
import { Task, DayData, ColorKey, RiceProject, PreloadedEvent, Plan } from '../types';

interface PlanState {
  currentPlanId: string | null;
  activeKeyId: string | null;
  tasksByDate: Record<string, DayData>;
  colorKeys: ColorKey[];
  riceProjects: RiceProject[];
  preloadedEvents: PreloadedEvent[];
  
  // Actions
  setPlanData: (data: Partial<PlanState>) => void;
  setActiveKeyId: (id: string | null) => void;
  updateTask: (date: string, tasks: Task[]) => void;
  updateDayData: (date: string, data: any) => void;
  updateColorKeys: (keys: ColorKey[]) => void;
  updateRiceProjects: (projects: RiceProject[]) => void;
  updatePreloadedEvents: (events: PreloadedEvent[]) => void;
  resetStore: () => void;
}

export const usePlanStore = create<PlanState>((set) => ({
  currentPlanId: null,
  activeKeyId: null,
  tasksByDate: {},
  colorKeys: [],
  riceProjects: [],
  preloadedEvents: [],

  setPlanData: (data) => set((state) => ({ ...state, ...data })),
  setActiveKeyId: (id) => set({ activeKeyId: id }),
  
  updateTask: (date, tasks) => set((state) => ({
    tasksByDate: {
      ...state.tasksByDate,
      [date]: { ...state.tasksByDate[date], tasks }
    }
  })),

  updateDayData: (date, data) => set((state) => ({
    tasksByDate: {
      ...state.tasksByDate,
      [date]: { ...state.tasksByDate[date], ...data }
    }
  })),

  updateColorKeys: (keys) => set({ colorKeys: keys }),
  
  updateRiceProjects: (projects) => set({ riceProjects: projects }),
  
  updatePreloadedEvents: (events) => set({ preloadedEvents: events }),
  
  resetStore: () => set({
    currentPlanId: null,
    activeKeyId: null,
    tasksByDate: {},
    colorKeys: [],
    riceProjects: [],
    preloadedEvents: []
  })
}));
