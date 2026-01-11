
const fs = require('fs');

// --- Helper Functions & Constants ---

const TASK_ID_BASE = 'task-';
let taskIdCounter = 0;
const getTaskId = () => `${TASK_ID_BASE}${taskIdCounter++}`;

const EVENT_ID_BASE = 'evt-';
let eventIdCounter = 0;
const getEventId = () => `${EVENT_ID_BASE}${eventIdCounter++}`;

// Data Containers
const tasksByDate = {};
const preloadedEvents = [];
const riceProjects = [];

// --- 1. Populate RICE Projects with DATES ---
riceProjects.push(
  { 
    id: 'rp-1', name: 'Implement BILL (Expense & AP)', 
    reach: 100, impact: 2, confidence: 90, effort: 1.5, score: (100*2*0.9)/1.5,
    startDate: '2026-02-16', endDate: '2026-03-09' 
  },
  { 
    id: 'rp-2', name: 'Implement Gusto (Payroll)', 
    reach: 100, impact: 2, confidence: 95, effort: 0.5, score: (100*2*0.95)/0.5,
    startDate: '2026-02-23', endDate: '2026-03-09'
  },
  { 
    id: 'rp-3', name: 'Optimize JobTread (Cost Codes/Audit)', 
    reach: 100, impact: 3, confidence: 95, effort: 1, score: (100*3*0.95)/1,
    startDate: '2026-02-01', endDate: '2026-03-15'
  },
  { 
    id: 'rp-4', name: 'KPI Dashboard Setup', 
    reach: 50, impact: 2, confidence: 90, effort: 1, score: (50*2*0.9)/1,
    startDate: '2026-01-19', endDate: '2026-02-10'
  },
  { 
    id: 'rp-5', name: 'Launch "Deck Care" Maintenance Package', 
    reach: 200, impact: 1.5, confidence: 80, effort: 2, score: (200*1.5*0.8)/2,
    startDate: '2026-04-01', endDate: '2026-05-01'
  },
  {
    id: 'rp-6', name: 'Hire Full-time Bookkeeper',
    reach: 100, impact: 2.5, confidence: 85, effort: 1.5, score: (100*2.5*0.85)/1.5,
    startDate: '2026-03-15', endDate: '2026-04-13'
  },
  {
    id: 'rp-7', name: 'Safety Program & OSHA Training',
    reach: 100, impact: 3, confidence: 95, effort: 0.5, score: (100*3*0.95)/0.5,
    startDate: '2026-05-01', endDate: '2026-05-15'
  },
  {
    id: 'rp-8', name: 'Mid-Year Marketing (SEO/Ads)',
    reach: 500, impact: 1.5, confidence: 70, effort: 2, score: (500*1.5*0.7)/2,
    startDate: '2026-06-01', endDate: '2026-07-01'
  },
  {
    id: 'rp-9', name: 'Portfolio Photo/Video Shoots',
    reach: 300, impact: 1.2, confidence: 90, effort: 1, score: (300*1.2*0.9)/1,
    startDate: '2026-07-15', endDate: '2026-08-15'
  }
);

// --- 2. Populate Monthly Objectives (Meta) ---
tasksByDate['meta-0'] = { objectives: "Assessment & Baseline: Consolidate data, Org chart, Meetings, KPI Scorecard", notes: "Focus on getting visibility first." };
tasksByDate['meta-1'] = { objectives: "Design & Tool Pilot: Chart of Accounts, BILL Setup, JobTread Audit", notes: "Don't switch everything at once. Parallel test." };
tasksByDate['meta-2'] = { objectives: "Build & Optimize: Deploy BILL/Gusto, Refine JobTread, KPI Dashboards", notes: "Go live with the new stack." };
tasksByDate['meta-3'] = { objectives: "Finalize System: Month-end close, Full Sync. Launch Deck Care.", notes: "Ensure automation is working." };
tasksByDate['meta-4'] = { objectives: "Peak Season Prep: Safety Training, Crew Staffing Finalized", notes: "Ramp up for summer." };
tasksByDate['meta-5'] = { objectives: "Marketing Push & Mid-Year Review Prep", notes: "Fill the pipeline for fall." };

// --- 3. Populate Specific Tasks ---
// Helper to add task to a date
const addTask = (date, text) => {
  if (!tasksByDate[date]) {
    tasksByDate[date] = { tasks: [] };
  }
  tasksByDate[date].tasks.push({
    id: getTaskId(),
    text,
    completed: false
  });
};

addTask('2026-01-12', 'Consolidate financials into master spreadsheet');
addTask('2026-01-12', 'Create org chart showing who owns what');
addTask('2026-01-12', 'Meet with QBO bookkeeper re: chart of accounts');
addTask('2026-01-16', 'Lock in meeting calendar (Non-negotiable)');

addTask('2026-01-19', 'Create initial KPI scorecard (Google Sheet)');
addTask('2026-01-19', 'Document current processes (Estimates, Time, Invoices)');
addTask('2026-01-19', 'Assign roles: Who approves payments? Who reconciles?');

addTask('2026-01-30', 'Deliverable: One-pager strategic summary (Current vs Future)');
addTask('2026-01-30', 'Deliverable: Budget for software/people/training');

