import React, { useState, useEffect } from 'react';
import { PanelRightClose, PanelRightOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

type PreviewMode = 'split' | 'drawer';

interface DataTablePreviewProps {
  open: boolean;
  onClose: () => void;
  renderContent: () => React.ReactNode;
  defaultMode?: PreviewMode;
}

export const DataTablePreview: React.FC<DataTablePreviewProps> = ({
  open,
  onClose,
  renderContent,
  defaultMode = 'split',
}) => {
  const [mode, setMode] = useState<PreviewMode>(() => {
    try {
      return (localStorage.getItem('dt-preview-mode') as PreviewMode) || defaultMode;
    } catch {
      return defaultMode;
    }
  });

  useEffect(() => {
    localStorage.setItem('dt-preview-mode', mode);
  }, [mode]);

  const toggleMode = () => setMode((m) => (m === 'split' ? 'drawer' : 'split'));

  if (!open) return null;

  // Drawer mode
  if (mode === 'drawer') {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto p-0">
          <SheetHeader className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex flex-row items-center justify-between">
            <SheetTitle className="text-sm">Detail</SheetTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMode} title="Mode split">
                <PanelRightOpen className="h-3.5 w-3.5" />
              </Button>
            </div>
          </SheetHeader>
          <div className="p-4">{renderContent()}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // Split mode
  return (
    <div className="border-l bg-background flex flex-col w-[40%] min-w-[320px] max-w-[520px]">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium">Detail</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMode} title="Mode drawer">
            <PanelRightClose className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{renderContent()}</div>
    </div>
  );
};

/** Hook to get preview mode toggle button for toolbar */
export function usePreviewModeButton() {
  const [mode, setMode] = useState<PreviewMode>(() => {
    try {
      return (localStorage.getItem('dt-preview-mode') as PreviewMode) || 'split';
    } catch {
      return 'split';
    }
  });

  const button = (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8"
      onClick={() => {
        const next = mode === 'split' ? 'drawer' : 'split';
        setMode(next);
        localStorage.setItem('dt-preview-mode', next);
      }}
      title={mode === 'split' ? 'Mode drawer' : 'Mode split'}
    >
      {mode === 'split' ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
    </Button>
  );

  return { mode, button };
}
