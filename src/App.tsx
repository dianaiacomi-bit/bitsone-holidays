import React, { useState, useMemo } from 'react';
import { UserRole, LeaveRequest, Employee } from './types/holiday';
import { 
  EMPLOYEES_DATA, 
  TEAMS_DATA, 
  INITIAL_LEAVE_REQUESTS, 
  PUBLIC_HOLIDAYS_2026,
  INITIAL_ADJUSTMENTS,
} from './data/mockData';
import { BalanceAdjustment } from './types/holiday';
import { AppHeader } from './components/AppHeader';
import { RequestsPage } from './components/RequestsPage';
import { EmployeesPage } from './components/EmployeesPage';
import { EmployeeDetailsPage } from './components/EmployeeDetailsPage';
import { ReportsPage } from './components/ReportsPage';
import { SimpleUserDashboard } from './components/SimpleUserDashboard';
import { CalendarModal } from './components/CalendarModal';
import { AddLeaveModal } from './components/AddLeaveModal';
import { AdjustLeavesModal } from './components/AdjustLeavesModal';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Only 3 roles: 'superadmin' | 'lead' | 'employee'
  const [currentRole, setCurrentRole] = useState<UserRole>('superadmin');
  const [currentPage, setCurrentPage] = useState<'myleaves' | 'requests' | 'employees' | 'reports'>('requests');
  // Secondary toggle for Team Lead demo testing: '1team' | '3teams'
  const [teamLeadScope, setTeamLeadScope] = useState<'1team' | '3teams'>('1team');

  // Application data states
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES_DATA);
  const [requests, setRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [adjustments, setAdjustments] = useState<BalanceAdjustment[]>(INITIAL_ADJUSTMENTS);

  // Drill-down selected employee for Super Admin
  const [selectedEmployeeForDetails, setSelectedEmployeeForDetails] = useState<Employee | null>(null);

  // Context employee target for Modals (Add Leave / Adjust Leaves)
  const [modalTargetEmployeeId, setModalTargetEmployeeId] = useState<string | null>(null);

  // Modals state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAddLeaveOpen, setIsAddLeaveOpen] = useState(false);
  const [isAdjustLeavesOpen, setIsAdjustLeavesOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active user depending on role
  const currentUser: Employee = useMemo(() => {
    if (currentRole === 'employee') {
      // Simple User: Diana Iacomi
      return employees.find((e) => e.name === 'Diana Iacomi') || employees[5];
    }
    if (currentRole === 'lead') {
      return employees.find((e) => e.name === 'Dan Bilauca') || employees[0];
    }
    // Super Admin: Monica Ratiu
    return employees.find((e) => e.name === 'Monica Ratiu') || employees[4];
  }, [currentRole, employees]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Role change handler with page safety
  const handleChangeRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'employee') {
      setCurrentPage('requests');
    } else if (newRole === 'lead' && currentPage === 'reports') {
      setCurrentPage('requests');
    }
  };

  // Approve action
  const handleApprove = (requestId: string) => {
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

    // Deduct business days from employee remaining days if Vacation Day
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === target.employeeId && target.category === 'Vacation Day') {
          return {
            ...emp,
            daysRemaining: emp.daysRemaining - target.workingDays,
          };
        }
        return emp;
      })
    );

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'approved',
            approvedBy: currentUser.name,
            approvedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    showToast(`Leave approved for ${target.employeeName}.`);
  };

  // Deny action
  const handleDeny = (requestId: string) => {
    const target = requests.find((r) => r.id === requestId);
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'declined',
          };
        }
        return r;
      })
    );
    showToast(`Leave request declined for ${target?.employeeName || 'employee'}.`);
  };

  // Add Leave Submission
  const handleAddLeaveSubmit = (newRequestData: Omit<LeaveRequest, 'id' | 'requestedAt'>) => {
    const newReq: LeaveRequest = {
      ...newRequestData,
      id: `req-${Date.now()}`,
      requestedAt: new Date().toISOString(),
    };

    if (newReq.status === 'approved' && newReq.category === 'Vacation Day') {
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id === newReq.employeeId) {
            return {
              ...emp,
              daysRemaining: emp.daysRemaining - newReq.workingDays,
            };
          }
          return emp;
        })
      );
    }

    setRequests((prev) => [newReq, ...prev]);
    showToast(
      newReq.status === 'approved'
        ? `Leave recorded and approved for ${newReq.employeeName}.`
        : `Leave request submitted for ${newReq.employeeName}.`
    );
  };

  // Super Admin: Save Adjustment
  const handleSaveAdjustment = (
    employeeId: string,
    adjustmentType: 'add' | 'deduct',
    days: number,
    reason: string
  ) => {
    const delta = adjustmentType === 'add' ? days : -days;
    let employeeName = '';

    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === employeeId) {
          employeeName = emp.name;
          return {
            ...emp,
            daysRemaining: emp.daysRemaining + delta,
          };
        }
        return emp;
      })
    );

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const newAdj: BalanceAdjustment = {
      id: `adj-${Date.now()}`,
      employeeId,
      employeeName,
      adjustmentType,
      days,
      description: reason,
      date: todayStr,
      adjustedAt: now.toISOString(),
    };

    setAdjustments((prev) => [newAdj, ...prev]);

    showToast(
      `Adjusted balance for ${employeeName}: ${adjustmentType === 'add' ? `+${days}` : `-${days}`} days (${reason})`
    );
  };

  // Download PDF summary
  const handleDownloadPdf = (req: LeaveRequest) => {
    const content = `BITSTONE LEAVE CONFIRMATION
========================================
Employee: ${req.employeeName}
Team: ${req.teamName}
Responsible TL: ${req.responsibleTl}
Leave Type: ${req.category}
Dates: ${req.startDate} to ${req.endDate}
Duration: ${req.workingDays} business days
Status: ${req.status.toUpperCase()}
Remaining Days Balance: ${req.daysLeft} days
Approved By: ${req.approvedBy || 'N/A'}
Date of Document: ${new Date().toLocaleDateString('en-GB')}
========================================
BitStone Holidays · hub.bitstone.eu`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BitStone-Leave-${req.employeeName.replace(/\s+/g, '-')}-${req.startDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Downloaded leave statement for ${req.employeeName}.`);
  };

  const handleBackToHub = () => {
    showToast('Redirecting to hub.bitstone.eu...');
  };

  const handleDeleteRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    showToast('Leave request deleted.');
  };

  const handleCancelRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    showToast('Leave request cancelled.');
  };

  const isSimpleUser = currentRole === 'employee';

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex flex-col font-sans">
      {/* HEADER (appears on all pages, text nav items with red bottom underline bar, avatar with dropdown) */}
      <AppHeader
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        currentRole={currentRole}
        onChangeRole={handleChangeRole}
        currentUser={currentUser}
        onOpenAddLeave={() => {
          setModalTargetEmployeeId(null);
          setIsAddLeaveOpen(true);
        }}
        onOpenAdjustLeaves={() => {
          setModalTargetEmployeeId(null);
          setIsAdjustLeavesOpen(true);
        }}
        onBackToHub={handleBackToHub}
        teamLeadScope={teamLeadScope}
        onTeamLeadScopeChange={setTeamLeadScope}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Simple User: Dedicated personal dashboard with summary strip and own leave history */}
        {isSimpleUser ? (
          <SimpleUserDashboard
            currentUser={currentUser}
            userRole={currentRole}
            requests={requests}
            adjustments={adjustments}
            onDownloadPdf={handleDownloadPdf}
            onCancelRequest={handleCancelRequest}
          />
        ) : (
          /* Team Lead & Super Admin workspace */
          <>
            {currentPage === 'myleaves' && (
              <SimpleUserDashboard
                currentUser={currentUser}
                userRole={currentRole}
                requests={requests}
                adjustments={adjustments}
                onDownloadPdf={handleDownloadPdf}
                onCancelRequest={handleCancelRequest}
              />
            )}

            {currentPage === 'requests' && (
              <RequestsPage
                requests={requests}
                employees={employees}
                teams={TEAMS_DATA}
                userRole={currentRole}
                currentUser={currentUser}
                teamLeadScope={teamLeadScope}
                onApprove={handleApprove}
                onDeny={handleDeny}
                onDelete={handleDeleteRequest}
                onCancelRequest={handleCancelRequest}
                onOpenCalendar={() => setIsCalendarOpen(true)}
                onDownloadPdf={handleDownloadPdf}
              />
            )}

            {currentPage === 'employees' && (
              selectedEmployeeForDetails ? (
                <EmployeeDetailsPage
                  employee={selectedEmployeeForDetails}
                  employees={employees}
                  requests={requests}
                  adjustments={adjustments}
                  onBack={() => setSelectedEmployeeForDetails(null)}
                  onDownloadPdf={handleDownloadPdf}
                />
              ) : (
                <EmployeesPage
                  teams={TEAMS_DATA}
                  employees={employees}
                  userRole={currentRole}
                  teamLeadScope={teamLeadScope}
                  onSelectEmployee={(emp) => {
                    if (currentRole === 'superadmin') {
                      setSelectedEmployeeForDetails(emp);
                    }
                  }}
                  onOpenAddLeaveForEmployee={(emp) => {
                    setModalTargetEmployeeId(emp.id);
                    setIsAddLeaveOpen(true);
                  }}
                  onOpenAdjustLeavesForEmployee={(emp) => {
                    setModalTargetEmployeeId(emp.id);
                    setIsAdjustLeavesOpen(true);
                  }}
                />
              )
            )}

            {currentPage === 'reports' && currentRole === 'superadmin' && (
              <ReportsPage />
            )}
          </>
        )}
      </main>

      {/* Large Centered Calendar Modal (Triggered by Show Calendar button on Requests page) */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        requests={requests}
        publicHolidays={PUBLIC_HOLIDAYS_2026}
        userRole={currentRole}
        currentUser={currentUser}
      />

      {/* Add Leave Modal: on My Leaves page, applies to the logged-in user themselves */}
      <AddLeaveModal
        isOpen={isAddLeaveOpen}
        onClose={() => {
          setIsAddLeaveOpen(false);
          setModalTargetEmployeeId(null);
        }}
        onSubmit={handleAddLeaveSubmit}
        currentUser={currentUser}
        userRole={currentPage === 'myleaves' ? 'employee' : currentRole}
        employees={employees}
        publicHolidays={PUBLIC_HOLIDAYS_2026}
        targetEmployeeId={modalTargetEmployeeId}
      />

      {/* Adjust Leaves Modal (Super Admin only, renamed from Manage Leaves) */}
      <AdjustLeavesModal
        isOpen={isAdjustLeavesOpen}
        onClose={() => {
          setIsAdjustLeavesOpen(false);
          setModalTargetEmployeeId(null);
        }}
        onSaveAdjustment={handleSaveAdjustment}
        employees={employees}
        targetEmployeeId={modalTargetEmployeeId}
      />

      {/* Toast Notification */}
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
}
