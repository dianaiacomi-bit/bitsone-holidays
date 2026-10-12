import React from 'react';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Page Title: Large, dark, font-medium 500, no icon */}
      <h1 className="text-2xl font-medium text-[#111827]">
        Reports
      </h1>

      <div
        className="bg-white border border-[#E5E7EB] p-16 text-center shadow-xs max-w-2xl mx-auto my-8"
        style={{ borderRadius: '12px' }}
      >
        <p className="text-sm font-medium text-[#6B7280]">
          Analytics and reports — coming soon. Available to Super Admin.
        </p>
      </div>
    </div>
  );
};
