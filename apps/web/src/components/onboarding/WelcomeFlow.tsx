import React, { useState } from 'react';
import { Rocket, BarChart3, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WelcomeFlowProps {
  userName: string;
  onComplete: () => void;
}

interface WelcomeStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const WelcomeFlow: React.FC<WelcomeFlowProps> = ({ userName, onComplete }) => {
  const [current, setCurrent] = useState(0);

  const steps: WelcomeStep[] = [
    {
      icon: <Rocket className="h-12 w-12 text-primary" />,
      title: `Selamat Datang, ${userName}!`,
      description: 'Buzzr membantu Anda mengelola operasional persampahan dengan lebih efisien.',
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-primary" />,
      title: 'Fitur Utama',
      description: 'Pantau TPS, kelola pengangkutan, lacak keluhan warga, dan analisis performa — semua dalam satu dashboard.',
    },
    {
      icon: <LayoutDashboard className="h-12 w-12 text-primary" />,
      title: 'Siap Mulai!',
      description: 'Dashboard Anda sudah siap. Jelajahi fitur-fitur yang tersedia.',
    },
  ];

  const isLast = current === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[1000] bg-background flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="text-center max-w-md px-6"
        >
          <div className="mb-6">{steps[current].icon}</div>
          <h3 className="text-xl font-semibold mb-2">{steps[current].title}</h3>
          <p className="text-sm text-muted-foreground mb-6">{steps[current].description}</p>

          <div className="flex items-center justify-center gap-2">
            {current > 0 && (
              <Button variant="outline" onClick={() => setCurrent(current - 1)}>Kembali</Button>
            )}
            {isLast ? (
              <Button size="lg" onClick={onComplete}>Mulai Menggunakan Buzzr</Button>
            ) : (
              <Button onClick={() => setCurrent(current + 1)}>Lanjut</Button>
            )}
          </div>

          <div className="mt-4">
            <Button variant="ghost" size="sm" className="text-xs" onClick={onComplete}>Lewati</Button>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 rounded-full transition-all duration-250',
                  i === current ? 'w-6 bg-primary' : 'w-2 bg-border',
                )}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
