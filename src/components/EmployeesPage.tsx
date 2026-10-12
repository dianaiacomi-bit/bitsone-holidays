import React, { useState, useMemo } from 'react';
import { Team, Employee, UserRole } from '../types/holiday';
import { Search, MoreVertical, PlusCircle, Pencil } from 'lucide-react';

interface EmployeesPageProps {
  teams: Team[];
  employees: Employee[];
  userRole?: UserRole;
  teamLeadScope?: '1team' | '3teams';
  onSelectEmployee?: (employee: Employee) => void;
  onOpenAddLeaveForEmployee?: (employee: Employee) => void;
  onOpenAdjustLeavesForEmployee?: (employee: Employee) => void;
}

// Led teams for Dan Bilauca in 3-teams mode
const TL_3_TEAMS = [
  { id: 'team-dotnet', name: '.NET', count: 4 },
  { id: 'team-devops', name: 'Devops', count: 4 },
  { id: 'team-curaden', name: 'Curaden', count: 4 },
];

// Double triangle sort indicator component
const SortTriangleIcon: React.FC<{ active: boolean; direction: 'asc' | 'desc' }> = ({
  active,
  direction,
}) => {
  return (
    <span className="inline-flex flex-col items-center justify-center gap-[2px] ml-1.5 select-none">
      {/* Up triangle */}
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: '3.5px solid transparent',
          borderRight: '3.5px solid transparent',
          borderBottom: `4.5px solid ${active && direction === 'asc' ? '#E31B23' : '#9CA3AF'}`,
        }}
      />
      {/* Down triangle */}
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: '3.5px solid transparent',
          borderRight: '3.5px solid transparent',
          borderTop: `4.5px solid ${active && direction === 'desc' ? '#E31B23' : '#9CA3AF'}`,
        }}
      />
    </span>
  );
};

