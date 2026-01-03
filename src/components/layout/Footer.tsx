// src/components/layout/Footer.tsx
import React from 'react'
import { Container } from '../shared/Container'

export interface FooterProps {
    className?: string
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
    return (
        <footer className={`footer ${className || ''}`}>
            <Container maxWidth="lg" padding="md">
                <div className="flex flex-col gap-6 py-8">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <span className="footer-tagline">Authentic intelligence for real people navigating broken systems.</span>
                        <div className="footer-brand flex items-center gap-4">
                            <span>Relevnt</span>
                            <span className="w-1 h-1 rounded-full bg-accent" />
                            <span>Est. 2025</span>
                        </div>
                    </div>
                </div>
            </Container>
        </footer>
    )
}

Footer.displayName = 'Footer'