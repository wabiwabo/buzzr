import React, { useEffect } from 'react';
import { Typography, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

const { Title } = Typography;

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const SlideOver: React.FC<SlideOverProps> = ({
  open,
  onClose,
  title,
  width = 480,
  footer,
  children,
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="slide-over-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{ opacity: 1 }}
          />
          <motion.div
            className="slide-over-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ width, transform: 'none' }}
          >
            <div className="slide-over-header">
              <Title level={5} style={{ margin: 0 }}>{title}</Title>
              <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
            </div>
            <div className="slide-over-body">
              {children}
            </div>
            {footer && (
              <div className="slide-over-footer">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
