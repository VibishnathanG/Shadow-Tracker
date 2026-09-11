'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  // Close on ESC keypress & lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      const scrollY = window.scrollY;
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyPos = document.body.style.position;
      const prevBodyTop = document.body.style.top;
      const prevBodyWidth = document.body.style.width;

      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.position = prevBodyPos;
        document.body.style.top = prevBodyTop;
        document.body.style.width = prevBodyWidth;
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const [mounted, setMounted] = React.useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 top-0 left-0 w-full h-full z-[99999] flex flex-col items-center justify-center p-3 sm:p-6 pointer-events-auto overflow-hidden">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full ${sizeClasses[size]} glass-panel bg-surface-elevated border-2 border-primary/40 text-foreground rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[88vh] sm:max-h-[85vh] my-auto`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-border/60 shrink-0 bg-surface">
              <h2 className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                aria-label="Close modal"
              >
                <Lucide.X size={18} />
              </button>
            </div>

            {/* Content body */}
            <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1 text-sm scrollbar-thin pb-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted || typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
};

export default Modal;
