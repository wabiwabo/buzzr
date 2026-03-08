import { useEffect, useRef } from 'react';

interface TriageKeyboardActions {
  onNext: () => void;
  onPrev: () => void;
  onTogglePreview: () => void;
  onOpenDetail: () => void;
  onAssign: () => void;
  onStatusChange: () => void;
  onResolve: () => void;
  onReject: () => void;
  onAddNote: () => void;
  onCyclePriority: () => void;
  onFocusSearch: () => void;
  onShowHelp: () => void;
  onToggleSidebar: () => void;
  onBulkAssign?: () => void;
  onBulkStatus?: () => void;
  onClearSelection?: () => void;
}

const IGNORED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function useTriageKeyboard(actions: TriageKeyboardActions) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (IGNORED_TAGS.has(target.tagName) || target.isContentEditable) return;

      // Prevent shortcuts when dialogs/modals are open
      if (document.querySelector('[role="dialog"]')) return;

      const a = actionsRef.current;
      const key = e.key.toLowerCase();
      const shift = e.shiftKey;

      switch (key) {
        case 'j': e.preventDefault(); a.onNext(); break;
        case 'k': e.preventDefault(); a.onPrev(); break;
        case ' ': e.preventDefault(); a.onTogglePreview(); break;
        case 'enter': e.preventDefault(); a.onOpenDetail(); break;
        case 'escape': e.preventDefault(); a.onTogglePreview(); break;
        case '/': e.preventDefault(); a.onFocusSearch(); break;
        case '?': e.preventDefault(); a.onShowHelp(); break;
        case '[': e.preventDefault(); a.onToggleSidebar(); break;
        case 'a':
          e.preventDefault();
          if (shift) a.onBulkAssign?.();
          else a.onAssign();
          break;
        case 's':
          e.preventDefault();
          if (shift) a.onBulkStatus?.();
          else a.onStatusChange();
          break;
        case 'r': e.preventDefault(); a.onResolve(); break;
        case 'x':
          e.preventDefault();
          if (shift) a.onClearSelection?.();
          else a.onReject();
          break;
        case 'n': e.preventDefault(); a.onAddNote(); break;
        case 'p': e.preventDefault(); a.onCyclePriority(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
