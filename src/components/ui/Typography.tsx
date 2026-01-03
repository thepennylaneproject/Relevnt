/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TYPOGRAPHY COMPONENTS — Editorial Hierarchy
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Typography establishes hierarchy through weight and modest scale jumps.
 * Not dramatic size changes.
 * 
 * Restrained scale — printable sizes:
 * H1: 30px (page title)
 * H2: 20px (section)
 * H3: 18px (subsection)
 * H4: 16px (emphasis)
 * Body: 16px (one size for text)
 * 
 * Printable test: Would this feel correct in a printed essay? Yes.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { ReactNode } from 'react';

type HeadingLevel = 1 | 2 | 3 | 4;

interface HeadingProps {
  level: HeadingLevel;
  children: ReactNode;
  className?: string;
}

export const Heading = ({ level, children, className = '' }: HeadingProps) => {
  // Restrained scale — printable sizes
  const styles = {
    1: 'text-3xl font-bold tracking-tight',      // 30px — page title
    2: 'text-xl font-semibold tracking-tight',   // 20px — section
    3: 'text-lg font-semibold',                  // 18px — subsection
    4: 'text-base font-medium',                  // 16px — emphasis
  };
  
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return (
    <Tag className={`font-display text-text ${styles[level]} ${className}`}>
      {children}
    </Tag>
  );
};

interface TextProps {
  muted?: boolean;
  children: ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

export const Text = ({
  muted = false,
  children,
  className = '',
  as: Tag = 'p',
}: TextProps) => {
  return (
    <Tag className={`
      text-base 
      leading-relaxed
      ${muted ? 'text-text-muted' : 'text-text'}
      ${className}
    `}>
      {children}
    </Tag>
  );
};
