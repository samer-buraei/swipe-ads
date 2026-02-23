'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[120px] w-full rounded-2xl border-none bg-secondary/50 px-4 py-3 text-sm font-medium shadow-sm transition-all duration-300 placeholder:text-muted-foreground/60 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:shadow-[0_4px_20px_rgba(0,0,0,0.05)] disabled:cursor-not-allowed disabled:opacity-50 resize-y',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
