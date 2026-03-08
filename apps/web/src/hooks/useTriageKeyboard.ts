import { useEffect, useCallback } from 'react';

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
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (IGNORED_TAGS.has(target.tagName) || target.isContentEditable) return;

    // Prevent shortcuts when dialogs/modals are open
    if (document.querySelector('[role="dialog"]')) return;

    const key = e.key.toLowerCase();
    const shift = e.shiftKey;

    switch (key) {
      case 'j': e.preventDefault(); actions.onNext(); break;
      case 'k': e.preventDefault(); actions.onPrev(); break;
      case ' ': e.preventDefault(); actions.onTogglePreview(); break;
      case 'enter': e.preventDefault(); actions.onOpenDetail(); break;
      case 'escape': e.preventDefault(); actions.onTogglePreview(); break;
      case '/': e.preventDefault(); actions.onFocusSearch(); break;
      case '?': e.preventDefault(); actions.onShowHelp(); break;
      case '[': e.preventDefault(); actions.onToggleSidebar(); break;
      case 'a':
        e.preventDefault();
        if (shift) actions.onBulkAssign?.();
        else actions.onAssign();
        break;
      case 's':
        e.preventDefault();
        if (shift) actions.onBulkStatus?.();
        else actions.onStatusChange();
        break;
      case 'r': e.preventDefault(); actions.onResolve(); break;
      case 'x':
        e.preventDefault();
        if (shift) actions.onClearSelection?.();
        else actions.onReject();
        break;
      case 'n': e.preventDefault(); actions.onAddNote(); break;
      case 'p': e.preventDefault(); actions.onCyclePriority(); break;
    }
  }, [actions]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
