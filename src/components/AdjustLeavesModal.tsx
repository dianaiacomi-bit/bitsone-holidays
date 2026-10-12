import React, { useState, useMemo } from 'react';
import { Employee } from '../types/holiday';
import { X } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface AdjustLeavesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAdjustment: (employeeId: string, adjustmentType: 'add' | 'deduct', days: number, reason: string) => void;
  employees: Employee[];
  targetEmployeeId?: string | null;
}

export const AdjustLeavesModal: React.FC<AdjustLeavesModalProps> = ({
  isOpen,
  onClose,
  onSaveAdjustment,
  employees,
  targetEmployeeId,
}) => {
  // Employee search and select
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(() => {
    if (targetEmployeeId) {
      const match = employees.find((e) => e.id === targetEmployeeId);
      if (match) return match;
    }
    return null;
  });
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);

  // Sync selectedEmployee when modal opens or targetEmployeeId changes
  React.useEffect(() => {
    if (isOpen) {
      setEmployeeQuery('');
      setIsEmployeeDropdownOpen(false);
      setDays(1);
      setReason('');
      setAdjustmentType('add');
      if (targetEmployeeId) {
        const match = employees.find((e) => e.id === targetEmployeeId);
        setSelectedEmployee(match || null);
      } else {
        setSelectedEmployee(null);
      }
    }
  }, [isOpen, targetEmployeeId, employees]);

  // Adjustment Type (Add Days / Deduct Days)
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add');

  // Number of Days: default 1
  const [days, setDays] = useState<number | ''>(1);

  // Description (Required text area, placeholder "Reason for adjustment...")
  const [reason, setReason] = useState<string>('');

  const currentBalance = selectedEmployee?.daysRemaining ?? null;
  const newBalance = useMemo(() => {
    if (currentBalance === null) return null;
    const val = Number(days) || 0;
    return adjustmentType === 'add' ? currentBalance + val : currentBalance - val;
  }, [currentBalance, adjustmentType, days]);

  const filteredEmployees = useMemo(() => {
    if (!employeeQuery.trim()) return employees;
    return employees.filter((e) =>
      e.name.toLowerCase().includes(employeeQuery.toLowerCase())
    );
  }, [employees, employeeQuery]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !reason.trim() || !days || Number(days) <= 0) return;

    onSaveAdjustment(selectedEmployee.id, adjustmentType, Number(days), reason);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#111827]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-lg w-full border border-[#E5E7EB] shadow-2xl overflow-hidden my-auto"
        style={{ borderRadius: '12px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-base font-medium text-[#111827]">
            Adjust Leave Balance
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
          {/* Employee search (2/3) and Number of Days (1/3) on the SAME row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Employee field - 2/3 width */}
            <div className="relative sm:col-span-2">
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Employee
              </label>
              <div className="relative">
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
                  className="w-full h-[38px] text-xs pl-3 pr-8 bg-white border border-[#E5E7EB] focus:outline-none focus:border-[#E31B23] text-[#111827] font-medium"
                />
                {(selectedEmployee || employeeQuery) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEmployee(null);
                      setEmployeeQuery('');
                      setIsEmployeeDropdownOpen(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[#9CA3AF] hover:text-[#111827] hover:bg-gray-100 rounded-full transition-colors"
                    title="Clear employee"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

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
                      <span className="text-[11px] text-[#6B7280]">
                        Days left: {emp.daysRemaining}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Number of Days field - 1/3 width */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Number of days
              </label>
              <input
                type="number"
                min={1}
                max={50}
                step={1}
                value={days}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setDays('');
                  } else {
                    const parsed = parseInt(val, 10);
                    if (isNaN(parsed)) {
                      setDays('');
                    } else {
                      // Cannot go below 1
                      setDays(Math.max(1, parsed));
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' && (days === '' || Number(days) <= 1)) {
                    e.preventDefault();
                    setDays(1);
                  }
                }}
                style={{ borderRadius: '8px' }}
                className="w-full h-[38px] text-xs px-3 bg-white border border-[#E5E7EB] focus:outline-none focus:border-[#E31B23] text-[#111827] font-medium"
              />
            </div>
          </div>

          {/* Adjustment Type: dropdown — Add Days / Deduct Days */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">
              Adjustment type
            </label>
            <CustomSelect
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'deduct')}
              className="w-full h-[38px]"
              wrapperClassName="w-full"
            >
              <option value="add">Add Days</option>
              <option value="deduct">Deduct Days</option>
            </CustomSelect>
          </div>

          {/* Description: required text area, "Reason for adjustment..." */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">
              Description <span className="text-[#E31B23]">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Reason for adjustment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ borderRadius: '8px' }}
              className="w-full text-xs p-2.5 bg-white border border-[#E5E7EB] focus:outline-none focus:border-[#E31B23] text-[#111827] placeholder:text-[#6B7280]"
            />
          </div>

          {/* Live balance preview: "Current balance: 14 days → New balance: 16 days (+2)" */}
          <div
            className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] flex items-center text-xs"
            style={{ borderRadius: '8px' }}
          >
            {currentBalance !== null ? (
              <span className="text-[#374151]">
                <span className="font-normal">Current balance: {currentBalance} days →</span>{' '}
                <span className="font-semibold">
                  New balance:{' '}
                  {newBalance !== null && days !== ''
                    ? `${newBalance} days`
                    : `${currentBalance} days`}
                </span>
                {days !== '' && Number(days) > 0 && (
                  <>
                    {' '}
                    <span
                      className={`font-semibold ${
                        adjustmentType === 'add' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                      }`}
                    >
                      ({adjustmentType === 'add' ? `+${days}` : `−${days}`})
                    </span>
                  </>
                )}
              </span>
            ) : (
              <span className="text-[#6B7280]">
                Select an employee to see current and new balance.
              </span>
            )}
          </div>

          {/* Buttons: Cancel + Save Adjustment */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-[#111827] hover:underline"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!selectedEmployee || !reason.trim() || !days || Number(days) <= 0}
              style={{ borderRadius: '8px' }}
              className="px-4 py-2 text-xs font-semibold text-white transition-colors shadow-xs disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed enabled:bg-[#E31B23] enabled:hover:bg-[#C9161E] enabled:font-bold"
            >
              Confirm adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
