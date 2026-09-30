import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'dark' | 'soft';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      default: 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs',
      dark: 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-xs',
      destructive: 'bg-rose-500 text-white hover:bg-rose-600 shadow-xs',
      outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200/80',
      ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900',
      soft: 'bg-slate-50 border border-slate-200/70 text-slate-700 hover:bg-slate-100',
      link: 'text-indigo-600 underline-offset-4 hover:underline'
    };

    const sizes = {
      default: 'h-9 px-4 py-2 text-xs font-semibold',
      xs: 'h-7 px-2.5 text-[11px] font-medium rounded-lg',
      sm: 'h-8 rounded-lg px-3 text-xs font-medium',
      lg: 'h-10 rounded-xl px-6 text-sm font-semibold',
      icon: 'h-8 w-8 rounded-lg'
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
