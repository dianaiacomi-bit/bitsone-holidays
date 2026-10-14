import React, { useState, useEffect, useMemo } from 'react';
import { Employee, LeaveRequest, BalanceAdjustment } from '../types/holiday';
import { formatDisplayDate } from '../utils/dateUtils';
import { ArrowLeft, MoreVertical, Download, Info } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface EmployeeDetailsPageProps {
  employee: Employee;
  employees: Employee[];
  requests: LeaveRequest[];
  adjustments: BalanceAdjustment[];
  onBack: () => void;
  onDownloadPdf: (req: LeaveRequest) => void;
}

interface CombinedHistoryItem {
  id: string;
  isAdjustment: boolean;
  dateForSort: string;
  durationText: string;
  fromText: string;
  toText: string;
  type: string;
  description: string;
  status: 'applied' | 'approved' | 'pending' | 'declined';
  rawRequest?: LeaveRequest;
  rawAdjustment?: BalanceAdjustment;
}

export const EmployeeDetailsPage: React.FC<EmployeeDetailsPageProps> = ({
  employee,
  requests,
  adjustments,
  onBack,
  onDownloadPdf,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Base standard allocation for selected year
  const baseAllocation = employee.totalDaysByYear?.[selectedYear] || 25;

  // Adjustments for this employee in the selected year
  const employeeAdjustmentsForYear = useMemo(() => {
    return adjustments.filter((adj) => {
      if (adj.employeeId !== employee.id) return false;
      const yearStr = adj.date ? adj.date.substring(0, 4) : adj.adjustedAt.substring(0, 4);
      return yearStr === String(selectedYear);
    });
  }, [adjustments, employee.id, selectedYear]);

  // Total adjusted days granted in this year
  const totalAdjustedDays = useMemo(() => {
    return employeeAdjustmentsForYear.reduce((sum, adj) => {
      const delta = adj.adjustmentType === 'add' ? adj.days : -adj.days;
      return sum + delta;
    }, 0);
  }, [employeeAdjustmentsForYear]);

  const [showAdjustmentsTooltip, setShowAdjustmentsTooltip] = useState<boolean>(false);

  // Close tooltip on outside click
  useEffect(() => {
    if (!showAdjustmentsTooltip) return;
    const handleClickOutside = () => setShowAdjustmentsTooltip(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showAdjustmentsTooltip]);

  // Breakdown for tooltip: e.g. "Base allocation: 25 days + Adjustments: +1 Blood donation, +1 Birthday = Total: 27 days"
  const adjustmentsBreakdownText = useMemo(() => {
    if (employeeAdjustmentsForYear.length === 0) return '';
    const items = employeeAdjustmentsForYear.map((adj) => {
      const sign = adj.adjustmentType === 'add' ? '+' : '-';
      return `${sign}${adj.days} ${adj.description || 'Adjustment'}`;
    });
    return `Base allocation: ${baseAllocation} days + Adjustments: ${items.join(', ')} = Total: ${baseAllocation + totalAdjustedDays} days`;
  }, [employeeAdjustmentsForYear, baseAllocation, totalAdjustedDays]);

  // Leave requests for this employee in the selected year
  const employeeRequestsForYear = useMemo(() => {
    return requests.filter(
      (r) => r.employeeId === employee.id && r.startDate.startsWith(String(selectedYear))
    );
  }, [requests, employee.id, selectedYear]);

  // Pending days
  const pendingDays = useMemo(() => {
    return employeeRequestsForYear
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + (r.workingDays || 0), 0);
  }, [employeeRequestsForYear]);

  // Used days
  const usedDays = useMemo(() => {
    const approvedCount = employeeRequestsForYear
      .filter((r) => r.status === 'approved')
      .reduce((sum, r) => sum + (r.workingDays || 0), 0);
    if (approvedCount > 0) return approvedCount;
    const inferred = baseAllocation + totalAdjustedDays - employee.daysRemaining - pendingDays;
    return inferred > 0 ? inferred : 0;
  }, [employeeRequestsForYear, baseAllocation, totalAdjustedDays, employee.daysRemaining, pendingDays]);

  // Combined History items (Requests + Adjustments), sorted chronologically descending
  const historyItems: CombinedHistoryItem[] = useMemo(() => {
    const list: CombinedHistoryItem[] = [];

    // Map requests
    for (const req of employeeRequestsForYear) {
      list.push({
        id: req.id,
        isAdjustment: false,
        dateForSort: req.startDate,
        durationText: `${req.workingDays} ${req.workingDays === 1 ? 'day' : 'days'}`,
        fromText: formatDisplayDate(req.startDate),
        toText: formatDisplayDate(req.endDate),
        type: req.category,
        description: req.description || '—',
        status: req.status,
        rawRequest: req,
      });
    }

    // Map adjustments
    for (const adj of employeeAdjustmentsForYear) {
      const sign = adj.adjustmentType === 'add' ? '+' : '-';
      const dateDisplay = adj.date ? formatDisplayDate(adj.date) : '—';
      list.push({
        id: adj.id,
        isAdjustment: true,
        dateForSort: adj.date || adj.adjustedAt.split('T')[0],
        durationText: `${sign}${adj.days} ${adj.days === 1 ? 'day' : 'days'}`,
        fromText: dateDisplay,
        toText: dateDisplay,
        type: 'Adjustment',
        description: adj.description || 'Adjustment',
        status: 'applied',
        rawAdjustment: adj,
      });
    }

    // Sort chronologically descending
    return list.sort((a, b) => b.dateForSort.localeCompare(a.dateForSort));
  }, [employeeRequestsForYear, employeeAdjustmentsForYear]);

  // Download Adjustment TXT
  const handleDownloadAdjustmentDoc = (adj: BalanceAdjustment) => {
    const content = `BITSTONE LEAVE ADJUSTMENT RECORD
========================================
Employee: ${adj.employeeName}
Adjustment: ${adj.adjustmentType === 'add' ? `+${adj.days}` : `-${adj.days}`} business days
Date Applied: ${adj.date || adj.adjustedAt.split('T')[0]}
Reason: ${adj.description}
Status: APPLIED
Record ID: ${adj.id}
Generated: ${new Date().toLocaleDateString('en-GB')}
========================================
BitStone Holidays · hub.bitstone.eu`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BitStone-Adjustment-${adj.employeeName.replace(/\s+/g, '-')}-${adj.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Data consistency: Total Leave days INCLUDING adjustments
  const totalEffectiveDays = baseAllocation + totalAdjustedDays;

  // Awaiting approval (days in pending requests for the selected year)
  const awaitingApproval = useMemo(() => {
    return employeeRequestsForYear
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + (r.workingDays || 0), 0);
  }, [employeeRequestsForYear]);

  // Days used (approved days taken so far this year)
  const daysUsed = useMemo(() => {
    const approvedCount = employeeRequestsForYear
      .filter((r) => r.status === 'approved')
      .reduce((sum, r) => sum + (r.workingDays || 0), 0);
    if (approvedCount > 0) return approvedCount;
    return Math.max(0, totalEffectiveDays - (employee.daysRemaining || 0) - awaitingApproval);
  }, [employeeRequestsForYear, totalEffectiveDays, employee.daysRemaining, awaitingApproval]);

  // Days Left: Days used + Awaiting approval + Days Left MUST equal Total Leave days INCLUDING adjustments
  const daysLeft = Math.max(0, totalEffectiveDays - daysUsed - awaitingApproval);

  // Usage bar proportions:
  // The whole bar length = Total Leave days including adjustments
  // Filled portion = Days used (from left) + Awaiting approval (flush next)
  // Grey remainder = Days Left
  const totalForBar = Math.max(totalEffectiveDays, 1);
  const usedWidth = Math.max(0, Math.min(100, (daysUsed / totalForBar) * 100));
  const awaitingWidth = Math.max(0, Math.min(100 - usedWidth, (awaitingApproval / totalForBar) * 100));

  return (
    <div className="space-y-6">
      {/* Top back navigation & page title */}
      <div className="space-y-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to employees</span>
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-medium text-[#111827]">{employee.name}</h1>
            {employee.isLead && (
              <span
                style={{ borderRadius: '40px' }}
                className="bg-[#111827] text-white text-[11px] font-semibold px-2.5 py-0.5"
              >
                Team Lead
              </span>
            )}
          </div>
          <span className="text-xs text-[#6B7280] font-medium">
            {employee.teams && employee.teams.length > 0
              ? employee.teams.join(', ')
              : employee.teamName}
          </span>
        </div>
      </div>

      {/* Summary Strip (sits directly on the page, no card background, no border) */}
      <div className="space-y-4">
        {/* Top: 5 evenly distributed sections (Days Left, Awaiting approval, Days used, Total Leave days, Year) */}
        <div className="grid grid-cols-2 sm:grid-cols-12 gap-y-4 gap-x-6 items-start w-full">
          {/* 1. Days left (first) */}
          <div className="sm:col-span-2 flex flex-col">
            <span className="text-[13px] font-medium text-[#6B7280] mb-2.5">
              Days left
            </span>
            <span className="text-3xl font-medium text-[#111827] leading-none">
              {daysLeft}
            </span>
          </div>

          {/* 2. Pending */}
          <div className="sm:col-span-2 flex flex-col">
            <span className="text-[13px] font-medium text-[#6B7280] mb-2.5">
              Pending
            </span>
            <span className="text-3xl font-medium text-[#111827] leading-none">
              {awaitingApproval}
            </span>
          </div>

          {/* 3. Days used */}
          <div className="sm:col-span-2 flex flex-col">
            <span className="text-[13px] font-medium text-[#6B7280] mb-2.5">
              Days used
            </span>
            <span className="text-3xl font-medium text-[#111827] leading-none">
              {daysUsed}
            </span>
          </div>

          {/* 4. Total leave days */}
          <div className="sm:col-span-3 flex flex-col">
            <span className="text-[13px] font-medium text-[#6B7280] mb-2.5">
              Total leave days
            </span>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-3xl font-medium text-[#111827]">
                {totalEffectiveDays}
              </span>
              {employeeAdjustmentsForYear.length > 0 && (
                <div
                  className="relative group inline-flex items-center"
                  onMouseEnter={() => setShowAdjustmentsTooltip(true)}
                  onMouseLeave={() => setShowAdjustmentsTooltip(false)}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAdjustmentsTooltip((prev) => !prev);
                    }}
                    aria-label="View adjustments breakdown"
                    className="p-0.5 text-[#9CA3AF] hover:text-[#111827] focus:outline-none transition-colors"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  <div
                    role="tooltip"
                    className={`absolute bottom-full left-0 sm:left-1/2 sm:-translate-x-1/2 mb-2 px-3 py-2 text-xs font-normal text-white bg-[#111827] rounded-md shadow-xl z-50 pointer-events-none transition-all duration-150 max-w-[280px] sm:max-w-none sm:whitespace-nowrap ${
                      showAdjustmentsTooltip
                        ? 'opacity-100 visible'
                        : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                    }`}
                  >
                    {adjustmentsBreakdownText}
                    <div className="absolute top-full left-3 sm:left-1/2 sm:-translate-x-1/2 -mt-px border-4 border-transparent border-t-[#111827]" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. Year selector: a bit more room than the metrics */}
          <div className="sm:col-span-3 flex flex-col sm:items-end">
            <span className="text-[13px] font-medium text-[#6B7280] mb-2.5">
              Year
            </span>
            <CustomSelect
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white text-[#111827] border border-[#E5E7EB] hover:bg-gray-50 focus:border-[#E31B23] shadow-2xs font-medium text-sm w-[110px]"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </CustomSelect>
          </div>
        </div>

        {/* USAGE BAR: Consumed vs remaining */}
        <div className="w-full flex flex-col gap-2 pt-1">
          <div className="w-full bg-[#E5E7EB] rounded-[4px] h-[16px] overflow-hidden flex">
            {usedWidth > 0 && (
              <div
                style={{ width: `${usedWidth}%` }}
                className="bg-[#475569] h-full transition-all duration-300"
                title={`Days used: ${daysUsed} days`}
              />
            )}
            {awaitingWidth > 0 && (
              <div
                style={{ width: `${awaitingWidth}%` }}
                className="bg-[#F59E0B] h-full transition-all duration-300"
                title={`Pending: ${awaitingApproval} days`}
              />
            )}
          </div>

          {/* Legend: dot for Days used and Pending only (no counts in parentheses) */}
          <div className="flex items-center gap-5 text-xs text-[#6B7280] font-medium pt-0.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#475569]" />
              <span>Days used</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span>Pending</span>
            </span>
          </div>
        </div>
      </div>

      {/* History table titled "History" */}
      <div
        className="bg-white border border-[#D1D5DB] shadow-xs"
        style={{ borderRadius: '12px' }}
      >
        <div className="p-4 border-b border-[#D1D5DB] font-medium text-sm text-[#111827]">
          History
        </div>

        {historyItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6B7280]">
            No leave or adjustment records found for {selectedYear}.
          </div>
        ) : (
          <div className="overflow-visible">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D1D5DB] bg-[#F3F4F6] text-[#374151] uppercase tracking-wider font-semibold text-[11px]">
                  <th className="px-5 py-3.5">DURATION</th>
                  <th className="px-4 py-3.5">FROM</th>
                  <th className="px-4 py-3.5">TO</th>
                  <th className="px-4 py-3.5">TYPE</th>
                  <th className="px-4 py-3.5">DESCRIPTION</th>
                  <th className="px-4 py-3.5">STATUS</th>
                  <th className="px-5 py-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1D5DB]">
                {historyItems.map((item, idx) => {
                  const openUpwards = idx >= historyItems.length - 2;

                  return (
                    <tr
                      key={item.id}
                      className={
                        item.isAdjustment
                          ? 'bg-amber-50/20 hover:bg-amber-50/40 transition-colors'
                          : 'hover:bg-gray-100/70 transition-colors'
                      }
                    >
                      {/* DURATION */}
                      <td className="px-5 py-4 font-medium text-[#111827] whitespace-nowrap">
                        <span
                          className={
                            item.isAdjustment && item.durationText.startsWith('+')
                              ? 'text-[#065F46] font-semibold'
                              : ''
                          }
                        >
                          {item.durationText}
                        </span>
                      </td>

                      {/* FROM */}
                      <td className="px-4 py-4 text-[#111827] whitespace-nowrap">
                        {item.fromText}
                      </td>

                      {/* TO */}
                      <td className="px-4 py-4 text-[#111827] whitespace-nowrap">
                        {item.toText}
                      </td>

                      {/* TYPE */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          style={{ borderRadius: '8px' }}
                          className={`h-[26px] inline-flex items-center px-2.5 text-[11px] font-medium border whitespace-nowrap ${
                            item.isAdjustment
                              ? 'border-amber-300 text-amber-900 bg-amber-50'
                              : 'border-gray-300 text-[#111827] bg-white'
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>

                      {/* DESCRIPTION */}
                      <td className="px-4 py-4 text-[#4B5563] text-xs max-w-xs break-words">
                        {item.description}
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {item.status === 'applied' ? (
                          <span
                            style={{ borderRadius: '40px' }}
                            className="h-[26px] inline-flex items-center px-3 text-[11px] font-semibold bg-gray-100 text-[#374151] whitespace-nowrap"
                          >
                            Applied
                          </span>
                        ) : item.status === 'approved' ? (
                          <span
                            style={{ borderRadius: '40px' }}
                            className="h-[26px] inline-flex items-center px-3 text-[11px] font-semibold bg-emerald-100 text-[#064E3B] whitespace-nowrap"
                          >
                            Approved
                          </span>
                        ) : item.status === 'pending' ? (
                          <span
                            style={{ borderRadius: '40px' }}
                            className="h-[26px] inline-flex items-center px-3 text-[11px] font-semibold bg-orange-100 text-[#7C2D12] whitespace-nowrap"
                          >
                            Pending
                          </span>
                        ) : (
                          <span
                            style={{ borderRadius: '40px' }}
                            className="h-[26px] inline-flex items-center px-3 text-[11px] font-semibold bg-red-100 text-[#7F1D1D] whitespace-nowrap"
                          >
                            Declined
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === item.id ? null : item.id);
                            }}
                            style={{ borderRadius: '8px' }}
                            className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openMenuId === item.id && (
                            <div
                              style={{ borderRadius: '8px' }}
                              className={`absolute right-0 ${
                                openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'
                              } w-36 bg-white border border-[#D1D5DB] shadow-lg py-1 z-50 text-left text-xs font-medium`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  if (item.isAdjustment && item.rawAdjustment) {
                                    handleDownloadAdjustmentDoc(item.rawAdjustment);
                                  } else if (item.rawRequest) {
                                    onDownloadPdf(item.rawRequest);
                                  }
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-[#111827] hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Download className="w-3.5 h-3.5 text-[#6B7280]" />
                                <span>Download</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
