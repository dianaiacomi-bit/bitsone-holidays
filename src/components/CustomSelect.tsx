import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface CustomSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
  iconClassName?: string;
}

/**
 * Standard BitStone CustomSelect
 * Rule for all selectors:
 * - Lucide ChevronDown icon
 * - 12px left padding (pl-[12px])
 * - 12px right icon gap (right-[12px])
 * - 36px right padding on select (pr-[36px]) to ensure ample space before icon
 * - 8px border radius
 */
export const CustomSelect: React.FC<CustomSelectProps> = ({
  children,
  className = '',
  wrapperClassName = '',
  iconClassName = '',
  ...props
}) => {
  const isFullWidth = className.includes('w-full') || wrapperClassName.includes('w-full');
  const hasCustomBg = className.includes('bg-');
  const hasCustomText = className.includes('text-');
  const hasCustomBorder = className.includes('border-');

  return (
    <div className={`relative ${isFullWidth ? 'flex w-full' : 'inline-flex'} items-center ${wrapperClassName}`}>
      <select
        style={{ borderRadius: '8px' }}
        className={`appearance-none pl-[12px] pr-[36px] py-1.5 text-xs font-semibold focus:outline-none focus:border-[#E31B23] transition-colors cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed ${
          !hasCustomBg ? 'bg-white' : ''
        } ${!hasCustomBorder ? 'border border-[#E5E7EB]' : ''} ${
          !hasCustomText ? 'text-[#111827]' : ''
        } ${isFullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className={`w-3.5 h-3.5 absolute right-[12px] pointer-events-none stroke-[2] ${
          iconClassName || 'text-[#6B7280]'
        }`}
      />
    </div>
  );
};

