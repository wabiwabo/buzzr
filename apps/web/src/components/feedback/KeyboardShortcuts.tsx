import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface KeyboardShortcutsProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: '/', description: 'Fokus pencarian global' },
  { keys: 'n', description: 'Buka form tambah baru' },
  { keys: 'Esc', description: 'Tutup modal/drawer' },
  { keys: '?', description: 'Tampilkan shortcut ini' },
  { keys: 'g → d', description: 'Ke Dashboard' },
  { keys: 'g → t', description: 'Ke TPS' },
  { keys: 'g → c', description: 'Ke Laporan Warga' },
  { keys: 'g → f', description: 'Ke Armada' },
  { keys: 'g → p', description: 'Ke Pembayaran' },
];

const Kbd: React.FC<{ children: string }> = ({ children }) => (
  <span className="inline-block px-2 py-0.5 bg-muted border rounded text-xs font-mono leading-5 shadow-[0_1px_0_rgba(0,0,0,0.1)]">
    {children}
  </span>
);

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ open, onClose }) => (
  <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
    <DialogContent className="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>Keyboard Shortcuts</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-3">
        {shortcuts.map((s, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-sm">{s.description}</span>
            <div className="flex items-center gap-1">
              {s.keys.split(' → ').map((k, j) => (
                <React.Fragment key={j}>
                  {j > 0 && <span className="text-xs text-muted-foreground">lalu</span>}
                  <Kbd>{k}</Kbd>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);
