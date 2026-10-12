import React, { useState, useEffect, useMemo } from 'react';
import { LeaveRequest, Employee, UserRole, BalanceAdjustment } from '../types/holiday';
import { formatDisplayDate } from '../utils/dateUtils';
import { MoreVertical, Download, X } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface SimpleUserDashboardProps {
  currentUser: Employee;
  userRole?: UserRole;
  requests: LeaveRequest[];
  adjustments?: BalanceAdjustment[];
  onDownloadPdf: (req: LeaveRequest) => void;
  onCancelRequest?: (id: string) => void;
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

export const SimpleUserDashboard: React.FC<SimpleUserDashboardProps> = ({
  currentUser,
  userRole = 'employee',
  requests,
  adjustments = [],
  onDownloadPdf,
  onCancelRequest,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Base standard allocation for selected year
  const baseAllocation =
    currentUser.totalDaysByYear?.[selectedYear] || 25;

  // Filter adjustments for this user in selected year
  const userAdjustmentsForYear = useMemo(() => {
    return adjustments.filter((adj) => {
      if (adj.employeeId !== currentUser.id) return false;
      const yearStr = adj.date ? adj.date.substring(0, 4) : adj.adjustedAt.substring(0, 4);
      return yearStr === String(selectedYear);
    });
  }, [adjustments, currentUser.id, selectedYear]);

  // Total adjusted days granted in this year
  const totalAdjustedDays = useMemo(() => {
    return userAdjustmentsForYear.reduce((sum, adj) => {
      const delta = adj.adjustmentType === 'add' ? adj.days : -adj.days;
      return sum + delta;
    }, 0);
  }, [userAdjustmentsForYear]);

  // Format Total Leave days: e.g. 25 (+2) or 25
  const totalLeaveDisplay = useMemo(() => {
    if (totalAdjustedDays > 0) {
      return (
        <span className="flex items-baseline gap-1">
          <span className="text-sm font-medium text-[#111827]">{baseAllocation}</span>
          <span className="text-xs font-normal text-[#6B7280]">
            (+{totalAdjustedDays})
          </span>
        </span>
      );
    }
    if (totalAdjustedDays < 0) {
      return (
        <span className="flex items-baseline gap-1">
          <span className="text-sm font-medium text-[#111827]">{baseAllocation}</span>
          <span className="text-xs font-normal text-[#6B7280]">
            ({totalAdjustedDays})
          </span>
        </span>
      );
    }
    return <span className="text-sm font-medium text-[#111827]">{baseAllocation}</span>;
  }, [baseAllocation, totalAdjustedDays]);

  // Filter requests for this employee in the selected year
  const myRequests = useMemo(() => {
    return requests.filter(
      (r) =>
        r.employeeId === currentUser.id &&
        r.startDate.startsWith(String(selectedYear))
    );
  }, [requests, currentUser.id, selectedYear]);

  // Pending: days in requests awaiting approval
  const pendingDays = useMemo(() => {
    return myRequests
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + (r.workingDays || 0), 0);
  }, [myRequests]);

  // Used: days used so far this year
  const usedDays = useMemo(() => {
    const approvedCount = myRequests
      .filter((r) => r.status === 'approved')
      .reduce((sum, r) => sum + (r.workingDays || 0), 0);
    if (approvedCount > 0) return approvedCount;
    // Inferred used days so far this year if not fully itemized in mock
    const inferred = baseAllocation + totalAdjustedDays - currentUser.daysRemaining - pendingDays;
    return inferred > 0 ? inferred : 0;
  }, [myRequests, baseAllocation, totalAdjustedDays, currentUser.daysRemaining, pendingDays]);

  // Is approver (Super Admin or Team Lead)
  const isApprover = userRole === 'superadmin' || userRole === 'lead';

  // Combined History items (Requests + Adjustments), sorted chronologically descending
  const historyItems: CombinedHistoryItem[] = useMemo(() => {
    const list: CombinedHistoryItem[] = [];

    // Map requests
    for (const req of myRequests) {
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
    for (const adj of userAdjustmentsForYear) {
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
  }, [myRequests, userAdjustmentsForYear]);

  // Download adjustment statement
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

  // Awaiting approval (days in requests awaiting approval)
  const awaitingApproval = useMemo(() => {
    return myRequests
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + (r.workingDays || 0), 0);
  }, [myRequests]);

  // Days used (approved days taken so far this year)
  const daysUsed = useMemo(() => {
    const approvedCount = myRequests
      .filter((r) => r.status === 'approved')
      .reduce((sum, r) => sum + (r.workingDays || 0), 0);
    if (approvedCount > 0) return approvedCount;
    return Math.max(0, totalEffectiveDays - (currentUser.daysRemaining || 0) - awaitingApproval);
  }, [myRequests, totalEffectiveDays, currentUser.daysRemaining, awaitingApproval]);

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
      {/* Page Title: "My Leaves" (Figtree 500 / font-medium, 2xl, dark, no icon) */}
      <h1 className="text-2xl font-medium text-[#111827]">
        My Leaves
      </h1>

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
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="text-3xl font-medium text-[#111827]">
                {baseAllocation}
              </span>
              {totalAdjustedDays !== 0 && (
                <span className="text-base font-medium text-[#111827]">
                  ({totalAdjustedDays > 0 ? `+${totalAdjustedDays}` : totalAdjustedDays})
                </span>
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

      {/* 2. Below the strip: user's own leave history table renamed to "History" */}
      <div
        className="bg-white border border-[#D1D5DB] shadow-xs"
        style={{ borderRadius: '12px' }}
      >
        {/* Table header renamed to "History", font-medium */}
        <div className="p-4 border-b border-[#D1D5DB] font-medium text-sm text-[#111827]">
          History
        </div>

        {historyItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6B7280]">
            No leave requests recorded for {selectedYear}.
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
                  {/* Keep Current Team Lead column ONLY for Simple User; removed for Super Admin and Team Lead */}
                  {!isApprover && (
                    <th className="px-4 py-3.5">CURRENT TEAM LEAD</th>
                  )}
                  <th className="px-5 py-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1D5DB]">
                {historyItems.map((item, idx) => {
                  // For the last 2 rows, open menu upwards so it is never clipped
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
                      {/* DURATION (strictly Figtree 500, no font-mono) */}
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

                      {/* TYPE: Same height as Status pill (h-[26px]), 8px border radius */}
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

                      {/* DESCRIPTION column */}
                      <td className="px-4 py-4 text-[#4B5563] text-xs max-w-xs break-words">
                        {item.description}
                      </td>

                      {/* STATUS: Same height as Type pill (h-[26px]), 40px radius, NO colored dot, soft tinted background with darker fill */}
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

                      {/* CURRENT TEAM LEAD: only rendered for Simple User */}
                      {!isApprover && (
                        <td className="px-4 py-4 text-[#111827] font-medium whitespace-nowrap">
                          {item.rawRequest?.responsibleTl || currentUser.leadName || 'Dan Bilauca'}
                        </td>
                      )}

                      {/* ACTIONS: 3-dots icon button with dropdown menu, never clipped */}
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
                              {item.isAdjustment && item.rawAdjustment ? (
                                <button
                                  onClick={() => {
                                    handleDownloadAdjustmentDoc(item.rawAdjustment!);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[#111827] hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Download className="w-3.5 h-3.5 text-[#6B7280]" />
                                  <span>Download</span>
                                </button>
                              ) : item.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => {
                                      if (item.rawRequest) onCancelRequest?.(item.rawRequest.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-[#111827] hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <X className="w-3.5 h-3.5 text-[#6B7280]" />
                                    <span>Cancel request</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (item.rawRequest) onDownloadPdf(item.rawRequest);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-[#111827] hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Download className="w-3.5 h-3.5 text-[#6B7280]" />
                                    <span>Download</span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (item.rawRequest) onDownloadPdf(item.rawRequest);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[#111827] hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Download className="w-3.5 h-3.5 text-[#6B7280]" />
                                  <span>Download</span>
                                </button>
                              )}
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
