'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="relative group">
        <input
          ref={ref}
          type={type}
          className={cn(
            'flex h-12 w-full rounded-2xl border-none bg-secondary/50 px-4 text-sm font-medium shadow-sm transition-all duration-300 placeholder:text-muted-foreground/60 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:shadow-[0_4px_20px_rgba(0,0,0,0.05)] disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
        {/* Subtle hover effect line at bottom if needed, or stick to clean pill */}
      </div>
    );
  }
);

Input.displayName = 'Input';
