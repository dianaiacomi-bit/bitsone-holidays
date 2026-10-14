import React, { useState, useMemo, useEffect } from 'react';
import { LeaveRequest, Employee, UserRole, RequestStatus, Team } from '../types/holiday';
import { formatDisplayDate } from '../utils/dateUtils';
import { Calendar as CalendarIcon, Search, MoreVertical, Check, X, Download, Trash2, Ban } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface RequestsPageProps {
  requests: LeaveRequest[];
  employees: Employee[];
  teams: Team[];
  userRole: UserRole;
  currentUser: Employee;
  teamLeadScope?: '1team' | '3teams';
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onDelete?: (id: string) => void;
  onCancelRequest?: (id: string) => void;
  onOpenCalendar: () => void;
  onDownloadPdf: (req: LeaveRequest) => void;
}

export const RequestsPage: React.FC<RequestsPageProps> = ({
  requests,
  employees,
  teams,
  userRole,
  currentUser,
  teamLeadScope = '1team',
  onApprove,
  onDeny,
  onDelete,
  onCancelRequest,
  onOpenCalendar,
  onDownloadPdf,
}) => {
  // Led teams for the team lead
  const leadTeams = useMemo(() => {
    if (userRole !== 'lead') return [];
    if (teamLeadScope === '1team') {
      return teams.filter((t) => t.id === currentUser.teamId);
    }
    // 3-teams mode
    const ledTeamNames = currentUser.teams || ['.NET', 'Devops', 'Curaden'];
    return teams.filter((t) => ledTeamNames.includes(t.name) || t.id === currentUser.teamId);
  }, [userRole, teamLeadScope, teams, currentUser]);

  const hasMultipleTeams = userRole === 'lead' && leadTeams.length > 1;
  const isSingleTeamLead = userRole === 'lead' && leadTeams.length <= 1;

  // Default tab is ALL
  const [activeTab, setActiveTab] = useState<RequestStatus | 'all'>('all');

  // Filters default to 2026, Oct (current month), and All Teams (or own team / all my teams for Lead)
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('10');
  const [selectedTeam, setSelectedTeam] = useState<string>(() => {
    if (userRole === 'lead') {
      return teamLeadScope === '1team' ? currentUser.teamId : 'all';
    }
    return 'all';
  });
  const [employeeSearch, setEmployeeSearch] = useState<string>('');

  // Row 3-dots menu open state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Sync selectedTeam when userRole or teamLeadScope changes
  useEffect(() => {
    if (userRole === 'lead') {
      if (teamLeadScope === '1team') {
        setSelectedTeam(currentUser.teamId);
      } else {
        setSelectedTeam('all');
      }
    }
  }, [userRole, teamLeadScope, currentUser.teamId]);

  // Close open dropdown menu when clicking anywhere outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenMenuId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Scoped requests based on role
  const scopedRequests = useMemo(() => {
    return requests.filter((r) => {
      // Team lead sees requests for their led team(s) only
      if (userRole === 'lead') {
        if (teamLeadScope === '1team') {
          return r.teamId === currentUser.teamId;
        }
        const leadTeamIds = leadTeams.map((t) => t.id);
        return leadTeamIds.includes(r.teamId);
      }
      // Super Admin sees company-wide
      return true;
    });
  }, [requests, userRole, currentUser.teamId, teamLeadScope, leadTeams]);

  // Apply Tab & Filter Controls
  const filteredRequests = useMemo(() => {
    const list = scopedRequests.filter((r) => {
      // 1. Tab status
      const matchesTab = activeTab === 'all' ? true : r.status === activeTab;

      // 2. Year filter
      const matchesYear =
        selectedYear === 'all' || r.startDate.startsWith(selectedYear);

      // 3. Month filter
      const matchesMonth =
        selectedMonth === 'all' || r.startDate.substring(5, 7) === selectedMonth;

      // 4. Team filter
      const matchesTeam =
        selectedTeam === 'all' || r.teamId === selectedTeam;

      // 5. Employee search
      const matchesSearch =
        employeeSearch.trim() === '' ||
        r.employeeName.toLowerCase().includes(employeeSearch.toLowerCase());

      return matchesTab && matchesYear && matchesMonth && matchesTeam && matchesSearch;
    });

    // Within ALL tab, sort so Pending requests appear first, then the rest
    if (activeTab === 'all') {
      return [...list].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return 0;
      });
    }

    return list;
  }, [
    scopedRequests,
    activeTab,
    selectedYear,
    selectedMonth,
    selectedTeam,
    employeeSearch,
  ]);

  const pendingCount = scopedRequests.filter((r) => r.status === 'pending').length;
  const isSuperAdmin = userRole === 'superadmin';

  return (
    <div className="space-y-4">
      {/* Title Row: Title (Figtree 500 font-medium) on left, Search input + Show Calendar button aligned right */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium text-[#111827]">
          Requests
        </h1>

        <div className="flex items-center gap-2.5">
          {/* Search employee input sitting just left of Show Calendar */}
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search employee..."
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              style={{ borderRadius: '8px' }}
              className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-[#E5E7EB] focus:outline-none focus:border-[#E31B23] placeholder:text-[#6B7280] shadow-2xs"
            />
          </div>

          {/* Show Calendar button (hidden for now) */}
          <button
            onClick={onOpenCalendar}
            style={{ borderRadius: '8px' }}
            className="hidden items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#111827] bg-white border border-[#E5E7EB] hover:bg-gray-50 transition-colors shadow-2xs whitespace-nowrap"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#111827]" />
            <span>Show calendar</span>
          </button>
        </div>
      </div>

      {/* Exactly ONE Toolbar Surface: Tabs on left, Filters on right. No second stacked bar */}
      <div
        className="bg-white border border-[#E5E7EB] p-3 shadow-xs flex flex-wrap items-center justify-between gap-3"
        style={{ borderRadius: '12px' }}
      >
        {/* Left: Filter Tabs */}
        <div className="flex items-center gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            style={{ borderRadius: '8px' }}
            className={`px-3.5 py-1.5 transition-colors ${
              activeTab === 'all'
                ? 'bg-gray-100 text-[#111827]'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-50'
            }`}
          >
            All
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            style={{ borderRadius: '8px' }}
            className={`px-3.5 py-1.5 transition-colors inline-flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-gray-100 text-[#111827]'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-50'
            }`}
          >
            <span>Pending</span>
            {pendingCount > 0 && (
              <span
                style={{ borderRadius: '8px' }}
                className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E31B23] text-white"
              >
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            style={{ borderRadius: '8px' }}
            className={`px-3.5 py-1.5 transition-colors ${
              activeTab === 'approved'
                ? 'bg-gray-100 text-[#111827]'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-50'
            }`}
          >
            Approved
          </button>

          <button
            onClick={() => setActiveTab('declined')}
            style={{ borderRadius: '8px' }}
            className={`px-3.5 py-1.5 transition-colors ${
              activeTab === 'declined'
                ? 'bg-gray-100 text-[#111827]'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-50'
            }`}
          >
            Declined
          </button>
        </div>

        {/* Right: Filters without field labels */}
        <div className="flex items-center gap-2 text-xs">
          {/* Year dropdown: equal width */}
          <CustomSelect
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-[84px]"
          >
            <option value="all">All</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </CustomSelect>

          {/* Month dropdown: equal width */}
          <CustomSelect
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-[84px]"
          >
            <option value="all">All</option>
            <option value="01">Jan</option>
            <option value="02">Feb</option>
            <option value="03">Mar</option>
            <option value="04">Apr</option>
            <option value="05">May</option>
            <option value="06">Jun</option>
            <option value="07">Jul</option>
            <option value="08">Aug</option>
            <option value="09">Sep</option>
            <option value="10">Oct</option>
            <option value="11">Nov</option>
            <option value="12">Dec</option>
          </CustomSelect>

          {/* Team dropdown:
              - Super Admin: enabled, options "All Teams" + all company teams
              - Team Lead with 1 team: disabled, showing the team the TL has (".NET Team")
              - Team Lead with >1 teams: enabled, having available to select either "All my teams" or each team they have */}
          <CustomSelect
            value={isSingleTeamLead ? (leadTeams[0]?.id || currentUser.teamId) : selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            disabled={isSingleTeamLead}
            className={`w-auto pr-[42px] ${
              isSingleTeamLead
                ? 'bg-[#F3F4F6] text-[#6B7280] cursor-not-allowed border-[#E5E7EB] opacity-90'
                : ''
            }`}
          >
            {userRole === 'lead' ? (
              hasMultipleTeams ? (
                <>
                  <option value="all">All my teams</option>
                  {leadTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </>
              ) : (
                <option value={leadTeams[0]?.id || currentUser.teamId}>
                  {leadTeams[0]?.name || currentUser.teamName}
                </option>
              )
            ) : (
              <>
                <option value="all">All teams</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </>
            )}
          </CustomSelect>
        </div>
      </div>

      {/* Main Table Structure (clipped header with 12px rounded container) */}
      <div
        className="bg-white border border-[#D1D5DB] shadow-xs overflow-hidden"
        style={{ borderRadius: '12px' }}
      >
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6B7280]">
            No leave requests found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full text-left text-xs"
              style={{ borderCollapse: 'separate', borderSpacing: 0 }}
            >
              <thead>
                <tr className="border-b border-[#D1D5DB] bg-[#F3F4F6] text-[#374151] uppercase tracking-wider font-semibold text-[11px]">
                  <th className="px-5 py-3.5 rounded-tl-[11px]">NAME</th>
                  <th className="px-4 py-3.5">DURATION</th>
                  <th className="px-4 py-3.5">FROM</th>
                  <th className="px-4 py-3.5">TO</th>
                  <th className="px-4 py-3.5">TYPE</th>
                  {activeTab !== 'pending' && (
                    <th className="px-4 py-3.5">STATUS</th>
                  )}
                  {isSuperAdmin && (
                    <th className="px-4 py-3.5">TEAM LEAD</th>
                  )}
                  <th className="px-4 py-3.5">DAYS LEFT</th>
                  <th className="px-5 py-3.5 text-right rounded-tr-[11px]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1D5DB]">
                {filteredRequests.map((req, idx) => {
                  const emp = employees.find((e) => e.id === req.employeeId);
                  const currentDaysLeft = emp ? emp.daysRemaining : req.daysLeft;
                  const isPending = req.status === 'pending';
                  const isOwnRequest = req.employeeId === currentUser.id;
                  // Team Lead can only approve/deny other people's requests
                  const canApproveDeny = userRole === 'superadmin' || (userRole === 'lead' && !isOwnRequest);
                  // Open menu upwards for bottom rows so it is never clipped
                  const openUpwards = filteredRequests.length >= 3 && idx >= filteredRequests.length - 2;

                  return (
                    <tr key={req.id} className="hover:bg-gray-100/70 transition-colors">
                      {/* NAME */}
                      <td className="px-5 py-4 align-middle font-semibold text-[#111827]">
                        {req.employeeName}
                      </td>

                      {/* DURATION (strictly Figtree, no font-mono) */}
                      <td className="px-4 py-4 align-middle text-[#111827] font-medium">
                        {req.workingDays} {req.workingDays === 1 ? 'day' : 'days'}
                      </td>

                      {/* FROM */}
                      <td className="px-4 py-4 align-middle text-[#111827]">
                        {formatDisplayDate(req.startDate)}
                      </td>

                      {/* TO */}
                      <td className="px-4 py-4 align-middle text-[#111827]">
                        {formatDisplayDate(req.endDate)}
                      </td>

                      {/* TYPE: Same height as Status pill (h-[26px]), 8px border radius */}
                      <td className="px-4 py-4 align-middle">
                        <span
                          style={{ borderRadius: '8px' }}
                          className="h-[26px] inline-flex items-center px-2.5 text-[11px] font-medium border border-gray-300 text-[#111827] bg-white whitespace-nowrap"
                        >
                          {req.category}
                        </span>
                      </td>

                      {/* STATUS: Same height as Type pill (h-[26px]), 40px radius, NO colored dot, soft tinted background with darker fill */}
                      {activeTab !== 'pending' && (
                        <td className="px-4 py-4 align-middle">
                          {req.status === 'approved' ? (
                            <span
                              style={{ borderRadius: '40px' }}
                              className="h-[26px] inline-flex items-center px-3 text-[11px] font-semibold bg-emerald-100 text-[#064E3B] whitespace-nowrap"
                            >
                              Approved
                            </span>
                          ) : req.status === 'pending' ? (
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
                      )}

                      {/* TEAM LEAD (Super Admin view only) */}
                      {isSuperAdmin && (
                        <td className="px-4 py-4 align-middle text-[#111827] font-medium">
                          {req.responsibleTl}
                        </td>
                      )}

                      {/* DAYS LEFT */}
                      <td className="px-4 py-4 align-middle font-medium text-[#111827]">
                        <span className={currentDaysLeft < 0 ? 'text-[#E31B23]' : ''}>
                          {currentDaysLeft} {currentDaysLeft === 1 || currentDaysLeft === -1 ? 'day' : 'days'}
                        </span>
                      </td>

                      {/* ACTIONS: Rendered for EVERY request */}
                      <td className="px-5 py-4 align-middle text-right">
                        <div className="inline-flex items-center gap-2 justify-end relative">
                          {/* If pending: Green Approve button with Check icon (Super Admin or Team Lead for other people) */}
                          {isPending && canApproveDeny && (
                            <button
                              onClick={() => onApprove(req.id)}
                              style={{ borderRadius: '8px' }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] transition-colors shadow-2xs whitespace-nowrap"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* 3-dots icon button that opens action menu with clearly visible hover */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === req.id ? null : req.id);
                              }}
                              style={{ borderRadius: '8px' }}
                              className="w-8 h-8 flex items-center justify-center text-[#4B5563] hover:text-[#111827] hover:bg-[#E5E7EB] active:bg-[#D1D5DB] transition-colors border border-transparent hover:border-[#D1D5DB]"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu (narrower, icons for every item, visible hover on Deny and Download) */}
                            {openMenuId === req.id && (
                              <div
                                style={{ borderRadius: '8px' }}
                                className={`absolute right-0 ${
                                  openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'
                                } w-[124px] bg-white border border-[#D1D5DB] shadow-lg py-1 z-50 text-left text-xs font-medium`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isPending ? (
                                  /* Pending Menu */
                                  canApproveDeny ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          onDeny(req.id);
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full text-left px-2.5 py-1.5 text-[#111827] hover:bg-rose-50 hover:text-[#E31B23] flex items-center gap-2 transition-colors"
                                      >
                                        <X className="w-3.5 h-3.5 text-[#E31B23] shrink-0" />
                                        <span>Deny</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          onDownloadPdf(req);
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full text-left px-2.5 py-1.5 text-[#111827] hover:bg-[#F3F4F6] hover:text-[#111827] flex items-center gap-2 transition-colors"
                                      >
                                        <Download className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />
                                        <span>Download</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          onDelete?.(req.id);
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full text-left px-2.5 py-1.5 text-[#E31B23] hover:bg-red-50 flex items-center gap-2 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-[#E31B23] shrink-0" />
                                        <span>Delete</span>
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => {
                                          onCancelRequest?.(req.id);
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full text-left px-2.5 py-1.5 text-[#111827] hover:bg-rose-50 hover:text-[#E31B23] flex items-center gap-2 transition-colors"
                                      >
                                        <Ban className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                                        <span>Cancel</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          onDownloadPdf(req);
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full text-left px-2.5 py-1.5 text-[#111827] hover:bg-[#F3F4F6] hover:text-[#111827] flex items-center gap-2 transition-colors"
                                      >
                                        <Download className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />
                                        <span>Download</span>
                                      </button>
                                    </>
                                  )
                                ) : (
                                  /* Approved & Declined Menu */
                                  <button
                                    onClick={() => {
                                      onDownloadPdf(req);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-[#111827] hover:bg-[#F3F4F6] hover:text-[#111827] flex items-center gap-2 transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />
                                    <span>Download</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
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
