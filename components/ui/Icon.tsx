'use client';

/**
 * Unified Icon Component
 * 
 * Renders both Lucide icons and Font Awesome brand icons.
 * - Lucide icons: Use PascalCase names like "Globe", "Settings"
 * - Font Awesome: Use fa- prefix like "fa-notion", "fa-google-drive"
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'lucide-react';
import { isFontAwesomeIcon, getFAIconByName, getFAIconObjectByName } from '@/lib/icons';

interface IconProps {
  /** Icon name - either Lucide (PascalCase) or Font Awesome (fa-prefix) */
  name: string;
  /** CSS classes for sizing and styling */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
}

/**
 * Renders an icon from either Lucide or Font Awesome library
 * 
 * @example
 * // Lucide icon
 * <Icon name="Globe" className="w-5 h-5" />
 * 
 * // Font Awesome brand icon
 * <Icon name="fa-notion" className="w-5 h-5" />
 */
export function Icon({ name, className = 'w-5 h-5', 'aria-label': ariaLabel }: IconProps) {
  // Font Awesome brand icons (including custom SVGs)
  if (isFontAwesomeIcon(name)) {
    const faIconObject = getFAIconObjectByName(name);
    
    // Custom SVG icon
    if (faIconObject?.customSvg) {
      return (
        <span 
          className={className}
          dangerouslySetInnerHTML={{ __html: faIconObject.customSvg }}
          aria-label={ariaLabel}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        />
      );
    }
    
    // Regular Font Awesome icon
    const faIcon = getFAIconByName(name);
    if (faIcon) {
      return (
        <FontAwesomeIcon 
          icon={faIcon} 
          className={className}
          aria-label={ariaLabel}
        />
      );
    }
    
    // Fallback to Link icon if FA icon not found
    return <Link className={className} aria-label={ariaLabel} />;
  }
  
  // Lucide icons
  const LucideIcon = (LucideIcons as Record<string, React.ComponentType<{ className?: string; 'aria-label'?: string }>>)[name];
  
  if (LucideIcon) {
    return <LucideIcon className={className} aria-label={ariaLabel} />;
  }
  
  // Fallback
  return <Link className={className} aria-label={ariaLabel} />;
}

/**
 * Preview component showing the icon with its name
 */
export function IconPreview({ 
  name, 
  size = 'md' 
}: { 
  name: string; 
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  return <Icon name={name} className={sizeClasses[size]} />;
}

export default Icon;

