// src/components/layout/Footer.tsx
import React from 'react'
import { Container } from '../shared/Container'

export interface FooterProps {
    className?: string
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
    return (
        <footer
            className={className}
            style={{
                background: 'var(--surface)',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: 'auto',
            }}
        >
            <Container maxWidth="lg" padding="md">
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 24,
                        paddingTop: 32,
                        paddingBottom: 32,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 16,
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                        }}
                    >
                        <span style={{ fontWeight: 500, color: 'var(--text)' }}>Authentic intelligence for real people navigating broken systems.</span>
                        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                            <span>Relevnt</span>
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent)' }} />
                            <span>Est. 2025</span>
                        </div>
                    </div>
                    <div
                        style={{
                            borderTop: '1px solid var(--border-subtle)',
                            paddingTop: 16,
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: 12,
                        }}
                    >
                        <p style={{ margin: 0 }}>© 2025 Relevnt. All rights reserved.</p>
                    </div>
                </div>
            </Container>
        </footer>
    )
}

Footer.displayName = 'Footer'