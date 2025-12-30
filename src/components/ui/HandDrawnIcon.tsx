import React from 'react';
import { Icon, IconName, IconSize } from './Icon';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HAND-DRAWN ICON COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Supports two types of icons:
 * 1. SVG-based: Using the existing <Icon /> component which uses currentColor.
 * 2. PNG-based: Using the new hand-drawn charcoal assets with auto-inversion.
 * 
 * Design System: "Midnight Journal" (Sketchbook/Chalkboard aesthetic)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type ResumeIconName = 
  | 'contact'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'projects';

interface HandDrawnIconProps {
  /** SVG-based icon name from Icon.tsx */
  name?: IconName;
  /** PNG-based resume icon name */
  resumeName?: ResumeIconName;
  size?: IconSize | number;
  className?: string;
}

const resumeIconPathMap: Record<ResumeIconName, string> = {
  contact: '/relevnt_final/assets/resume/contact.png',
  summary: '/relevnt_final/assets/resume/summary.png',
  skills: '/relevnt_final/assets/resume/skills.png',
  experience: '/relevnt_final/assets/resume/experience.png',
  education: '/relevnt_final/assets/resume/education.png',
  certifications: '/relevnt_final/assets/resume/certifications.png',
  projects: '/relevnt_final/assets/resume/projects.png',
};

export const HandDrawnIcon: React.FC<HandDrawnIconProps> = ({
  name,
  resumeName,
  size = 'md',
  className = '',
}) => {
  // Determine pixel size for PNGs
  const getPixelSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm': return 24;
      case 'md': return 32;
      case 'lg': return 48;
      case 'xl': return 64;
      case 'hero': return 120;
      default: return 32;
    }
  };

  const pixelSize = getPixelSize();

  // 1. Render PNG Icon (Resume Builder specific)
  if (resumeName) {
    const src = resumeIconPathMap[resumeName];
    return (
      <div 
        className={`hand-drawn-wrapper ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
      >
        <img 
          src={src} 
          alt={`${resumeName} icon`} 
          className="relevnt-asset w-full h-full object-contain"
        />
      </div>
    );
  }

  // 2. Render SVG Icon (Standard app icons)
  if (name) {
    return (
      <span className={`hand-drawn-icon-wrapper ${className}`}>
        <Icon name={name} size={size as IconSize} />
      </span>
    );
  }

  return null;
};

export default HandDrawnIcon;
