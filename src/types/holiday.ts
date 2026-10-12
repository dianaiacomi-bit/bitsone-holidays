export type LeaveCategory =
  | 'Vacation Day'
  | 'Medical'
  | 'Unpaid Leave'
  | 'Special Leave'
  | 'Blood Donation'
  | 'Recuperare'
  | 'Concediu fara plata'
  | 'National Day'
  | 'Birthday';

export type RequestStatus = 'pending' | 'approved' | 'declined';

// Only THREE roles as explicitly instructed
export type UserRole = 'employee' | 'lead' | 'superadmin';

export interface Employee {
  id: string;
  name: string;
  email: string;
  teamId: string;
  teamName: string;
  teams?: string[];
  isLead: boolean;
  leadName?: string;
  daysRemaining: number;
  totalDaysByYear?: Record<number, number>;
}

export interface Team {
  id: string;
  name: string;
  leadId: string;
  leadName: string;
  membersCount: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  teamId: string;
  teamName: string;
  category: LeaveCategory;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  workingDays: number;
  status: RequestStatus;
  daysLeft: number;
  responsibleTl: string; // Responsible Team Lead name
  description?: string;
  requestedAt: string; // ISO
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface PublicHoliday {
  date: string; // YYYY-MM-DD
  name: string;
}

export interface BalanceAdjustment {
  id: string;
  employeeId: string;
  employeeName: string;
  adjustmentType: 'add' | 'deduct';
  days: number;
  description: string;
  adjustedAt: string; // ISO string
  date: string; // YYYY-MM-DD
}
