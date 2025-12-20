import React, { InputHTMLAttributes } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;      // ✅ ADD THIS
    helperText?: string;      // ✅ ADD THIS
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, size = 'md', fullWidth = false, helperText, className = '', ...props }, ref) => {
        const sizes = {
            sm: { padding: '0.5rem', fontSize: '14px' },
            md: { padding: '0.75rem', fontSize: '16px' },
            lg: { padding: '1rem', fontSize: '18px' },
        };

        return (
            <div style={{ width: fullWidth ? '100%' : 'auto' }}>
                {label && <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{label}</label>}
                <input
                    ref={ref}
                    style={{
                        ...sizes[size],
                        width: fullWidth ? '100%' : 'auto',
                        boxSizing: 'border-box',
                        border: error ? '2px solid red' : '1px solid #ccc',
                        borderRadius: '4px',
                        fontFamily: 'inherit',
                    }}
                    className={className}
                    {...props}
                />
                {error && <span style={{ color: 'red', fontSize: '12px', display: 'block', marginTop: '0.25rem' }}>{error}</span>}
                {helperText && !error && <span style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '0.25rem' }}>{helperText}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';