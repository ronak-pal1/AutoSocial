import React from 'react';
import { cn } from './button';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple' | 'orange';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: 'border-transparent bg-slate-900 text-white shadow hover:bg-slate-800',
    secondary: 'border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200',
    destructive: 'border-transparent bg-rose-50 text-rose-600 border border-rose-200/60',
    outline: 'text-slate-700 border-slate-200 bg-white',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    info: 'bg-sky-50 text-sky-700 border border-sky-200/60',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/60',
    orange: 'bg-orange-50 text-orange-700 border border-orange-200/60'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
