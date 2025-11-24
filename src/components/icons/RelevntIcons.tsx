// icons.tsx
import React from "react";

export interface IconProps {
  size?: number;
  strokeWidth?: number;
  color?: string;
  accentColor?: string;
  className?: string;
}

const defaultSize = 24;
const defaultStroke = 1.9;
const defaultAccent = "var(--accent-color, #C7A56A)";

function svgProps({
  size,
  strokeWidth,
  color,
  className,
}: IconProps) {
  return {
    width: size ?? defaultSize,
    height: size ?? defaultSize,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color ?? "currentColor",
    strokeWidth: strokeWidth ?? defaultStroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: `icon-sketch ${className ?? ""}`.trim(),
  };
}

/* -------------------- CORE / NAV -------------------- */

export const HomeIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <path d="M4.6 11.3 11.9 4.4 19.3 11.2" />
      <path d="M7.2 11.5v7.9h9.1v-6.7" />
      <circle
        cx="15.7"
        cy="6.9"
        r="1.05"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const DashboardIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <path d="M4.4 5.1h7.3v6.4H4.6z" />
      <path d="M13.2 4.6h6.3v3.7h-6.1z" />
      <path d="M13.3 10.4h6v6.9h-6.2z" />
      <path d="M4.7 13.2h6.7v4.5H4.5z" />
      <circle
        cx="7.5"
        cy="6.8"
        r="1.05"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const JobsIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <path d="M4.3 9h15.3v7.4c0 1.1-.7 1.8-1.8 1.8H6.1c-1.1 0-1.8-.7-1.8-1.8z" />
      <path d="M9.2 8.9V7.3c0-.9.6-1.5 1.5-1.5h2.2c.9 0 1.5.6 1.5 1.5v1.3" />
      <path d="M4.3 11.1h5.8M14.1 11.1h5.6" />
      <circle
        cx="12"
        cy="11.1"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const ApplicationsIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <path d="M6.1 4.8h9.2l2.7 3.1v11.3c0 1.1-.8 1.8-1.9 1.8H8c-1.1 0-1.9-.7-1.9-1.8z" />
      <path d="M14.6 4.8v3.4h3.4" />
      <path d="M9.1 10.5h4.2M9.1 13.1h3.1" />
      <path d="M13.9 15.7 16 17.5l3-3.7" />
      <circle
        cx="11.6"
        cy="6.7"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const ResumeIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <path d="M7 4.7h7.2l3 2.9v11.7c0 1.1-.8 1.9-2 1.9H7.2c-1.2 0-2-.8-2-1.9V6.6c0-1.1.8-1.9 1.8-1.9z" />
      <path d="M14.2 4.7v3H17" />
      <path d="M9 11h6M9 13.7h4.3" />
      <circle
        cx="15.4"
        cy="5.5"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const ResumeOptimizerIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <path d="M7 4.7h7.2l3 2.9v11.7c0 1.1-.8 1.9-2 1.9H7.2c-1.2 0-2-.8-2-1.9V6.6c0-1.1.8-1.9 1.8-1.9z" />
      <path d="M14.2 4.7v3H17" />
      <path d="M9.1 11.1h4.1" />
      {/* slightly messy pencil */}
      <path d="M16.4 12.4 19 15l-3.1 3.2-2.9.2.2-2.9z" />
      <circle
        cx="16.3"
        cy="12.3"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const CoverLetterIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <path d="M4.4 7.2h15.2v9.6c0 1.1-.8 1.8-1.9 1.8H6.3c-1.1 0-1.9-.7-1.9-1.8z" />
      <path d="M5.5 8.1 12 12.9l6.5-4.8" />
      <circle
        cx="12"
        cy="12.3"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

/* -------------------- ANALYSIS / INSIGHT -------------------- */

