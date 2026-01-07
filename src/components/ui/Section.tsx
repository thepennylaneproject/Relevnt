/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SECTION COMPONENT — Ledger System
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Spacing + optional hairline dividers pattern.
 * Replaces default card containers for layout grouping.
 * 
 * Usage:
 *   <Section>Content</Section>
 *   <Section divider="top">Content with top rule</Section>
 *   <Section divider="both" spacing="lg">Content with both rules</Section>
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
    divider?: 'top' | 'bottom' | 'both' | 'none';
    spacing?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
    divider = 'none',
    spacing = 'md',
    children,
    className = '',
    ...props
}) => {
    const classes = [
        'section',
        divider !== 'none' ? `section--divider-${divider}` : '',
        spacing !== 'md' ? `section--spacing-${spacing}` : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <section className={classes} {...props}>
            {children}
        </section>
    );
};

export default Section;
