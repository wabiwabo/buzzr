import React from 'react';
import { Modal, Typography, Space } from 'antd';

const { Text } = Typography;

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
  <span
    style={{
      display: 'inline-block',
      padding: '2px 8px',
      background: '#f5f5f5',
      border: '1px solid #d9d9d9',
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: 12,
      lineHeight: '20px',
      boxShadow: '0 1px 0 rgba(0,0,0,0.1)',
    }}
  >
    {children}
  </span>
);

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ open, onClose }) => (
  <Modal
    title="Keyboard Shortcuts"
    open={open}
    onCancel={onClose}
    footer={null}
    width={400}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {shortcuts.map((s, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>{s.description}</Text>
          <Space size={4}>
            {s.keys.split(' → ').map((k, j) => (
              <React.Fragment key={j}>
                {j > 0 && <Text type="secondary" style={{ fontSize: 11 }}>lalu</Text>}
                <Kbd>{k}</Kbd>
              </React.Fragment>
            ))}
          </Space>
        </div>
      ))}
    </div>
  </Modal>
);
