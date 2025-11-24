// src/components/layout/Footer.tsx
import React from 'react'
import { useRelevntTheme } from '../../contexts/RelevntThemeProvider'
import { Container } from '../shared/Container'

export interface FooterProps {
    className?: string
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
    const { colors } = useRelevntTheme()

    return (
        <footer
            className={className}
            style={{
                background: colors.surface,
                borderTop: `1px solid ${colors.border}`,
            }}
        >
            <Container maxWidth="lg" padding="md">
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        paddingTop: 8,
                        paddingBottom: 16,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            fontSize: 13,
                            color: colors.textSecondary,
                        }}
                    >
                        <span>Authentic intelligence for real people navigating broken systems.</span>
                        <span>Relevnt • Est. 2025</span>
                    </div>
                    <div
                        style={{
                            borderTop: `1px solid ${colors.borderLight}`,
                            paddingTop: 12,
                            textAlign: 'center',
                            color: colors.mutedText,
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