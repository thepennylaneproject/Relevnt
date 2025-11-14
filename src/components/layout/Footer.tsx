import React from 'react';
import { useIsDarkMode } from '../../themes';
import { Container } from '../shared/Container';

export interface FooterProps {
    className?: string;
}
export const Footer: React.FC<FooterProps> = ({ className }) => {
    const isDark = useIsDarkMode();

    return (
        <footer
            className={className}
            style={{
                background: isDark ? '#0F0F0F' : '#F9F8F6',
                borderTop: `1px solid ${isDark ? '#404040' : '#E7DCC8'}`,
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
                                color: isDark ? '#F3F1ED' : '#0B0B0B',
                                marginBottom: '8px',
                            }}
                        >
                            Relevnt
                        </h3>
                        <p
                            style={{
                                fontSize: '12px',
                                color: isDark ? '#AAAAAA' : '#666666',
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
                                color: isDark ? '#F3F1ED' : '#0B0B0B',
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
                                            color: isDark ? '#AAAAAA' : '#666666',
                                            textDecoration: 'none',
                                            fontSize: '12px',
                                            transition: 'color 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLElement).style.color = '#CDAA70';
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.color = isDark
                                                ? '#AAAAAA'
                                                : '#666666';
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
                                color: isDark ? '#F3F1ED' : '#0B0B0B',
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
                                            color: isDark ? '#AAAAAA' : '#666666',
                                            textDecoration: 'none',
                                            fontSize: '12px',
                                            transition: 'color 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLElement).style.color = '#CDAA70';
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.color = isDark
                                                ? '#AAAAAA'
                                                : '#666666';
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
                        borderTop: `1px solid ${isDark ? '#404040' : '#E7DCC8'}`,
                        paddingTop: '24px',
                        textAlign: 'center',
                        color: isDark ? '#AAAAAA' : '#666666',
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