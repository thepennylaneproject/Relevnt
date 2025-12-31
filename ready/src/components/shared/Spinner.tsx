import React from 'react';

/**
 * ðŸŽ" LoadingSpinner component with flexible display modes
 */

export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    fullScreen?: boolean;  // ✅ ADD THIS
    text?: string;         // ✅ ADD THIS
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    color = '#4E808D',
    fullScreen = false,    // ✅ ADD THIS
    text,                  // ✅ ADD THIS
}) => {
    // ✅ FIX: Define containerStyles with fullScreen check
    const containerStyles: React.CSSProperties = fullScreen
        ? {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
        }
        : {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
        };

    const sizes = {
        sm: { width: '24px', height: '24px' },
        md: { width: '40px', height: '40px' },
        lg: { width: '60px', height: '60px' },
    };

    return (
        <div style={containerStyles}>
            <div style={{ textAlign: 'center' }}>
                <svg
                    style={{
                        ...sizes[size],
                        animation: 'spin 1s linear infinite',
                        color,
                        margin: '0 auto',
                    }}
                    viewBox="0 0 24 24"
                >
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>

                {/* ✅ FIX: Use text prop properly */}
                {text && (
                    <p style={{ marginTop: '1rem', color: '#666' }}>
                        {text}
                    </p>
                )}
            </div>
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};