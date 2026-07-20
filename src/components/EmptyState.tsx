import React from 'react';
import { Lucide } from './icons';

interface EmptyStateProps {
  icon: keyof typeof Lucide;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const IconComponent = (Lucide[icon] || Lucide.HelpCircle) as React.ElementType;

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border/80 rounded-2xl bg-card/20 backdrop-blur-sm max-w-md mx-auto my-6 transition-all duration-300 hover:border-primary/30">
      <div className="p-3 bg-secondary rounded-2xl text-muted-foreground/80 mb-4 transition-transform duration-300 hover:scale-105 hover:rotate-3 shadow-inner">
        <IconComponent size={28} className="text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-[280px] leading-relaxed">{description}</p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-primary-foreground bg-primary rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Lucide.Plus size={14} />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
