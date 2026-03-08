import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SlideOver } from './SlideOver';

interface WizardStep {
  title: string;
  content: React.ReactNode;
  validate?: () => boolean;
}

interface StepWizardProps {
  open: boolean;
  onClose: () => void;
  title: string;
  steps: WizardStep[];
  onComplete: () => void | Promise<void>;
  completeLabel?: string;
  loading?: boolean;
  width?: number;
}

export const StepWizard: React.FC<StepWizardProps> = ({
  open,
  onClose,
  title,
  steps,
  onComplete,
  completeLabel = 'Simpan',
  loading = false,
}) => {
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    const step = steps[current];
    if (step.validate && !step.validate()) return;
    setCurrent(current + 1);
  };

  const handleBack = () => setCurrent(Math.max(0, current - 1));

  const handleComplete = async () => {
    await onComplete();
    setCurrent(0);
  };

  const handleClose = () => {
    setCurrent(0);
    onClose();
  };

  const isLast = current === steps.length - 1;

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title={title}
      footer={
        <>
          {current > 0 && (
            <Button variant="outline" onClick={handleBack}>Kembali</Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={handleClose}>Batal</Button>
          {isLast ? (
            <Button onClick={handleComplete} disabled={loading}>
              {loading ? 'Menyimpan...' : completeLabel}
            </Button>
          ) : (
            <Button onClick={handleNext}>Lanjut</Button>
          )}
        </>
      }
    >
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className={cn('h-px flex-1', i <= current ? 'bg-primary' : 'bg-border')} />}
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                i < current ? 'bg-primary text-primary-foreground' :
                i === current ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground',
              )}>
                {i + 1}
              </div>
              <span className={cn('text-xs', i === current ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                {s.title}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
      {steps[current]?.content}
    </SlideOver>
  );
};
