import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  className = '',
  size = 20,
  strokeWidth = 2,
}) => {
  // Resolve icon component from name
  // Standardize the search by checking for matching keys
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[name];

  if (!IconComponent) {
    // Return a fallback icon (HelpCircle)
    return <Icons.HelpCircle className={className} size={size} strokeWidth={strokeWidth} />;
  }

  return <IconComponent className={className} size={size} strokeWidth={strokeWidth} />;
};

// Export all icons for general use as well
export const Lucide = Icons;
export default DynamicIcon;