export const SkillsGapIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      {/* uneven bars */}
      <path d="M6.2 17.5V9.1" />
      <path d="M12 17.5V7.1" />
      <path d="M17.8 17.5v-5.4" />
      <circle
        cx="17.8"
        cy="10.9"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const CoursesIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      {/* wobbly open book */}
      <path d="M5.3 8A2 2 0 0 1 7.2 6.6l4.1.7v10.8L7.3 17a2.2 2.2 0 0 0-2 .9z" />
      <path d="M18.7 8a2 2 0 0 0-1.9-1.4l-4.1.7v10.8L16.7 17a2.2 2.2 0 0 1 2 .9z" />
      <circle
        cx="15.6"
        cy="7.2"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const AiAssistIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <line x1="12" y1="4.6" x2="12" y2="8.4" />
      <line x1="12" y1="15.7" x2="12" y2="19.3" />
      <line x1="4.9" y1="11.9" x2="8.6" y2="11.9" />
      <line x1="15.4" y1="11.9" x2="19.1" y2="11.9" />
      <line x1="8.2" y1="7.7" x2="10.7" y2="10.3" />
      <line x1="15.6" y1="15.8" x2="17.8" y2="18.1" />
      <circle
        cx="12"
        cy="12"
        r="1.15"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const VoiceToneIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      {/* chat bubble */}
      <path d="M6.4 7.2h11.2c1 0 1.8.8 1.8 1.8v3.6c0 1-.8 1.8-1.8 1.8h-4.6L10 18.7v-3.9H6.4c-1 0-1.8-.8-1.8-1.8V9c0-1 .8-1.8 1.8-1.8z" />
      <circle
        cx="16.5"
        cy="8.6"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const KeywordsIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <circle cx="11" cy="11" r="4.1" />
      <path d="M13.9 13.9 18 18" />
      <circle
        cx="11"
        cy="11"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const MatchScoreIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <path d="M5 15.2a7.1 7.1 0 0 1 14.1 0" />
      <path d="M12 11.1v3.7" />
      <circle
        cx="12"
        cy="11.1"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const NotificationsIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <path d="M12 5a3 3 0 0 1 3 3v2.5l.8 2.8H8.2L9 10.5V8a3 3 0 0 1 3-3z" />
      <path d="M10.6 17.3a1.6 1.6 0 0 0 2.8 0" />
      <circle
        cx="12"
        cy="13.5"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const MessagesIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <path d="M6.2 8.2h7.3c1.1 0 2 .9 2 2v2.1c0 1.1-.9 2-2 2H9.7l-2.8 1.7V14a4.2 4.2 0 0 1-1-3.3c.1-1.7 1.4-2.5 2.3-2.5z" />
      <path d="M11.5 9.1h4.1c1.4 0 2.4 1 2.4 2.5v2.1l1.3 1.1" />
      <circle
        cx="10.1"
        cy="9.1"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

/* -------------------- PROFILE / SETTINGS -------------------- */

export const ProfileIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <path d="M12 7.1a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6z" />
      <path d="M6.1 18.6c.9-2.3 3.2-3.7 5.9-3.7 2.7 0 4.9 1.4 5.9 3.7" />
      <circle
        cx="12"
        cy="9.1"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const SettingsIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <path d="M12 5.1c.6 0 1 .3 1.3.8l.5 1 1.2.2c.7.1 1.2.6 1.3 1.3l.2 1.2 1 .6c.6.4.8.9.8 1.5s-.2 1.1-.8 1.5l-1 .6-.2 1.2c-.1.7-.6 1.2-1.3 1.3l-1.2.2-.5 1c-.3.5-.7.8-1.3.8s-1-.3-1.3-.8l-.5-1-1.2-.2c-.7-.1-1.2-.6-1.3-1.3l-.2-1.2-1-.6c-.6-.4-.8-.9-.8-1.5s.2-1.1.8-1.5l1-.6.2-1.2c.1-.7.6-1.2 1.3-1.3l1.2-.2.5-1c.3-.5.7-.8 1.3-.8z" />
      <circle cx="12" cy="12" r="2.25" />
      <circle
        cx="12"
        cy="12"
        r="1"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const PreferencesIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      {/* three sliders, slightly uneven */}
      <line x1="7" y1="5" x2="7" y2="19" />
      <line x1="12" y1="5.5" x2="12" y2="19.2" />
      <line x1="17" y1="4.8" x2="17" y2="19" />
      <circle cx="7" cy="9.2" r="1.6" />
      <circle cx="12" cy="14.1" r="1.6" />
      <circle cx="17" cy="10.4" r="1.6" />
      <circle
        cx="12"
        cy="14.1"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const SubscriptionTierIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      {/* star badge, irregular points */}
      <path d="M12 5.3 13.7 9l3.9.4-2.8 2.4.8 3.8L12 14.8l-3.6 1.8.9-3.8-2.9-2.4 3.9-.4z" />
      <circle
        cx="13.7"
        cy="5.9"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const AutoApplyIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      {/* jagged lightning */}
      <path d="M11.1 4.4 7.3 12.2h4.1L10 19.7 16.9 11.3h-4.1z" />
      <circle
        cx="11.4"
        cy="7.1"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const RecruiterVisibilityIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <path d="M3.7 12s2.9-4.7 8.3-4.7 8.3 4.7 8.3 4.7-2.9 4.7-8.3 4.7S3.7 12 3.7 12z" />
      <circle cx="12" cy="12" r="2.4" />
      <circle
        cx="12"
        cy="12"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

/* -------------------- GENERIC / UTILITY -------------------- */

export const CheckIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <path d="M4.6 12.4 9.5 17l9.7-10.3" />
      <circle
        cx="4.9"
        cy="12.3"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const CloseIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <path d="M6.2 6.2 17.8 17.8" />
      <path d="M17.8 6.2 6.2 17.8" />
      <circle
        cx="12"
        cy="12"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};

export const InfoIcon: React.FC<IconProps> = (props) => {
  const accent = props.accentColor ?? defaultAccent;
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="8.1" />
      <line x1="12" y1="10.2" x2="12" y2="15" />
      <circle cx="12" cy="8.3" r="0.85" />
      <circle
        cx="16"
        cy="8.1"
        r="0.95"
        fill={accent}
        stroke="none"
        className="icon-dot"
      />
    </svg>
  );
};