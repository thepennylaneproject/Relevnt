import React from 'react';
import { useRelevntColors } from '../../hooks/useRelevntColors';
import { Container } from '../shared/Container';

export interface FooterProps {
    className?: string;
}
export const Footer: React.FC<FooterProps> = ({ className }) => {
    const colors = useRelevntColors();
    const isDark = colors.background === '#1A1A1A';

    return (
        <footer
            className={className}
            style={{
                background: colors.surface,
                borderTop: `1px solid ${colors.border}`,
                marginTop: '64px',
                paddingTop: '48px',
                paddingBottom: '48px',
            }}
        >
            <Container maxWidth="lg" padding="lg">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '48px',
                        marginBottom: '32px',
                    }}
                >
                    <div>
                        <h3
                            style={{
                                fontSize: '16px',
                                fontWeight: 700,
                                color: colors.text,
                                marginBottom: '8px',
                            }}
                        >
                            Relevnt
                        </h3>
                        <p
                            style={{
                                fontSize: '12px',
                                color: colors.textSecondary,
                                lineHeight: '1.6',
                                margin: 0,
                            }}
                        >
                            Authentic intelligence for real people navigating broken systems.
                        </p>
                    </div>

                    <div>
                        <h4
                            style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: colors.text,
                                marginBottom: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                margin: 0,
                            }}
                        >
                            Resources
                        </h4>
                        <ul
                            style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }}
                        >
                            {['Help Center', 'Pricing', 'Blog'].map((item) => (
                                <li key={item}>
                                    <a
                                        href="#"
                                        style={{
                                            color: colors.textSecondary,
                                            textDecoration: 'none',
                                            fontSize: '12px',
                                            transition: 'color 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLElement).style.color = colors.accent;
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.color = colors.textSecondary;
                                        }}
                                    >
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4
                            style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: colors.text,
                                marginBottom: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                margin: 0,
                            }}
                        >
                            Legal
                        </h4>
                        <ul
                            style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }}
                        >
                            {['Privacy', 'Terms', 'Cookies'].map((item) => (
                                <li key={item}>
                                    <a
                                        href="#"
                                        style={{
                                            color: colors.textSecondary,
                                            textDecoration: 'none',
                                            fontSize: '12px',
                                            transition: 'color 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLElement).style.color = colors.accent;
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.color = colors.textSecondary;
                                        }}
                                    >
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div
                    style={{
                        borderTop: `1px solid ${colors.border}`,
                        paddingTop: '24px',
                        textAlign: 'center',
                        color: colors.textSecondary,
                        fontSize: '12px',
                    }}
                >
                    <p style={{ margin: 0 }}>© 2025 Relevnt. All rights reserved.</p>
                </div>
            </Container>
        </footer>
    );
};

Footer.displayName = 'Footer';