// src/components/layout/Footer.tsx
import React from 'react'

export interface FooterProps {
    className?: string
}

/**
 * Footer — Marginalia style.
 * Subtle small text at bottom, no background, no dividers.
 */
export const Footer: React.FC<FooterProps> = ({ className }) => {
    return (
        <footer className={`footer-marginalia ${className || ''}`}>
            <span>Authentic intelligence for real people navigating broken systems.</span>
            <span className="footer-marginalia__brand">
                Relevnt · Est. 2025
            </span>
        </footer>
    )
}

Footer.displayName = 'Footer'