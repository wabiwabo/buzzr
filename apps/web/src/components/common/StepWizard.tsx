import React, { useState } from 'react';
import { Steps, Button } from 'antd';
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
  width = 560,
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
      width={width}
      footer={
        <>
          {current > 0 && (
            <Button onClick={handleBack}>Kembali</Button>
          )}
          <div style={{ flex: 1 }} />
          <Button onClick={handleClose}>Batal</Button>
          {isLast ? (
            <Button type="primary" onClick={handleComplete} loading={loading}>
              {completeLabel}
            </Button>
          ) : (
            <Button type="primary" onClick={handleNext}>
              Lanjut
            </Button>
          )}
        </>
      }
    >
      <Steps
        current={current}
        size="small"
        items={steps.map((s) => ({ title: s.title }))}
        style={{ marginBottom: 24 }}
      />
      {steps[current]?.content}
    </SlideOver>
  );
};
