import React from 'react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface VisualSelectorProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
}

export const VisualSelector: React.FC<VisualSelectorProps> = ({ options, value, onChange }) => (
  <div role="radiogroup" className="flex gap-3">
    {options.map((opt) => {
      const selected = value === opt.value;
      return (
        <div
          key={opt.value}
          role="radio"
          aria-checked={selected}
          tabIndex={0}
          onClick={() => onChange?.(opt.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange?.(opt.value); } }}
          className={cn(
            'flex-1 p-3 rounded-lg border-2 cursor-pointer text-center transition-colors',
            selected
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/30 hover:border-primary/30',
          )}
        >
          {opt.icon && <div className="text-xl mb-1">{opt.icon}</div>}
          <span className={cn('text-sm font-medium', selected ? 'text-primary' : 'text-foreground')}>
            {opt.label}
          </span>
          {opt.description && (
            <span className="text-xs text-muted-foreground block">{opt.description}</span>
          )}
        </div>
      );
    })}
  </div>
);
