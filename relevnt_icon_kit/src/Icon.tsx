import React from 'react';

type Tone = 'default' | 'muted' | 'accent' | 'success' | 'warning' | 'error';
type Size = 12 | 16 | 20 | 24 | 32;

export type IconProps = {
  name: 'i-briefcase' | 'i-search' | 'i-star' | 'i-check' | 'i-bell' | string;
  size?: Size;
  tone?: Tone;
  title?: string;
  className?: string;
};

export const Icon: React.FC<IconProps> = ({ name, size=20, tone='default', title, className }) => {
  const aria = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true };
  return (
    <svg className={['rlv-icon', `rlv-icon--${tone}`, className].filter(Boolean).join(' ')}
         width={size} height={size} aria-hidden={!title} {...aria}>
      {title ? <title>{title}</title> : null}
      <use href={`#${name}`} />
    </svg>
  );
};
