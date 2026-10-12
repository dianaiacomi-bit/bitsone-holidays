import { PublicHoliday } from '../types/holiday';

export function parseYMD(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function calculateBusinessDays(
  startDateStr: string,
  endDateStr: string,
  publicHolidays: PublicHoliday[]
): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = parseYMD(startDateStr);
  const end = parseYMD(endDateStr);
  if (start > end) return 0;

  let businessDays = 0;
  const curr = new Date(start);

  while (curr <= end) {
    const ymd = formatYMD(curr);
    const isWknd = isWeekend(curr);
    const isHoliday = publicHolidays.some(h => h.date === ymd);

    if (!isWknd && !isHoliday) {
      businessDays++;
    }
    curr.setDate(curr.getDate() + 1);
  }

  return businessDays;
}

export interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
}

export interface CalendarWeek {
  weekIndex: number;
  days: CalendarDay[];
}

/**
 * Returns weeks from Monday to Sunday covering the month
 */
export function getMonthWeeks(
  year: number,
  monthIndex: number,
  publicHolidays: PublicHoliday[]
): CalendarWeek[] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);

  // Monday = 0, Sunday = 6
  let startDayOfWeek = firstOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  // Find start date of the first week (could be in previous month)
  const calendarStart = new Date(firstOfMonth);
  calendarStart.setDate(calendarStart.getDate() - startDayOfWeek);

  const weeks: CalendarWeek[] = [];
  const current = new Date(calendarStart);
  let weekIndex = 0;

  while (current <= lastOfMonth || current.getDay() !== 1) {
    const weekDays: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = formatYMD(current);
      const isCurrentMonth = current.getMonth() === monthIndex;
      const isWknd = current.getDay() === 0 || current.getDay() === 6;
      const hol = publicHolidays.find((h) => h.date === dateStr);

      weekDays.push({
        date: new Date(current),
        dateStr,
        dayNumber: current.getDate(),
        isCurrentMonth,
        isWeekend: isWknd,
        isHoliday: !!hol,
        holidayName: hol?.name,
      });

      current.setDate(current.getDate() + 1);
    }

    weeks.push({
      weekIndex,
      days: weekDays,
    });
    weekIndex++;

    // Safety guard to avoid infinite loop
    if (weeks.length >= 6) break;
  }

  return weeks;
}