addTask('2026-02-09', 'Redesign Chart of Accounts for Job Costing');
addTask('2026-02-09', 'Define Invoice Process Map');
addTask('2026-02-09', 'Create Month-end close checklist draft');

addTask('2026-02-16', 'Start BILL trial (Spend & Expense)');
addTask('2026-02-16', 'Connect one bank account to BILL');
addTask('2026-02-16', 'Tag 20 expenses by project in BILL');

addTask('2026-02-23', 'Demo Gusto');
addTask('2026-02-23', 'Audit JobTread: Ensure Cost Codes match new Chart of Accounts');
addTask('2026-02-27', 'Create Side-by-side software comparison doc');

addTask('2026-03-02', 'Finalize Month-end close process doc');
addTask('2026-03-02', 'Finalize Team roles matrix');

addTask('2026-03-09', 'Deploy BILL (Migrate all vendors/bills)');
addTask('2026-03-09', 'Deploy Gusto (Run first payroll)');

addTask('2026-03-16', 'Verify JobTread Estimate-to-Invoice workflow with new accounting codes');
addTask('2026-03-16', 'Review last 5 jobs in JobTread for Profitability accuracy');

addTask('2026-03-23', 'Build Weekly KPI Scorecard');
addTask('2026-03-23', 'Build Monthly Management Dashboard');

addTask('2026-03-30', 'Complete Month-end close using new process');
addTask('2026-03-30', 'Make QBO Integrations Official (BILL/Gusto/Bank)');

addTask('2026-04-13', 'Decide on Full-time vs Part-time Bookkeeper');


// --- 4. Populate Recurring Meetings (Preloaded Events) ---
// 2026 is the year.
const startDate = new Date('2026-01-01');
const endDate = new Date('2026-12-31');

// Iterate through the year
for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    const dateStr = d.toISOString().split('T')[0];
    const dayOfMonth = d.getDate();
    
    // Weekly Meetings
    // Monday (1): Sales, Estimating & Bid Review (8:00 AM)
    if (dayOfWeek === 1) {
        preloadedEvents.push({ id: getEventId(), date: dateStr, title: 'Sales & Bid Review (8am)', category: 'work' });
    }
    // Tuesday (2): 1:1 Project Manager (10:00 AM)
    if (dayOfWeek === 2) {
        preloadedEvents.push({ id: getEventId(), date: dateStr, title: '1:1 Project Manager (10am)', category: 'work' });
    }
    // Wednesday (3): 1:1 Bookkeeper/Finance (10:00 AM)
    if (dayOfWeek === 3) {
        preloadedEvents.push({ id: getEventId(), date: dateStr, title: '1:1 Finance (10am)', category: 'work' });
    }
    // Thursday (4): 1:1 Sales/Estimator (10:00 AM)
    if (dayOfWeek === 4) {
        preloadedEvents.push({ id: getEventId(), date: dateStr, title: '1:1 Sales (10am)', category: 'work' });
    }
    // Friday (5): Field/Crew Check-in (2:00 PM)
    if (dayOfWeek === 5) {
        preloadedEvents.push({ id: getEventId(), date: dateStr, title: 'Field Check-in (2pm)', category: 'work' });
        
        // Monthly Meetings (Fridays)
        if (dayOfMonth <= 7) {
             preloadedEvents.push({ id: getEventId(), date: dateStr, title: 'Monthly Financial Review (9am)', category: 'milestone' });
        } else if (dayOfMonth <= 14) {
             preloadedEvents.push({ id: getEventId(), date: dateStr, title: 'Project Mgmt Review (1pm)', category: 'milestone' });
        } else if (dayOfMonth <= 21) {
             preloadedEvents.push({ id: getEventId(), date: dateStr, title: 'Mgmt Strategy Meeting (10am)', category: 'milestone' });
        }
    }
}

// Annual & Quarterly Specific Dates
preloadedEvents.push({ id: getEventId(), date: '2026-03-27', title: 'QBR: End of Q1', category: 'milestone' });
preloadedEvents.push({ id: getEventId(), date: '2026-07-15', title: 'Mid-Year Review + Town Hall', category: 'milestone' });
preloadedEvents.push({ id: getEventId(), date: '2026-09-25', title: 'QBR: End of Q3', category: 'milestone' });
preloadedEvents.push({ id: getEventId(), date: '2026-01-10', title: 'Annual Strategic Planning', category: 'milestone' });

// --- 5. Generate SQL ---

const tasksJson = JSON.stringify(tasksByDate).replace(/'/g, "''");
const eventsJson = JSON.stringify(preloadedEvents).replace(/'/g, "''");
const riceJson = JSON.stringify(riceProjects).replace(/'/g, "''");

const sql = `
-- Update the "Deck Masters" plan with generated data (BILL & JobTread Optimized + Dated RICE)
UPDATE war_map_data
SET
    tasks_by_date = '${tasksJson}'::jsonb,
    preloaded_events = '${eventsJson}'::jsonb,
    rice_projects = '${riceJson}'::jsonb,
    updated_at = now()
WHERE name ILIKE '%Deck Masters%' OR name ILIKE '%DeckMasters%';
`;

fs.writeFileSync('update_deck_masters_plan_v2.sql', sql);
console.log('SQL file generated: update_deck_masters_plan_v2.sql');
