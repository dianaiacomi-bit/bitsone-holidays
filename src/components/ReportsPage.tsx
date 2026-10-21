import React, { useState, useMemo } from 'react';
import { 
  EMPLOYEES_DATA, 
  INITIAL_LEAVE_REQUESTS, 
  PUBLIC_HOLIDAYS_2026 
} from '../data/mockData';
import { Employee, LeaveRequest } from '../types/holiday';
import { CustomSelect } from './CustomSelect';
import { Download, CheckCircle2 } from 'lucide-react';

interface ReportsPageProps {
  employees?: Employee[];
  requests?: LeaveRequest[];
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Romanian single-letter day abbreviations: D (Duminică), L (Luni), M (Marți), M (Miercuri), J (Joi), V (Vineri), S (Sâmbătă)
const ROMANIAN_WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

// Realistic functions for company employees
const EMPLOYEE_FUNCTIONS: Record<string, string> = {
  'emp-monica-r': 'Chief Financial Officer',
  'emp-dan-b': 'Team Lead / Senior .NET Developer',
  'emp-diana-i': 'UI/UX Designer',
  'emp-andrei-s': 'Senior .NET Developer',
  'emp-bogdan-d': 'Backend .NET Developer',
  'emp-rafael-b': 'Full-stack .NET Developer',
  'emp-cosmin-m': 'Software Engineer',
  'emp-simona-v': 'Senior Accountant',
  'emp-oana-v': 'Financial Analyst',
  'emp-elena-d': 'Payroll Specialist',
  'emp-attila-k': 'Lead Full-stack Developer',
  'emp-zoltan-n': 'Frontend Engineer',
  'emp-laszlo-t': 'Full-stack Developer',
  'emp-arpad-b': 'Software Engineer',
  'emp-cristian-p': 'Lead Solutions Architect',
  'emp-mihai-s': 'Backend Developer',
  'emp-roxana-p': 'QA Automation Engineer',
  'emp-george-m': 'Software Engineer',
  'emp-bogdan-m': 'Lead Software Engineer',
  'emp-alina-r': 'Frontend Developer',
  'emp-paul-f': 'Backend Engineer',
  'emp-denisa-c': 'QA Automation Specialist',
  'emp-carmen-z': 'Lead Product Designer',
  'emp-mihaela-p': 'Senior Visual Designer',
  'emp-larisa-g': 'Lead DevOps Engineer',
  'emp-andrei-i': 'Lead Mobile Developer',
  'emp-mihai-d': 'Senior Full-stack Engineer',
  'emp-radu-c': 'Lead Magento Developer',
  'emp-adrian-s': 'Operations Director',
  'emp-gabriel-e': 'Full-stack Engineer',
  'emp-alexandru-n': 'Senior Python Developer',
  'emp-vlad-t': 'Fintech Backend Engineer',
  'emp-sorin-m': 'Sales Director',
  'emp-florin-b': 'Embedded Systems Lead',
  'emp-ovidiu-p': 'Chief Executive Officer',
  'emp-catalin-g': 'Lead Software Architect',
};

function getEmployeeFunction(emp: Employee): string {
  if (EMPLOYEE_FUNCTIONS[emp.id]) {
    return EMPLOYEE_FUNCTIONS[emp.id];
  }
  if (emp.isLead) {
    return `Lead ${emp.teamName} Specialist`;
  }
  return `${emp.teamName} Software Engineer`;
}

interface DayReport {
  dayNumber: number;
  dateStr: string;
  dayOfWeek: number;
  weekdayLabel: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isCO: boolean;
  workedHours: number;
}

interface EmployeeMonthReport {
  employee: Employee;
  functionTitle: string;
  days: DayReport[];
  totalWorkedHours: number;
  normaHours: number;
  coHours: number;
  boHours: number;
  cfsHours: number;
  zileCO: number;
  zileBO: number;
  zileDeleg: number;
  zileNeangajat: number;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  employees: propEmployees,
  requests: propRequests,
}) => {
  const employees = propEmployees || EMPLOYEES_DATA;
  const requests = propRequests || INITIAL_LEAVE_REQUESTS;

  // Real world reference: 2026-10 (October 2026 is current month)
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed (9 = October)

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [activeMonth, setActiveMonth] = useState<number>(currentMonth);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // When year changes, ensure activeMonth is not disabled in the new year
  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    if (newYear === currentYear && activeMonth > currentMonth) {
      setActiveMonth(currentMonth);
    }
  };

  // Number of days in the currently selected month
  const daysInActiveMonth = useMemo(() => {
    return new Date(selectedYear, activeMonth + 1, 0).getDate();
  }, [selectedYear, activeMonth]);

  // Total standard business days in the active month
  const totalBusinessDaysInMonth = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= daysInActiveMonth; d++) {
      const date = new Date(selectedYear, activeMonth, d);
      const dow = date.getDay();
      if (dow !== 0 && dow !== 6) {
        const dateStr = `${selectedYear}-${String(activeMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isPublicHoliday = PUBLIC_HOLIDAYS_2026.some((h) => h.date === dateStr);
        if (!isPublicHoliday) {
          count++;
        }
      }
    }
    return count;
  }, [selectedYear, activeMonth, daysInActiveMonth]);

  const monthlyNorma = totalBusinessDaysInMonth * 8;

  // Build report per employee for the active month
  const reportsData: EmployeeMonthReport[] = useMemo(() => {
    return employees.map((emp) => {
      const functionTitle = getEmployeeFunction(emp);
      const days: DayReport[] = [];

      let workedHours = 0;
      let zileCO = 0;
      let zileBO = 0;
      let zileCFS = 0;

      for (let d = 1; d <= daysInActiveMonth; d++) {
        const date = new Date(selectedYear, activeMonth, d);
        const dow = date.getDay();
        const dateStr = `${selectedYear}-${String(activeMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isWeekend = dow === 0 || dow === 6;

        const holiday = PUBLIC_HOLIDAYS_2026.find((h) => h.date === dateStr);
        const isHoliday = !!holiday && !isWeekend;

        // Check if employee has an approved leave covering this date
        const approvedLeave = requests.find(
          (r) =>
            r.employeeId === emp.id &&
            r.status === 'approved' &&
            r.startDate <= dateStr &&
            r.endDate >= dateStr
        );

        let isCO = false;
        let dayWorked = 0;

        if (isWeekend) {
          dayWorked = 0;
        } else if (isHoliday) {
          dayWorked = 0;
        } else if (approvedLeave) {
          if (approvedLeave.category === 'Vacation Day') {
            isCO = true;
            zileCO++;
            dayWorked = 0;
          } else if (approvedLeave.category === 'Medical') {
            zileBO++;
            dayWorked = 0;
          } else if (
            approvedLeave.category === 'Unpaid Leave' ||
            approvedLeave.category === 'Concediu fara plata'
          ) {
            zileCFS++;
            dayWorked = 0;
          } else {
            isCO = true;
            zileCO++;
            dayWorked = 0;
          }
        } else {
          // Standard full-time workday auto-filled from Jira
          dayWorked = 8;
          workedHours += 8;
        }

        days.push({
          dayNumber: d,
          dateStr,
          dayOfWeek: dow,
          weekdayLabel: ROMANIAN_WEEKDAYS[dow],
          isWeekend,
          isHoliday,
          holidayName: holiday?.name,
          isCO,
          workedHours: dayWorked,
        });
      }

      return {
        employee: emp,
        functionTitle,
        days,
        totalWorkedHours: workedHours,
        normaHours: monthlyNorma,
        coHours: zileCO * 8,
        boHours: zileBO * 8,
        cfsHours: zileCFS * 8,
        zileCO,
        zileBO,
        zileDeleg: 0,
        zileNeangajat: 0,
      };
    });
  }, [employees, requests, selectedYear, activeMonth, daysInActiveMonth, monthlyNorma]);

  // Export current month's pontaj as CSV
  const handleExport = () => {
    const monthName = FULL_MONTH_NAMES[activeMonth];
    const daysHeader = Array.from({ length: 31 }, (_, i) => String(i + 1));
    const headers = [
      'Nr.',
      'Nume',
      'Functie',
      ...daysHeader,
      'Total ore lucrate',
      'Norma',
      'CO',
      'BO',
      'CFS',
      'Zile CO',
      'Zile BO',
      'Zile deleg',
      'Zile neangajat',
    ];

    const rows = reportsData.map((rep, idx) => {
      const dayValues = Array.from({ length: 31 }, (_, i) => {
        const dayIdx = i;
        if (dayIdx >= daysInActiveMonth) {
          return '-';
        }
        const d = rep.days[dayIdx];
        if (d.isWeekend) return 'W';
        if (d.isHoliday) return 'LIB';
        if (d.isCO) return 'CO';
        return String(d.workedHours);
      });

      return [
        idx + 1,
        `"${rep.employee.name}"`,
        `"${rep.functionTitle}"`,
        ...dayValues,
        rep.totalWorkedHours,
        rep.normaHours,
        rep.coHours,
        rep.boHours,
        rep.cfsHours,
        rep.zileCO,
        rep.zileBO,
        rep.zileDeleg,
        rep.zileNeangajat,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Pontaj_BitStone_${monthName}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported pontaj for ${monthName} ${selectedYear}.`);
  };

  return (
    <div className="space-y-3">
      {/* 1. Page Header: Title (Figtree 500 font-medium) + Single Export Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-[#111827]">
            Reports
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Monthly attendance & worked hours report auto-filled from Jira and approved leave requests.
          </p>
        </div>

        {/* Single Export button that exports the currently open month's pontaj */}
        <button
          onClick={handleExport}
          style={{ borderRadius: '8px' }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#E31B23] hover:bg-[#c9141b] transition-colors shadow-2xs cursor-pointer active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export pontaj</span>
        </button>
      </div>

      {/* 2. Month Tabs + Year Selector Bar directly on page surface with bottom border divider */}
      <div className="border-b border-[#E5E7EB] pb-3 flex flex-wrap items-center justify-between gap-3">
        {/* Month tabs row - matching Requests tabs UI */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 sm:pb-0 scrollbar-thin text-xs font-semibold">
          {MONTH_NAMES.map((label, idx) => {
            const isFutureMonth =
              (selectedYear === currentYear && idx > currentMonth) ||
              selectedYear > currentYear;
            const isActive = activeMonth === idx;

            if (isFutureMonth) {
              return (
                <button
                  key={label}
                  disabled
                  style={{ borderRadius: '8px' }}
                  title="Future month not available"
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-300 cursor-not-allowed select-none whitespace-nowrap"
                >
                  {label}
                </button>
              );
            }

            return (
              <button
                key={label}
                onClick={() => setActiveMonth(idx)}
                style={{ borderRadius: '8px' }}
                className={`px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-gray-100 text-[#111827]'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Right side: ONLY the Year Selector */}
        <div className="flex items-center ml-auto">
          <CustomSelect
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="h-8 text-xs font-semibold"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </CustomSelect>
        </div>
      </div>

      {/* 3. Table Surface & Fixed-height Container for permanent horizontal scrollbar visibility */}
      <div
        className="bg-white border border-[#E5E7EB] shadow-xs overflow-hidden flex flex-col"
        style={{ borderRadius: '12px' }}
      >
        {/* Fixed-height container: horizontal scrollbar is ALWAYS visible in viewport */}
        <div 
          style={{ height: 'calc(100vh - 220px)', minHeight: '380px' }}
          className="overflow-auto relative"
        >
          <table className="w-full border-collapse text-left text-xs">
            {/* Sticky Header Row */}
            <thead className="sticky top-0 z-20 bg-[#F9FAFB] shadow-[0_1px_2px_rgba(0,0,0,0.06)] select-none">
              <tr className="border-b border-[#E5E7EB] text-[#374151] font-semibold text-[11px]">
                {/* 1. Row number (#) - Sticky left: 0 */}
                <th className="sticky top-0 left-0 z-30 bg-[#F9FAFB] px-1.5 py-1.5 text-center w-8 min-w-[32px] max-w-[32px] border-r border-[#E5E7EB]">
                  #
                </th>

                {/* 2. Name - Sticky left: 32px with thin sticky right divider line */}
                <th
                  style={{
                    boxShadow: '2px 0 4px rgba(0, 0, 0, 0.05)',
                  }}
                  className="sticky top-0 left-[32px] z-30 bg-[#F9FAFB] px-2.5 py-1.5 w-[145px] min-w-[145px] max-w-[145px] border-r border-[#D1D5DB] relative"
                >
                  <span>Name</span>
                  <span className="absolute right-0 top-0 bottom-0 w-px bg-[#D1D5DB] pointer-events-none z-30" />
                </th>

                {/* 3. Function - Scrollable (sticky top only for header row) */}
                <th className="sticky top-0 z-20 bg-[#F9FAFB] px-2 py-1.5 w-[115px] min-w-[115px] max-w-[115px] border-r border-[#E5E7EB]">
                  Function
                </th>

                {/* 4. Days 1–31 with Romanian weekday letter ABOVE day number */}
                {Array.from({ length: 31 }, (_, i) => {
                  const dayNum = i + 1;
                  const exists = dayNum <= daysInActiveMonth;
                  const date = exists
                    ? new Date(selectedYear, activeMonth, dayNum)
                    : null;
                  const dow = date ? date.getDay() : null;
                  const isWeekend = dow === 0 || dow === 6;

                  return (
                    <th
                      key={dayNum}
                      className={`py-1 px-0.5 text-center min-w-[28px] max-w-[28px] border-r border-[#E5E7EB] ${
                        !exists
                          ? 'bg-gray-100/60 text-gray-300'
                          : isWeekend
                          ? 'bg-[#E5E7EB]/80 text-[#374151] font-bold'
                          : 'bg-[#F9FAFB] text-[#111827]'
                      }`}
                    >
                      <div className="flex flex-col items-center leading-tight">
                        {/* Weekday letter ABOVE day number */}
                        <span className={`text-[9px] font-bold ${isWeekend ? 'text-[#1F2937]' : 'text-[#6B7280]'}`}>
                          {exists && dow !== null ? ROMANIAN_WEEKDAYS[dow] : '-'}
                        </span>
                        {/* Day number */}
                        <span className="text-[10px] font-semibold">{dayNum}</span>
                      </div>
                    </th>
                  );
                })}

                {/* 5. Summary columns (Light grey fill to separate from white day grid) */}
                <th className="px-2 py-1.5 text-right min-w-[70px] bg-[#F3F4F6] text-[#111827] font-bold border-l-2 border-[#D1D5DB] border-r border-[#E5E7EB] whitespace-nowrap">
                  Total ore lucrate
                </th>
                <th className="px-1.5 py-1.5 text-right min-w-[50px] bg-[#F3F4F6] text-[#374151] font-semibold border-r border-[#E5E7EB] whitespace-nowrap">
                  Norma
                </th>
                <th className="px-1.5 py-1.5 text-right min-w-[42px] bg-[#F3F4F6] text-[#374151] font-semibold border-r border-[#E5E7EB] whitespace-nowrap">
                  CO
                </th>
                <th className="px-1.5 py-1.5 text-right min-w-[42px] bg-[#F3F4F6] text-[#374151] font-semibold border-r border-[#E5E7EB] whitespace-nowrap">
                  BO
                </th>
                <th className="px-1.5 py-1.5 text-right min-w-[42px] bg-[#F3F4F6] text-[#374151] font-semibold border-r border-[#E5E7EB] whitespace-nowrap">
                  CFS
                </th>
                <th className="px-1.5 py-1.5 text-right min-w-[50px] bg-[#F3F4F6] text-[#374151] font-semibold border-r border-[#E5E7EB] whitespace-nowrap">
                  Zile CO
                </th>
                <th className="px-1.5 py-1.5 text-right min-w-[50px] bg-[#F3F4F6] text-[#374151] font-semibold border-r border-[#E5E7EB] whitespace-nowrap">
                  Zile BO
                </th>
                <th className="px-1.5 py-1.5 text-right min-w-[56px] bg-[#F3F4F6] text-[#374151] font-semibold border-r border-[#E5E7EB] whitespace-nowrap">
                  Zile deleg
                </th>
                <th className="px-2 py-1.5 text-right min-w-[70px] bg-[#F3F4F6] text-[#374151] font-semibold whitespace-nowrap">
                  Zile neangajat
                </th>
              </tr>
            </thead>

            {/* Table Body (Compact rows, reduced padding, text wrapping on Name & Function) */}
            <tbody className="divide-y divide-[#E5E7EB]">
              {reportsData.map((rep, rowIndex) => {
                return (
                  <tr
                    key={rep.employee.id}
                    className="group hover:bg-[#F9FAFB] transition-colors"
                  >
                    {/* 1. Row number (#) - Sticky left: 0 */}
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-[#F9FAFB] px-1 py-1 text-center text-[10px] font-medium text-[#6B7280] border-r border-[#E5E7EB] w-8 min-w-[32px] max-w-[32px]">
                      {rowIndex + 1}
                    </td>

                    {/* 2. Name - Sticky left: 32px with thin sticky right divider line */}
                    <td
                      style={{
                        boxShadow: '2px 0 4px rgba(0, 0, 0, 0.05)',
                      }}
                      className="sticky left-[32px] z-10 bg-white group-hover:bg-[#F9FAFB] px-2.5 py-1 text-xs font-bold text-[#111827] border-r border-[#D1D5DB] w-[145px] min-w-[145px] max-w-[145px] leading-snug break-words whitespace-normal relative"
                    >
                      <span>{rep.employee.name}</span>
                      <span className="absolute right-0 top-0 bottom-0 w-px bg-[#D1D5DB] pointer-events-none z-20" />
                    </td>

                    {/* 3. Function - Scrollable */}
                    <td
                      title={rep.functionTitle}
                      className="px-2 py-1 text-[11px] font-normal text-[#4B5563] border-r border-[#E5E7EB] w-[115px] min-w-[115px] max-w-[115px] leading-snug break-words whitespace-normal bg-white group-hover:bg-[#F9FAFB]"
                    >
                      {rep.functionTitle}
                    </td>

                    {/* 4. Days 1–31 */}
                    {Array.from({ length: 31 }, (_, i) => {
                      const dayNum = i + 1;
                      const exists = dayNum <= daysInActiveMonth;

                      if (!exists) {
                        return (
                          <td
                            key={dayNum}
                            className="px-0.5 py-1 text-center text-[10px] text-gray-300 bg-gray-50/50 border-r border-[#E5E7EB] select-none"
                          >
                            -
                          </td>
                        );
                      }

                      const d = rep.days[i];

                      // Weekend: distinct grey column shade (S, D)
                      if (d.isWeekend) {
                        return (
                          <td
                            key={dayNum}
                            className="px-0.5 py-1 text-center text-[10px] text-gray-400 bg-gray-100/70 border-r border-[#E5E7EB] select-none"
                          >
                            -
                          </td>
                        );
                      }

                      // Public Holiday
                      if (d.isHoliday) {
                        return (
                          <td
                            key={dayNum}
                            title={d.holidayName || 'Public Holiday'}
                            className="px-0.5 py-1 text-center text-[10px] text-emerald-700 font-semibold bg-emerald-50/50 border-r border-[#E5E7EB]"
                          >
                            -
                          </td>
                        );
                      }

                      // Vacation Leave (CO): red letters "CO" on red-100 fill directly in cell, no pill, no container
                      if (d.isCO) {
                        return (
                          <td
                            key={dayNum}
                            title="Concediu de Odihnă (8h)"
                            className="px-0.5 py-1 text-center text-[11px] font-bold bg-red-100 text-[#E31B23] border-r border-[#E5E7EB]"
                          >
                            CO
                          </td>
                        );
                      }

                      // Standard working day auto-filled from Jira (8h)
                      return (
                        <td
                          key={dayNum}
                          className="px-0.5 py-1 text-center text-[11px] font-normal text-[#111827] bg-white group-hover:bg-[#F9FAFB] border-r border-[#E5E7EB]"
                        >
                          {d.workedHours}
                        </td>
                      );
                    })}

                    {/* 5. Summary columns (Light grey fill to separate from white day grid) */}
                    {/* Total ore lucrate: bold (headline number per person) */}
                    <td className="px-2 py-1 text-right text-[11px] font-bold text-[#111827] bg-[#F9FAFB] group-hover:bg-[#F3F4F6] border-l-2 border-[#D1D5DB] border-r border-[#E5E7EB] tabular-nums">
                      {rep.totalWorkedHours}
                    </td>

                    {/* Norma: bolder (bold weight) */}
                    <td className="px-1.5 py-1 text-right text-[11px] font-bold text-[#111827] bg-[#F9FAFB] group-hover:bg-[#F3F4F6] border-r border-[#E5E7EB] tabular-nums">
                      {rep.normaHours}
                    </td>

                    {/* CO (hours): regular weight matching day numbers */}
                    <td className="px-1.5 py-1 text-right text-[11px] font-normal text-[#111827] bg-[#F9FAFB] group-hover:bg-[#F3F4F6] border-r border-[#E5E7EB] tabular-nums">
                      {rep.coHours}
                    </td>

                    {/* BO (hours): regular weight matching day numbers */}
                    <td className="px-1.5 py-1 text-right text-[11px] font-normal text-[#111827] bg-[#F9FAFB] group-hover:bg-[#F3F4F6] border-r border-[#E5E7EB] tabular-nums">
                      {rep.boHours}
                    </td>

                    {/* CFS (hours): regular weight matching day numbers */}
                    <td className="px-1.5 py-1 text-right text-[11px] font-normal text-[#111827] bg-[#F9FAFB] group-hover:bg-[#F3F4F6] border-r border-[#E5E7EB] tabular-nums">
                      {rep.cfsHours}
                    </td>

                    {/* Zile CO: regular weight matching day numbers */}
                    <td className="px-1.5 py-1 text-right text-[11px] font-normal text-[#111827] bg-[#F9FAFB] group-hover:bg-[#F3F4F6] border-r border-[#E5E7EB] tabular-nums">
                      {rep.zileCO}
                    </td>

                    {/* Zile BO: regular weight matching day numbers */}
                    <td className="px-1.5 py-1 text-right text-[11px] font-normal text-[#111827] bg-[#F9FAFB] group-hover:bg-[#F3F4F6] border-r border-[#E5E7EB] tabular-nums">
                      {rep.zileBO}
                    </td>

                    {/* Zile deleg: regular weight matching day numbers */}
                    <td className="px-1.5 py-1 text-right text-[11px] font-normal text-[#111827] bg-[#F9FAFB] group-hover:bg-[#F3F4F6] border-r border-[#E5E7EB] tabular-nums">
                      {rep.zileDeleg}
                    </td>

                    {/* Zile neangajat: regular weight matching day numbers */}
                    <td className="px-2 py-1 text-right text-[11px] font-normal text-[#111827] bg-[#F9FAFB] group-hover:bg-[#F3F4F6] tabular-nums">
                      {rep.zileNeangajat}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div
          style={{ borderRadius: '8px' }}
          className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-4 py-3 shadow-xl border border-gray-800 flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom-2"
        >
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