export const EmployeesPage: React.FC<EmployeesPageProps> = ({
  teams,
  employees,
  userRole = 'superadmin',
  teamLeadScope = '1team',
  onSelectEmployee,
  onOpenAddLeaveForEmployee,
  onOpenAdjustLeavesForEmployee,
}) => {
  // 'all' or specific teamId
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    userRole === 'lead' ? 'team-dotnet' : 'all'
  );

  // Search query (Super Admin)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sorting state: 'name' | 'days' | null, direction: 'asc' | 'desc'
  const [sortColumn, setSortColumn] = useState<'name' | 'days' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Row 3-dots menu
  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);

  React.useEffect(() => {
    const handleOutsideClick = () => setOpenRowMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  const isMemberOfTeam = (e: Employee, teamId: string) => {
    if (teamId === 'all') return true;
    if (e.teamId === teamId) return true;
    const targetTeam = teams.find((t) => t.id === teamId);
    if (targetTeam && e.teams && e.teams.includes(targetTeam.name)) {
      return true;
    }
    return false;
  };

  const handleToggleSort = (col: 'name' | 'days') => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // Team Lead view
  if (userRole === 'lead') {
    // 1. Single team mode: full width table, no left menu
    if (teamLeadScope === '1team') {
      const dotnetMembers = employees
        .filter((e) => isMemberOfTeam(e, 'team-dotnet') && !e.isLead && e.name !== 'Dan Bilauca')
        .sort((a, b) => a.name.localeCompare(b.name));

      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-medium text-[#111827]">
            My Team
          </h1>

          <div
            className="bg-white border border-[#D1D5DB] shadow-xs overflow-hidden"
            style={{ borderRadius: '12px' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#D1D5DB] bg-[#F3F4F6] text-[#374151] uppercase tracking-wider font-semibold text-[11px]">
                    <th className="px-5 py-3.5">NAME</th>
                    <th className="px-5 py-3.5 text-right">DAYS LEFT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1D5DB]">
                  {dotnetMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-[#111827] whitespace-nowrap">
                        <span className="font-bold">{member.name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-[#111827] whitespace-nowrap">
                        <span className={member.daysRemaining < 0 ? 'text-[#E31B23]' : ''}>
                          {member.daysRemaining} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 2. 3 teams mode: vertical menu with only the 3 led teams
    const currentTeamId = TL_3_TEAMS.some((t) => t.id === selectedTeamId)
      ? selectedTeamId
      : 'team-dotnet';

    // Get members for the selected team
    let teamMembers: Employee[] = [];
    if (currentTeamId === 'team-dotnet') {
      teamMembers = employees.filter(
        (e) => isMemberOfTeam(e, 'team-dotnet') && !e.isLead && e.name !== 'Dan Bilauca'
      );
    } else if (currentTeamId === 'team-devops') {
      teamMembers = employees.filter(
        (e) => e.teamId === 'team-devops' && !e.isLead && e.name !== 'Dan Bilauca'
      );
    } else if (currentTeamId === 'team-qa') {
      teamMembers = employees.filter(
        (e) => e.teamId === 'team-qa' && !e.isLead && e.name !== 'Dan Bilauca'
      );
    }

    const sortedTeamMembers = [...teamMembers].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-medium text-[#111827]">
          My Teams
        </h1>

        <div
          className="bg-white border border-[#D1D5DB] shadow-xs overflow-hidden"
          style={{ borderRadius: '12px' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
            {/* Left vertical menu */}
            <div className="md:col-span-4 border-r border-[#D1D5DB] bg-[#F9FAFB] flex flex-col">
              <div className="overflow-y-auto flex-1">
                {TL_3_TEAMS.map((t) => {
                  const isSelected = t.id === currentTeamId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeamId(t.id)}
                      className={`w-full text-left px-4 py-3.5 text-xs transition-colors flex items-center justify-between active:translate-x-[2px] ${
                        isSelected
                          ? 'bg-red-100 font-bold text-[#E31B23] border-l-2 border-[#E31B23]'
                          : 'text-[#111827] hover:bg-[#E5E7EB] font-medium'
                      }`}
                    >
                      <span className="truncate">{t.name}</span>
                      <span className={`text-[11px] ${isSelected ? 'text-[#E31B23]' : 'text-[#6B7280]'}`}>
                        {t.count} members
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right panel */}
            <div className="md:col-span-8 flex flex-col bg-white">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#D1D5DB] bg-[#F3F4F6] text-[#374151] uppercase tracking-wider font-semibold text-[11px]">
                      <th className="px-5 py-3.5">NAME</th>
                      <th className="px-5 py-3.5 text-right">DAYS LEFT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D1D5DB]">
                    {sortedTeamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-[#111827] whitespace-nowrap">
                          <span className="font-bold">{member.name}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-[#111827] whitespace-nowrap">
                          <span className={member.daysRemaining < 0 ? 'text-[#E31B23]' : ''}>
                            {member.daysRemaining} days
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Super Admin view: Filter employees by search query and team selection
  const filteredEmployees = employees.filter((e) => {
    // 1. Team filter
    if (!isMemberOfTeam(e, selectedTeamId)) return false;
    // 2. Search query filter
    if (searchQuery.trim()) {
      return e.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    }
    return true;
  });

  // Sort employees
  const displayedEmployees = [...filteredEmployees].sort((a, b) => {
    // Column sort takes precedence if set
    if (sortColumn === 'name') {
      const cmp = a.name.localeCompare(b.name);
      return sortDirection === 'asc' ? cmp : -cmp;
    }
    if (sortColumn === 'days') {
      const cmp = a.daysRemaining - b.daysRemaining;
      return sortDirection === 'asc' ? cmp : -cmp;
    }

    // Default sorting
    if (selectedTeamId === 'all') {
      if (a.isLead && !b.isLead) return -1;
      if (!a.isLead && b.isLead) return 1;
      return a.name.localeCompare(b.name);
    } else {
      const aIsTeamLead = a.id === selectedTeam?.leadId || a.name === selectedTeam?.leadName;
      const bIsTeamLead = b.id === selectedTeam?.leadId || b.name === selectedTeam?.leadName;
      if (aIsTeamLead && !bIsTeamLead) return -1;
      if (!aIsTeamLead && bIsTeamLead) return 1;
      return a.name.localeCompare(b.name);
    }
  });

  return (
    <div className="space-y-4">
      {/* Top area: Title + Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-medium text-[#111827]">
          Employees (60)
        </h1>

        {/* Search bar: filters employees by name */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employee by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ borderRadius: '8px' }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#D1D5DB] focus:outline-none focus:border-[#E31B23] text-[#111827] placeholder:text-[#9CA3AF] font-medium shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] hover:text-[#111827]"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Two-panel layout in one card container */}
      <div
        className="bg-white border border-[#D1D5DB] shadow-xs overflow-hidden"
        style={{ borderRadius: '12px' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
          
          {/* Left panel — team list */}
          <div className="md:col-span-4 border-r border-[#D1D5DB] bg-[#F9FAFB] flex flex-col">
            <div className="overflow-y-auto flex-1">
              
              {/* 1. "All employees" at the very TOP of the list */}
              <button
                onClick={() => setSelectedTeamId('all')}
                className={`w-full text-left px-4 py-3.5 text-xs transition-colors flex items-center justify-between active:translate-x-[2px] ${
                  selectedTeamId === 'all'
                    ? 'bg-red-100 font-bold text-[#E31B23] border-l-2 border-[#E31B23]'
                    : 'text-[#111827] hover:bg-[#E5E7EB] font-medium'
                }`}
              >
                <span>All employees</span>
                <span className={`text-[11px] ${selectedTeamId === 'all' ? 'text-[#E31B23]' : 'text-[#6B7280]'}`}>
                  60 members
                </span>
              </button>

              {/* 2. "TEAMS (5)" non-clickable section header below All Employees */}
              <div className="px-4 py-2 bg-[#F9FAFB] text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase select-none cursor-default">
                TEAMS ({teams.length})
              </div>

              {/* 3. Below the header: each clickable team */}
              {teams.map((t) => {
                const isSelected = t.id === selectedTeamId;
                const count = employees.filter((e) => isMemberOfTeam(e, t.id)).length;

                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeamId(t.id)}
                    className={`w-full text-left px-4 py-3.5 text-xs transition-colors flex items-center justify-between active:translate-x-[2px] ${
                      isSelected
                        ? 'bg-red-100 font-bold text-[#E31B23] border-l-2 border-[#E31B23]'
                        : 'text-[#111827] hover:bg-[#E5E7EB] font-medium'
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className={`text-[11px] ${isSelected ? 'text-[#E31B23]' : 'text-[#6B7280]'}`}>
                      {count} members
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel — employee table */}
          <div className="md:col-span-8 flex flex-col bg-white">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#D1D5DB] bg-[#F3F4F6] text-[#374151] uppercase tracking-wider font-semibold text-[11px]">
                    {/* NAME with sort control */}
                    <th className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleSort('name')}
                        className="inline-flex items-center gap-1 uppercase font-semibold text-[#374151] hover:text-[#111827]"
                      >
                        <span>NAME</span>
                        <SortTriangleIcon
                          active={sortColumn === 'name'}
                          direction={sortDirection}
                        />
                      </button>
                    </th>

                    {/* TEAM column: Shown ONLY in All Employees view */}
                    {selectedTeamId === 'all' && (
                      <th className="px-5 py-3.5">TEAM</th>
                    )}

                    {/* DAYS LEFT with sort control */}
                    <th className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleToggleSort('days')}
                        className="inline-flex items-center gap-1 uppercase font-semibold text-[#374151] hover:text-[#111827] ml-auto"
                      >
                        <span>DAYS LEFT</span>
                        <SortTriangleIcon
                          active={sortColumn === 'days'}
                          direction={sortDirection}
                        />
                      </button>
                    </th>

                    {/* ACTIONS: 3-dots menu */}
                    <th className="px-4 py-3.5 text-right w-12">
                      <span className="sr-only">ACTIONS</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1D5DB]">
                  {displayedEmployees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={selectedTeamId === 'all' ? 4 : 3}
                        className="px-5 py-12 text-center text-xs text-[#6B7280]"
                      >
                        No employees found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedEmployees.map((member, idx) => {
                      const cleanTeamName = (name: string) =>
                        name.replace(/\bteam\b/gi, '').replace(/\s{2,}/g, ' ').trim();

                      const rawTeams = member.teams && member.teams.length > 0
                        ? member.teams.map(cleanTeamName).filter(Boolean).join(', ')
                        : cleanTeamName(member.teamName || '');

                      const teamDisplay = rawTeams || member.teamName;

                      const showLeadBadge = selectedTeamId === 'all'
                        ? member.isLead
                        : Boolean(selectedTeam && (member.id === selectedTeam.leadId || member.name === selectedTeam.leadName));

                      const openUpwards = idx >= displayedEmployees.length - 2;

                      return (
                        <tr
                          key={member.id}
                          onClick={() => onSelectEmployee?.(member)}
                          className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                        >
                          {/* NAME cell - vertically centered */}
                          <td className="px-5 py-3.5 align-middle font-medium text-[#111827] whitespace-nowrap">
                            <span className="font-bold group-hover:text-[#E31B23] transition-colors">
                              {member.name}
                            </span>
                            {showLeadBadge && (
                              <span
                                style={{ borderRadius: '40px' }}
                                className="ml-3 inline-block bg-[#111827] text-white text-[11px] font-semibold px-2.5 py-0.5 align-middle"
                              >
                                Team Lead
                              </span>
                            )}
                          </td>

                          {/* TEAM column: wraps to second line, vertically centered */}
                          {selectedTeamId === 'all' && (
                            <td className="px-5 py-3.5 align-middle text-[#4B5563] text-xs font-normal whitespace-normal break-words max-w-[260px]">
                              {teamDisplay}
                            </td>
                          )}

                          {/* DAYS LEFT cell - vertically centered */}
                          <td className="px-5 py-3.5 align-middle text-right font-semibold text-[#111827] whitespace-nowrap">
                            <span className={member.daysRemaining < 0 ? 'text-[#E31B23]' : ''}>
                              {member.daysRemaining} days
                            </span>
                          </td>

                          {/* 3-dots actions menu at end of row */}
                          <td
                            className="px-4 py-3.5 align-middle text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center justify-end relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenRowMenuId(openRowMenuId === member.id ? null : member.id);
                                }}
                                style={{ borderRadius: '8px' }}
                                className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 transition-colors"
                                title="Actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openRowMenuId === member.id && (
                                <div
                                  style={{ borderRadius: '8px' }}
                                  className={`absolute right-0 ${
                                    openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'
                                  } w-36 bg-white border border-[#D1D5DB] shadow-lg py-1 z-50 text-left text-xs font-medium`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => {
                                      onOpenAddLeaveForEmployee?.(member);
                                      setOpenRowMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-[#111827] hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <PlusCircle className="w-3.5 h-3.5 text-[#6B7280]" />
                                    <span>Add leave</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      onOpenAdjustLeavesForEmployee?.(member);
                                      setOpenRowMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-[#111827] hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-[#6B7280]" />
                                    <span>Adjust leaves</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
