import React, { useState } from 'react';
import { Button, Typography, Space, Switch } from 'antd';
import { RocketOutlined, BellOutlined, DashboardOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

const { Title, Paragraph, Text } = Typography;

interface WelcomeFlowProps {
  userName: string;
  onComplete: () => void;
}

interface WelcomeStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  content?: React.ReactNode;
}

export const WelcomeFlow: React.FC<WelcomeFlowProps> = ({ userName, onComplete }) => {
  const [current, setCurrent] = useState(0);

  const steps: WelcomeStep[] = [
    {
      icon: <RocketOutlined style={{ fontSize: 48, color: '#2563EB' }} />,
      title: `Selamat Datang, ${userName}!`,
      description: 'Buzzr membantu Anda mengelola operasional persampahan dengan lebih efisien.',
    },
    {
      icon: <BellOutlined style={{ fontSize: 48, color: '#2563EB' }} />,
      title: 'Preferensi Notifikasi',
      description: 'Pilih jenis notifikasi yang ingin Anda terima.',
      content: (
        <div style={{ maxWidth: 320, margin: '0 auto' }}>
          {[
            { label: 'TPS Penuh', desc: 'Notifikasi saat TPS mendekati kapasitas' },
            { label: 'Keluhan Baru', desc: 'Notifikasi saat ada laporan warga' },
            { label: 'SLA Mendekati Batas', desc: 'Peringatan batas waktu penyelesaian' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
              <div>
                <Text strong style={{ fontSize: 13 }}>{item.label}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>{item.desc}</Text>
              </div>
              <Switch defaultChecked size="small" />
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <DashboardOutlined style={{ fontSize: 48, color: '#2563EB' }} />,
      title: 'Siap Mulai!',
      description: 'Dashboard Anda sudah siap. Jelajahi fitur-fitur yang tersedia.',
    },
  ];

  const isLast = current === steps.length - 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px' }}
        >
          <div style={{ marginBottom: 24 }}>{steps[current].icon}</div>
          <Title level={3}>{steps[current].title}</Title>
          <Paragraph type="secondary" style={{ marginBottom: 24 }}>
            {steps[current].description}
          </Paragraph>
          {steps[current].content && (
            <div style={{ marginBottom: 32 }}>{steps[current].content}</div>
          )}
          <Space>
            {current > 0 && (
              <Button onClick={() => setCurrent(current - 1)}>Kembali</Button>
            )}
            {isLast ? (
              <Button type="primary" size="large" onClick={onComplete}>
                Mulai Menggunakan Buzzr
              </Button>
            ) : (
              <Button type="primary" onClick={() => setCurrent(current + 1)}>
                Lanjut
              </Button>
            )}
          </Space>
          <div style={{ marginTop: 16 }}>
            <Button type="link" size="small" onClick={onComplete}>
              Lewati
            </Button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === current ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === current ? '#2563EB' : '#E5E7EB',
                  transition: 'all 250ms ease',
                }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
