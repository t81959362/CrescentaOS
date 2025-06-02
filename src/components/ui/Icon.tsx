import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../../lib/utils';

type IconName = keyof typeof LucideIcons;

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

const Icon: React.FC<IconProps> = ({ name, className, size = 24 }) => {
  // Check if the name is a URL (simple check for http/https or data URI)
  const isUrl = name.startsWith('http://') || name.startsWith('https://') || name.startsWith('data:');

  if (isUrl) {
    return (
      <img 
        src={name} 
        alt={name} // You might want a more descriptive alt text
        style={{ width: size, height: size }}
        className={cn('', className)}
      />
    );
  }

  // Transform kebab-case to PascalCase (e.g., "file-plus" to "FilePlus")
  const pascalCaseName = name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  // Get the icon component
  const IconComponent = LucideIcons[pascalCaseName as IconName] || LucideIcons.HelpCircle;
  
  return (
    <IconComponent
      size={size}
      className={cn('', className)}
    />
  );
};

export default Icon;