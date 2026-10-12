import React, { useState, useRef, useEffect } from 'react';
import { UserRole, Employee } from '../types/holiday';
import { ArrowLeft, LogOut, Plus, Pencil } from 'lucide-react';

interface AppHeaderProps {
  currentPage: 'myleaves' | 'requests' | 'employees' | 'reports';
  onSelectPage: (page: 'myleaves' | 'requests' | 'employees' | 'reports') => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  currentUser: Employee;
  onOpenAddLeave: () => void;
  onOpenAdjustLeaves: () => void;
  onBackToHub: () => void;
  teamLeadScope?: '1team' | '3teams';
  onTeamLeadScopeChange?: (scope: '1team' | '3teams') => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentPage,
  onSelectPage,
  currentRole,
  onChangeRole,
  currentUser,
  onOpenAddLeave,
  onOpenAdjustLeaves,
  onBackToHub,
  teamLeadScope = '1team',
  onTeamLeadScopeChange,
}) => {
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Close avatar dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initials for avatar
  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  const isSimpleUser = currentRole === 'employee';

  return (
    <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
      {/* 1. Prototype Testing Bar (Only 3 roles as explicitly instructed) */}
      <div className="bg-[#111827] text-gray-300 text-[11px] px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E31B23]" />
          <span className="font-semibold text-white">Role Testing:</span>
          <span className="text-gray-300">
            Active as <strong>{currentUser.name}</strong> ({currentRole === 'superadmin' ? 'SUPER ADMIN' : currentRole === 'lead' ? 'TEAM LEAD' : 'SIMPLE USER'})
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-400 mr-1">Switch Role:</span>
          <button
            onClick={() => onChangeRole('superadmin')}
            style={{ borderRadius: '8px' }}
            className={`px-2.5 py-0.5 font-semibold transition-colors ${
              currentRole === 'superadmin'
                ? 'bg-[#E31B23] text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            Super Admin
          </button>
          <button
            onClick={() => onChangeRole('lead')}
            style={{ borderRadius: '8px' }}
            className={`px-2.5 py-0.5 font-semibold transition-colors ${
              currentRole === 'lead'
                ? 'bg-[#E31B23] text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            Team Lead
          </button>
          <button
            onClick={() => onChangeRole('employee')}
            style={{ borderRadius: '8px' }}
            className={`px-2.5 py-0.5 font-semibold transition-colors ${
              currentRole === 'employee'
                ? 'bg-[#E31B23] text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            Simple User
          </button>

          {/* Secondary toggle for Team Lead only: 1 team / 3 teams */}
          {currentRole === 'lead' && (
            <div className="flex items-center gap-1 ml-2 pl-2 sm:ml-3 sm:pl-3 border-l border-gray-700">
              <span className="text-gray-400 mr-1">Teams:</span>
              <button
                onClick={() => onTeamLeadScopeChange?.('1team')}
                style={{ borderRadius: '8px' }}
                className={`px-2.5 py-0.5 font-semibold transition-colors ${
                  teamLeadScope === '1team'
                    ? 'bg-[#E31B23] text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                1 team
              </button>
              <button
                onClick={() => onTeamLeadScopeChange?.('3teams')}
                style={{ borderRadius: '8px' }}
                className={`px-2.5 py-0.5 font-semibold transition-colors ${
                  teamLeadScope === '3teams'
                    ? 'bg-[#E31B23] text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                3 teams
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Back to Hub + BitStone Holidays */}
        <div className="flex items-center gap-5">
          <button
            onClick={onBackToHub}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Hub</span>
          </button>

          <div className="h-5 w-px bg-[#E5E7EB]" />

          {/* BitStone Holidays (Figtree 700, dark) */}
          <span
            className="text-lg font-bold text-[#111827] tracking-tight whitespace-nowrap"
            style={{ fontFamily: 'Figtree, sans-serif', fontWeight: 700 }}
          >
            BitStone Holidays
          </span>
        </div>

        {/* Center: Page Navigation (NOT pill tabs! Text nav items with red bottom underline on active page)
            Hidden for Simple User as per prompt */}
        {!isSimpleUser && (
          <nav className="hidden md:flex items-center gap-8 h-full">
            {/* 1. My Leaves (Super Admin and Team Lead only) */}
            <button
              onClick={() => onSelectPage('myleaves')}
              className={`h-full text-xs font-semibold text-[#111827] flex items-center transition-colors relative ${
                currentPage === 'myleaves'
                  ? 'border-b-2 border-[#E31B23]'
                  : ''
              }`}
            >
              My Leaves
            </button>

            {/* 2. Requests */}
            <button
              onClick={() => onSelectPage('requests')}
              className={`h-full text-xs font-semibold text-[#111827] flex items-center transition-colors relative ${
                currentPage === 'requests'
                  ? 'border-b-2 border-[#E31B23]'
                  : ''
              }`}
            >
              Requests
            </button>

            {/* 3. Employees / My Team(s) */}
            <button
              onClick={() => onSelectPage('employees')}
              className={`h-full text-xs font-semibold text-[#111827] flex items-center transition-colors relative ${
                currentPage === 'employees'
                  ? 'border-b-2 border-[#E31B23]'
                  : ''
              }`}
            >
              {currentRole === 'lead' ? 'My Team(s)' : 'Employees'}
            </button>

            {/* 4. Reports (Super Admin only) */}
            {currentRole === 'superadmin' && (
              <button
                onClick={() => onSelectPage('reports')}
                className={`h-full text-xs font-semibold text-[#111827] flex items-center transition-colors relative ${
                  currentPage === 'reports'
                    ? 'border-b-2 border-[#E31B23]'
                    : ''
                }`}
              >
                Reports
              </button>
            )}
          </nav>
        )}

        {/* Right side: Action Buttons + Avatar */}
        <div className="flex items-center gap-3">
          {/* Adjust Leaves button (Super Admin only, outlined style, Lucide icon, 8px radius) */}
          {currentRole === 'superadmin' && (
            <button
              onClick={onOpenAdjustLeaves}
              style={{ borderRadius: '8px' }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#111827] bg-white border border-[#E5E7EB] hover:bg-gray-50 transition-colors shadow-2xs whitespace-nowrap"
            >
              <Pencil className="w-3.5 h-3.5 text-[#111827]" />
              <span>Adjust leaves</span>
            </button>
          )}

          {/* Add Leave button (Red fill, white text, Lucide Plus icon, 8px radius) */}
          <button
            onClick={onOpenAddLeave}
            style={{ borderRadius: '8px' }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#E31B23] hover:bg-[#C9161E] transition-colors shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            <span>Add leave</span>
          </button>

          {/* Avatar: circular initials only. No user name text next to it. Clicking opens dropdown */}
          <div className="relative pl-1" ref={avatarRef}>
            <button
              onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
              className="w-8 h-8 rounded-full bg-[#111827] text-white flex items-center justify-center text-xs font-bold hover:ring-2 hover:ring-[#E31B23] transition-all tracking-wider focus:outline-none"
              title="User profile"
            >
              {initials}
            </button>

            {/* Dropdown menu showing: full name, email address, and a Logout item */}
            {isAvatarMenuOpen && (
              <div
                style={{ borderRadius: '8px' }}
                className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#E5E7EB] shadow-lg py-2 z-50 animate-in fade-in"
              >
                <div className="px-4 py-2 border-b border-[#E5E7EB]">
                  <div className="text-xs font-bold text-[#111827]">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-[#6B7280] truncate mt-0.5">
                    {currentUser.email}
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setIsAvatarMenuOpen(false);
                      onBackToHub();
                    }}
                    style={{ borderRadius: '6px' }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#111827] hover:bg-gray-100 flex items-center gap-2 transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav for smaller screens (hidden for Simple User) */}
      {!isSimpleUser && (
        <div className="md:hidden flex items-center justify-around border-t border-[#E5E7EB] bg-[#F9FAFB] text-xs font-medium text-[#111827]">
          <button
            onClick={() => onSelectPage('requests')}
            className={`py-2 px-3 ${
              currentPage === 'requests' ? 'border-b-2 border-[#E31B23] font-bold text-[#E31B23]' : ''
            }`}
          >
            Requests
          </button>
          <button
            onClick={() => onSelectPage('employees')}
            className={`py-2 px-3 ${
              currentPage === 'employees' ? 'border-b-2 border-[#E31B23] font-bold text-[#E31B23]' : ''
            }`}
          >
            {currentRole === 'lead' ? 'My Team(s)' : 'Employees'}
          </button>
          {currentRole === 'superadmin' && (
            <button
              onClick={() => onSelectPage('reports')}
              className={`py-2 px-3 ${
                currentPage === 'reports' ? 'border-b-2 border-[#E31B23] font-bold text-[#E31B23]' : ''
              }`}
            >
              Reports
            </button>
          )}
        </div>
      )}
    </header>
  );
};
