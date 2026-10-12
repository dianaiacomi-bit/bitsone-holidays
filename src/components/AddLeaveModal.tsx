import React, { useState, useMemo } from 'react';
import { Employee, LeaveCategory, LeaveRequest, PublicHoliday, UserRole } from '../types/holiday';
import { 
  formatYMD, 
  calculateBusinessDays, 
  isWeekend, 
  formatDisplayDate 
} from '../utils/dateUtils';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface AddLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newRequest: Omit<LeaveRequest, 'id' | 'requestedAt'>) => void;
  currentUser: Employee;
  userRole: UserRole;
  employees: Employee[];
  publicHolidays: PublicHoliday[];
  targetEmployeeId?: string | null;
}

export const AddLeaveModal: React.FC<AddLeaveModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  userRole,
  employees,
  publicHolidays,
  targetEmployeeId,
}) => {
  // Only Super Admin can add leave for others and pick leave types
  // Team Lead modal looks EXACTLY like the Simple User modal (only for themselves, Vacation Day)
  const isSuperAdmin = userRole === 'superadmin';

  // Employee search input (Super Admin only)
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(() => {
    if (isSuperAdmin && targetEmployeeId) {
      const match = employees.find((e) => e.id === targetEmployeeId);
      if (match) return match;
    }
    return !isSuperAdmin ? currentUser : null;
  });
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setStartDateStr('');
      setEndDateStr('');
      setDescription('');
      setEmployeeQuery('');
      setIsEmployeeDropdownOpen(false);
      setCategory('Vacation Day');
      if (isSuperAdmin && targetEmployeeId) {
        const match = employees.find((e) => e.id === targetEmployeeId);
        setSelectedEmployee(match || null);
      } else if (!isSuperAdmin) {
        setSelectedEmployee(currentUser);
      } else {
        setSelectedEmployee(null);
      }
    }
  }, [isOpen, targetEmployeeId, isSuperAdmin, employees, currentUser]);

  // Leave Type dropdown (Super Admin only)
  const [category, setCategory] = useState<LeaveCategory>('Vacation Day');

  // Dates: start with empty selection
  const [startDateStr, setStartDateStr] = useState<string>('');
  const [endDateStr, setEndDateStr] = useState<string>('');

  // Description
  const [description, setDescription] = useState('');

  // Dual-month navigation (base view date is the left month: Oct 2026, right month: Nov 2026)
  const [baseMonthDate, setBaseMonthDate] = useState<Date>(new Date(2026, 9, 1));

  const effectiveEmployee = useMemo(() => {
    return isSuperAdmin ? selectedEmployee : currentUser;
  }, [isSuperAdmin, selectedEmployee, currentUser]);

  const effectiveEndDate = endDateStr || startDateStr;

  const businessDays = useMemo(() => {
    if (!startDateStr) return 0;
    return calculateBusinessDays(startDateStr, effectiveEndDate, publicHolidays);
  }, [startDateStr, effectiveEndDate, publicHolidays]);

  const daysRemainingLive = useMemo(() => {
    if (!effectiveEmployee) return 0;
    return effectiveEmployee.daysRemaining - businessDays;
  }, [effectiveEmployee, businessDays]);

  const hasSelection = Boolean(startDateStr);
  const hasRange = Boolean(startDateStr && endDateStr && startDateStr !== endDateStr);

  const handleClearSelection = () => {
    setStartDateStr('');
    setEndDateStr('');
  };

  const filteredEmployees = useMemo(() => {
    if (!employeeQuery.trim()) return employees;
    return employees.filter((e) =>
      e.name.toLowerCase().includes(employeeQuery.toLowerCase())
    );
  }, [employees, employeeQuery]);

  if (!isOpen) return null;

  // Left month: baseMonthDate (October)
  const leftYear = baseMonthDate.getFullYear();
  const leftMonth = baseMonthDate.getMonth();
  const leftMonthName = baseMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Right month: baseMonthDate + 1 month (November)
  const rightMonthDate = new Date(leftYear, leftMonth + 1, 1);
  const rightYear = rightMonthDate.getFullYear();
  const rightMonth = rightMonthDate.getMonth();
  const rightMonthName = rightMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handlePrevMonths = () => {
    setBaseMonthDate(new Date(leftYear, leftMonth - 1, 1));
  };

  const handleNextMonths = () => {
    setBaseMonthDate(new Date(leftYear, leftMonth + 1, 1));
  };

  const handleDayClick = (y: number, m: number, dayNum: number) => {
    const clickedDate = new Date(y, m, dayNum);
    const clickedStr = formatYMD(clickedDate);

    if (!startDateStr || (startDateStr && endDateStr)) {
      setStartDateStr(clickedStr);
      setEndDateStr('');
    } else if (startDateStr && !endDateStr) {
      if (clickedStr < startDateStr) {
        setStartDateStr(clickedStr);
        setEndDateStr('');
      } else {
        setEndDateStr(clickedStr);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveEmployee) return;
    const finalEnd = endDateStr || startDateStr;
    if (!startDateStr || !finalEnd || businessDays === 0) return;

    onSubmit({
      employeeId: effectiveEmployee.id,
      employeeName: effectiveEmployee.name,
      teamId: effectiveEmployee.teamId,
      teamName: effectiveEmployee.teamName,
      category: isSuperAdmin ? category : 'Vacation Day',
      startDate: startDateStr,
      endDate: finalEnd,
      workingDays: businessDays,
      status: isSuperAdmin ? 'approved' : 'pending',
      daysLeft: daysRemainingLive,
      responsibleTl: effectiveEmployee.leadName || 'Dan Bilauca',
      description: description || undefined,
      approvedBy: isSuperAdmin ? currentUser.name : undefined,
      approvedAt: isSuperAdmin ? new Date().toISOString() : undefined,
    });

    onClose();
  };

  // Booking.com style month grid with continuous light grey band
  const renderMonthGrid = (y: number, m: number) => {
    const firstDay = new Date(y, m, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon = 0
    const totalDays = new Date(y, m + 1, 0).getDate();

    return (
      <div className="grid grid-cols-7 gap-y-1">
        {/* Empty cells before month start */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`offset-${i}`} className="h-8" />
        ))}

        {Array.from({ length: totalDays }).map((_, i) => {
          const dayNum = i + 1;
          const dateObj = new Date(y, m, dayNum);
          const dateStr = formatYMD(dateObj);
          const dayOfWeek = (startOffset + i) % 7; // 0 = Mon, 6 = Sun
          const isWk = isWeekend(dateObj);
          const isHoliday = publicHolidays.some((h) => h.date === dateStr);

          const isStart = startDateStr === dateStr;
          const isEnd = endDateStr === dateStr;
          const hasRange = Boolean(startDateStr && endDateStr && startDateStr < endDateStr);
          const isInRange = Boolean(hasRange && dateStr > startDateStr && dateStr < endDateStr);
          const isStartWithRange = isStart && hasRange;
          const isEndWithRange = isEnd && hasRange;

          return (
            <div key={dayNum} className="relative h-8 flex items-center justify-center p-0">
              {/* Continuous Light Grey Band Background (Booking.com style) */}
              {isStartWithRange && (
                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#F3F4F6] pointer-events-none" />
              )}
              {isEndWithRange && (
                <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-[#F3F4F6] pointer-events-none" />
              )}
              {isInRange && (
                <div
                  className={`absolute inset-0 bg-[#F3F4F6] pointer-events-none ${
                    dayOfWeek === 0 ? 'rounded-l-sm' : ''
                  } ${dayOfWeek === 6 || dayNum === totalDays ? 'rounded-r-sm' : ''}`}
                />
              )}

              {/* Day Button */}
              <button
                type="button"
                disabled={isWk || isHoliday}
                onClick={() => handleDayClick(y, m, dayNum)}
                className={`relative z-10 w-8 h-8 text-xs transition-colors flex items-center justify-center font-medium ${
                  isWk
                    ? 'text-gray-300 cursor-not-allowed'
                    : isHoliday
                    ? 'text-[#16A34A] font-bold bg-emerald-50 rounded-full cursor-not-allowed'
                    : isStart || isEnd
                    ? 'bg-[#111827] text-white font-bold rounded-full shadow-xs'
                    : isInRange
                    ? 'text-[#111827] font-semibold hover:bg-gray-200'
                    : 'text-[#111827] hover:bg-gray-100 rounded-full'
                }`}
              >
                {dayNum}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#111827]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-2xl w-full border border-[#E5E7EB] shadow-2xl overflow-hidden my-auto"
        style={{ borderRadius: '12px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-base font-medium text-[#111827]">
            {isSuperAdmin ? 'Add Leave for Employee' : 'Request Leave'}
          </h2>
          <button
            onClick={onClose}
            style={{ borderRadius: '8px' }}
            className="w-7 h-7 text-[#6B7280] hover:text-[#111827] flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Employee search & Leave Type on the SAME row (50/50 columns) (SUPER ADMIN view only) */}
          {isSuperAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Employee field */}
              <div className="relative">
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Employee
                </label>
                <input
                  type="text"
                  placeholder="Type to search employee..."
                  value={isEmployeeDropdownOpen ? employeeQuery : (selectedEmployee ? selectedEmployee.name : '')}
                  onChange={(e) => {
                    setEmployeeQuery(e.target.value);
                    setIsEmployeeDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setIsEmployeeDropdownOpen(true);
                    setEmployeeQuery('');
                  }}
                  style={{ borderRadius: '8px' }}
                  className="w-full h-[38px] text-xs px-3 bg-white border border-[#E5E7EB] focus:outline-none focus:border-[#E31B23] text-[#111827] font-medium"
                />

                {isEmployeeDropdownOpen && (
                  <div
                    className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E5E7EB] shadow-lg max-h-48 overflow-y-auto z-20"
                    style={{ borderRadius: '8px' }}
                  >
                    {filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setIsEmployeeDropdownOpen(false);
                          setEmployeeQuery('');
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#111827] hover:bg-gray-100 transition-colors flex items-center justify-between"
                      >
                        <span className="font-semibold">{emp.name}</span>
                        {/* Show only Days left: [number], without 'days' */}
                        <span className="text-[11px] text-[#6B7280]">
                          Days left: {emp.daysRemaining}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Leave Type field */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Leave type
                </label>
                <CustomSelect
                  value={category}
                  onChange={(e) => setCategory(e.target.value as LeaveCategory)}
                  className="w-full h-[38px]"
                  wrapperClassName="w-full"
                >
                  <option value="Vacation Day">Vacation Day (De odihna)</option>
                  <option value="Medical">Medical</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                  <option value="Special Leave">Special Leave (Marriage / Bereavement)</option>
                  <option value="Blood Donation">Blood Donation</option>
                  <option value="Recuperare">Recuperare</option>
                  <option value="Concediu fara plata">Concediu fara plata</option>
                </CustomSelect>
              </div>
            </div>
          )}

          {/* Date Range: Booking.com Style Dual Calendar Spanning 2 Months */}
          <div>
            <div className="flex items-center justify-between mb-1.5 min-h-[26px]">
              <label className="text-xs font-semibold text-[#111827]">
                Date range
              </label>

              {/* Single day shows once (“24 Dec 2026”); a range shows “start – end” */}
              {startDateStr && (
                <span
                  style={{ borderRadius: '8px' }}
                  className="px-2.5 py-1 text-[11px] font-medium bg-gray-100 text-[#111827] select-none"
                >
                  {hasRange
                    ? `${formatDisplayDate(startDateStr)} – ${formatDisplayDate(endDateStr)}`
                    : formatDisplayDate(startDateStr)}
                </span>
              )}
            </div>

            {/* Calendar Container with Left & Right Month */}
            <div
              className="bg-white border border-[#E5E7EB] p-3 shadow-2xs"
              style={{ borderRadius: '8px' }}
            >
              {/* Dual Month Header Nav */}
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={handlePrevMonths}
                  className="p-1 rounded text-[#6B7280] hover:text-[#111827] hover:bg-gray-100"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center justify-around flex-1 text-xs font-medium text-[#111827]">
                  <span>{leftMonthName}</span>
                  <span>{rightMonthName}</span>
                </div>
                <button
                  type="button"
                  onClick={handleNextMonths}
                  className="p-1 rounded text-[#6B7280] hover:text-[#111827] hover:bg-gray-100"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Two Columns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Left Month (October) */}
                <div>
                  <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-[#6B7280] mb-1">
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span className="text-gray-400">Sa</span>
                    <span className="text-gray-400">Su</span>
                  </div>
                  {renderMonthGrid(leftYear, leftMonth)}
                </div>

                {/* Column 2: Right Month (November) */}
                <div>
                  <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-[#6B7280] mb-1">
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span className="text-gray-400">Sa</span>
                    <span className="text-gray-400">Su</span>
                  </div>
                  {renderMonthGrid(rightYear, rightMonth)}
                </div>
              </div>

              {/* Leave days text directly under the calendar in-line with Clear selection */}
              <div className="mt-3 pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#111827]">
                <div>
                  Leave days: <span className="font-semibold">{businessDays} selected</span>{' '}
                  {effectiveEmployee ? `(${daysRemainingLive} days left)` : ''}
                </div>
                {hasSelection && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-xs font-medium text-[#6B7280] hover:text-[#111827] hover:underline transition-colors cursor-pointer"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description optional textarea */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">
              Description <span className="text-[#6B7280] font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ borderRadius: '8px' }}
              className="w-full text-xs p-2.5 bg-white border border-[#E5E7EB] focus:outline-none focus:border-[#E31B23] text-[#111827] placeholder:text-[#6B7280]"
            />
          </div>

          {/* Buttons: Cancel + Add and Approve Leave (8px radius) */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-[#111827] hover:underline"
            >
              Cancel
            </button>

            {isSuperAdmin ? (
              <button
                type="submit"
                disabled={businessDays === 0 || !effectiveEmployee}
                style={{ borderRadius: '8px' }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#E31B23] hover:bg-[#C9161E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
              >
                Add and approve leave
              </button>
            ) : (
              <button
                type="submit"
                disabled={businessDays === 0 || !effectiveEmployee}
                style={{ borderRadius: '8px' }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#E31B23] hover:bg-[#C9161E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
              >
                Submit request
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
