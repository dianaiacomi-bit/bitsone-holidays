import React, { useState, useMemo } from 'react';
import { LeaveRequest, PublicHoliday, UserRole, Employee } from '../types/holiday';
import { TEAMS_DATA } from '../data/mockData';
import { 
  getMonthWeeks, 
  formatYMD, 
  parseYMD 
} from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: LeaveRequest[];
  publicHolidays: PublicHoliday[];
  userRole: UserRole;
  currentUser: Employee;
}

// Built-in additional company leave data for calendar view (August 2026)
// 6 different people with short vacation days + 1 birthday, no repeating employees
const HUB_SAMPLE_LEAVES: LeaveRequest[] = [
  {
    id: 'cal-1',
    employeeId: 'emp-dan-b',
    employeeName: 'Dan Bilauca',
    teamId: 'team-dotnet',
    teamName: '.NET',
    category: 'Vacation Day',
    startDate: '2026-08-04',
    endDate: '2026-08-06',
    workingDays: 3,
    status: 'approved',
    responsibleTl: 'Dan Bilauca',
    daysLeft: 5,
    requestedAt: '2026-07-20T09:00:00Z',
  },
  {
    id: 'cal-2',
    employeeId: 'emp-diana-i',
    employeeName: 'Diana Iacomi',
    teamId: 'team-design',
    teamName: 'Design',
    category: 'Vacation Day',
    startDate: '2026-08-05',
    endDate: '2026-08-07',
    workingDays: 3,
    status: 'approved',
    responsibleTl: 'Carmen Zdroba',
    daysLeft: 1,
    requestedAt: '2026-07-22T10:00:00Z',
  },
  {
    id: 'cal-3',
    employeeId: 'emp-bogdan-d',
    employeeName: 'Bogdan Dreghici',
    teamId: 'team-dotnet',
    teamName: '.NET',
    category: 'Vacation Day',
    startDate: '2026-08-10',
    endDate: '2026-08-12',
    workingDays: 3,
    status: 'approved',
    responsibleTl: 'Dan Bilauca',
    daysLeft: 10,
    requestedAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'cal-4',
    employeeId: 'emp-claudia',
    employeeName: 'Claudia Pop',
    teamId: 'team-accounting',
    teamName: 'Accounting',
    category: 'Vacation Day',
    startDate: '2026-08-12',
    endDate: '2026-08-14',
    workingDays: 3,
    status: 'approved',
    responsibleTl: 'Monica Ratiu',
    daysLeft: 8,
    requestedAt: '2026-08-02T11:00:00Z',
  },
  {
    id: 'cal-5',
    employeeId: 'emp-claudiu-r',
    employeeName: 'Claudiu Radu Leustean',
    teamId: 'team-devops',
    teamName: 'Devops',
    category: 'Vacation Day',
    startDate: '2026-08-18',
    endDate: '2026-08-20',
    workingDays: 3,
    status: 'approved',
    responsibleTl: 'Larisa Groza',
    daysLeft: 6,
    requestedAt: '2026-08-05T14:00:00Z',
  },
  {
    id: 'cal-6',
    employeeId: 'emp-miruna',
    employeeName: 'Miruna Neagu',
    teamId: 'team-credibill',
    teamName: 'CrediBill',
    category: 'Vacation Day',
    startDate: '2026-08-25',
    endDate: '2026-08-27',
    workingDays: 3,
    status: 'approved',
    responsibleTl: 'Cristian Popescu',
    daysLeft: 7,
    requestedAt: '2026-08-10T12:00:00Z',
  },
  {
    id: 'cal-7',
    employeeId: 'emp-andrei-s',
    employeeName: 'Andrei Salagean',
    teamId: 'team-dotnet',
    teamName: '.NET',
    category: 'Birthday',
    startDate: '2026-08-21',
    endDate: '2026-08-21',
    workingDays: 1,
    status: 'approved',
    responsibleTl: 'Dan Bilauca',
    daysLeft: 8,
    requestedAt: '2026-08-01T08:00:00Z',
  },
];

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  requests,
  publicHolidays,
}) => {
  // Current viewed month (defaults to August 2026 matching the screenshot reference)
  const [viewDate, setViewDate] = useState<Date>(new Date(2026, 7, 1)); // August 2026

  // Team selector dropdown inside the modal. Default to "all" (All Teams).
  // This selector lives inside the modal — it does not inherit the table filter.
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Merge the requests prop and hub reference leaves, deduplicated by id
  const allAvailableLeaves = useMemo(() => {
    const map = new Map<string, LeaveRequest>();
    HUB_SAMPLE_LEAVES.forEach((l) => map.set(l.id, l));
    requests.forEach((r) => map.set(r.id, r));
    return Array.from(map.values()).filter(
      (r) => r.status === 'approved' || r.status === 'pending'
    );
  }, [requests]);

  // Filter leaves strictly by the modal's internal team selector
  const visibleRequests = useMemo(() => {
    if (selectedTeamId === 'all') {
      return allAvailableLeaves;
    }
    return allAvailableLeaves.filter((r) => r.teamId === selectedTeamId);
  }, [allAvailableLeaves, selectedTeamId]);

  const weeks = useMemo(() => {
    return getMonthWeeks(year, month, publicHolidays);
  }, [year, month, publicHolidays]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setViewDate(new Date(2026, 7, 1)); // Jump to August 2026 reference
  };

  // Bar colors matching Hub visual language & prompt:
  // - Vacation Day: Purple (#7048E8)
  // - National Day: Green (#16A34A)
  // - Medical: Yellow/Orange (#F59E0B)
  // - Blood donation: Red (#E31B23)
  // - Unpaid leave: Grey (#6B7280)
  // - Birthday: Magenta/Pink (#D946EF)
  const getBarColor = (category: string): { bg: string; text: string } => {
    switch (category) {
      case 'Vacation Day':
        return { bg: '#7048E8', text: '#FFFFFF' };
      case 'Medical':
        return { bg: '#F59E0B', text: '#FFFFFF' };
      case 'Blood Donation':
      case 'Blood donation':
        return { bg: '#E31B23', text: '#FFFFFF' };
      case 'Unpaid Leave':
      case 'Unpaid leave':
      case 'Concediu fara plata':
        return { bg: '#6B7280', text: '#FFFFFF' };
      case 'National Day':
        return { bg: '#16A34A', text: '#FFFFFF' };
      case 'Birthday':
        return { bg: '#D946EF', text: '#FFFFFF' };
      default:
        return { bg: '#7048E8', text: '#FFFFFF' };
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#111827]/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-5xl w-full border border-[#E5E7EB] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        style={{ borderRadius: '12px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Controls inside the modal (top row):
            Left side:
            1. Arrows left and right (ChevronLeft, ChevronRight)
            2. Month and year
            3. Selector (CustomSelect with Lucide icon, 12px left padding, 12px right gap)
            Right side:
            - This Month button at 16px from Close X button */}
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* 1. Navigation arrows left and right (using Lucide icons) */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                style={{ borderRadius: '8px' }}
                className="p-1.5 text-[#6B7280] hover:text-[#111827] rounded hover:bg-gray-100 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                style={{ borderRadius: '8px' }}
                className="p-1.5 text-[#6B7280] hover:text-[#111827] rounded hover:bg-gray-100 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Month and Year */}
            <h2 className="text-sm font-bold text-[#111827]">
              {monthName}
            </h2>

            {/* 3. Selector (Team dropdown using CustomSelect with Lucide icon and 12px left / right gap) */}
            <CustomSelect
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              <option value="all">All teams</option>
              {TEAMS_DATA.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </CustomSelect>
          </div>

          {/* Right side: This Month button at 16px from Close X */}
          <div className="flex items-center gap-[16px]">
            <button
              onClick={handleToday}
              style={{ borderRadius: '8px' }}
              className="px-3 py-1.5 text-xs font-semibold text-[#111827] bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-gray-100 transition-colors shadow-2xs"
            >
              This month
            </button>

            {/* Close X (using Lucide icon) */}
            <button
              onClick={onClose}
              style={{ borderRadius: '8px' }}
              className="w-8 h-8 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 flex items-center justify-center transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 bg-white">
          {/* Day of Week Headers (Monday to Sunday) */}
          <div className="grid grid-cols-7 border-b border-[#D1D5DB] pb-2 text-center text-xs font-bold text-[#374151] uppercase tracking-wider">
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
            <div>SUN</div>
          </div>

          {/* Weeks Rows */}
          <div className="divide-y divide-[#D1D5DB] border-b border-[#D1D5DB]">
            {weeks.map((week) => {
              const weekStartStr = week.days[0].dateStr;
              const weekEndStr = week.days[6].dateStr;

              // Find requests overlapping this week
              const weekRequests = visibleRequests.filter((r) => {
                return r.startDate <= weekEndStr && r.endDate >= weekStartStr;
              });

              // Public statutory holidays active in this week
              const weekHolidays = publicHolidays.filter((h) => {
                return h.date >= weekStartStr && h.date <= weekEndStr;
              });

              // Combine holidays as special items to display in the lanes
              interface CalendarItem {
                id: string;
                title: string;
                startStr: string;
                endStr: string;
                color: { bg: string; text: string };
              }

              const itemsToRender: CalendarItem[] = [];

              // Convert holidays to items
              weekHolidays.forEach((hol) => {
                itemsToRender.push({
                  id: `hol-${hol.date}`,
                  title: hol.name.length > 20 ? `${hol.name.slice(0, 18)}...` : hol.name,
                  startStr: hol.date,
                  endStr: hol.date,
                  color: { bg: '#16A34A', text: '#FFFFFF' },
                });
              });

              // Convert leave requests to items
              weekRequests.forEach((req) => {
                itemsToRender.push({
                  id: req.id,
                  title: req.category === 'Birthday' ? `${req.employeeName} (Birthday)` : req.employeeName,
                  startStr: req.startDate,
                  endStr: req.endDate,
                  color: getBarColor(req.category),
                });
              });

              // Sort items: leaves starting earlier first; if same start, longer leaves first
              itemsToRender.sort((a, b) => {
                if (a.startStr !== b.startStr) {
                  return a.startStr.localeCompare(b.startStr);
                }
                return b.endStr.localeCompare(a.endStr);
              });

              // Lane Allocation Algorithm (Max 3 visible lanes: 0, 1, 2)
              // Each lane tracks which columns (0..6) are occupied
              const MAX_VISIBLE_LANES = 3;
              const laneOccupancy: boolean[][] = [
                Array(7).fill(false),
                Array(7).fill(false),
                Array(7).fill(false),
              ];

              interface PlacedItem {
                item: CalendarItem;
                laneIndex: number;
                startCol: number;
                endCol: number;
              }

              const placedItems: PlacedItem[] = [];
              const dayOverflowCounts = Array(7).fill(0);
              const dayOverflowNames: string[][] = Array.from({ length: 7 }, () => []);

              itemsToRender.forEach((it) => {
                // Determine start column in this week (0..6)
                let startCol = 0;
                if (it.startStr >= weekStartStr) {
                  const idx = week.days.findIndex((d) => d.dateStr === it.startStr);
                  startCol = idx >= 0 ? idx : 0;
                }

                // Determine end column in this week (0..6)
                let endCol = 6;
                if (it.endStr <= weekEndStr) {
                  const idx = week.days.findIndex((d) => d.dateStr === it.endStr);
                  endCol = idx >= 0 ? idx : 6;
                }

                // Find lowest free lane among the 3 visible lanes
                let foundLane = -1;
                for (let l = 0; l < MAX_VISIBLE_LANES; l++) {
                  let isFree = true;
                  for (let c = startCol; c <= endCol; c++) {
                    if (laneOccupancy[l][c]) {
                      isFree = false;
                      break;
                    }
                  }
                  if (isFree) {
                    foundLane = l;
                    break;
                  }
                }

                if (foundLane !== -1) {
                  // Mark lane occupied
                  for (let c = startCol; c <= endCol; c++) {
                    laneOccupancy[foundLane][c] = true;
                  }
                  placedItems.push({
                    item: it,
                    laneIndex: foundLane,
                    startCol,
                    endCol,
                  });
                } else {
                  // Overflowed: increment overflow count for each day column in range
                  for (let c = startCol; c <= endCol; c++) {
                    dayOverflowCounts[c] += 1;
                    dayOverflowNames[c].push(it.title);
                  }
                }
              });

              return (
                <div key={week.weekIndex} className="relative min-h-[110px] py-1 border-r border-[#E5E7EB]">
                  {/* Background 7 Day Grid Cells */}
                  <div className="grid grid-cols-7 absolute inset-0 pointer-events-none divide-x divide-[#E5E7EB]">
                    {week.days.map((day, idx) => (
                      <div
                        key={idx}
                        className={`h-full p-1.5 flex flex-col justify-between ${
                          !day.isCurrentMonth
                            ? 'bg-gray-50/70 text-gray-400'
                            : 'text-[#111827]'
                        }`}
                      >
                        {/* Day Number (Centered / Clean Header, neutral text) */}
                        <div className="text-center">
                          <span
                            className={`text-xs font-semibold ${
                              !day.isCurrentMonth
                                ? 'text-gray-400'
                                : 'text-[#111827]'
                            }`}
                          >
                            {day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber}
                          </span>
                        </div>

                        {/* Static "+N more" label at the bottom of the day cell if overflowed */}
                        <div className="text-center h-4 flex items-center justify-center">
                          {dayOverflowCounts[idx] > 0 && (
                            <span 
                              title={`Additional off: ${dayOverflowNames[idx].join(', ')}`}
                              className="text-[10px] font-semibold text-[#3B82F6] select-none cursor-default"
                            >
                              +{dayOverflowCounts[idx]} more
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Foreground Layer: Continuous Horizontal Slim Labeled Bars */}
                  <div className="relative pt-6 pb-5 pointer-events-none" style={{ minHeight: '80px' }}>
                    {placedItems.map((placed) => {
                      const leftPercent = (placed.startCol / 7) * 100;
                      const spanDays = placed.endCol - placed.startCol + 1;
                      const widthPercent = (spanDays / 7) * 100;

                      // Top position: 24px base for lane 0, each lane 18px height + 2px vertical gap
                      const topPx = 24 + placed.laneIndex * 20;

                      return (
                        <div
                          key={placed.item.id + week.weekIndex}
                          className="absolute h-[18px] flex items-center px-1.5 shadow-2xs select-none pointer-events-none"
                          style={{
                            top: `${topPx}px`,
                            left: `calc(${leftPercent}% + 2px)`,
                            width: `calc(${widthPercent}% - 4px)`,
                            backgroundColor: placed.item.color.bg,
                            borderRadius: '3px',
                          }}
                        >
                          {/* The employee's name IS printed on the bar */}
                          <span
                            className="truncate text-[10px] font-semibold leading-[18px] block w-full"
                            style={{ color: placed.item.color.text }}
                          >
                            {placed.item.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend at the bottom of the modal: colored dot + label for each leave type */}
        <div className="px-5 py-3 border-t border-[#E5E7EB] bg-white flex flex-wrap items-center justify-start gap-5 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#7048E8' }} />
            <span className="text-[#111827] font-medium">Vacation Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#16A34A' }} />
            <span className="text-[#111827] font-medium">National Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
            <span className="text-[#111827] font-medium">Medical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#E31B23' }} />
            <span className="text-[#111827] font-medium">Blood donation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#6B7280' }} />
            <span className="text-[#111827] font-medium">Unpaid leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#D946EF' }} />
            <span className="text-[#111827] font-medium">Birthday</span>
          </div>
        </div>
      </div>
    </div>
  );
};
