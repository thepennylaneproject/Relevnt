import React from "react";

export interface IconProps {
  size?: number;
  strokeWidth?: number;
  color?: string;
  accentColor?: string;
  className?: string;
}

const defaultAccent = "var(--accent-dot, var(--accent))";

// Helper wrapper for nav icons
export const NavIconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 24,
      height: 24,
    }}
  >
    {children}
  </span>
);

// Home Icon
export const HomeIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
    <circle cx="18" cy="6" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Dashboard Icon
export const DashboardIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <circle cx="19" cy="5" r="1.5" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Jobs Icon
export const JobsIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    <circle cx="18" cy="10" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Applications Icon
export const ApplicationsIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
    <circle cx="17" cy="6" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Resume Icon
export const ResumeIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
    <circle cx="17" cy="5" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Resume Optimizer Icon
export const ResumeOptimizerIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M12 18l-3-3m0 0l3-3m-3 3h6" />
    <circle cx="17" cy="5" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Cover Letter Icon
export const CoverLetterIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
    <circle cx="18" cy="8" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Skills Gap Icon
export const SkillsGapIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <circle cx="18" cy="8" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Courses Icon
export const CoursesIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    <circle cx="18" cy="6" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// AI Assist Icon
export const AiAssistIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    <circle cx="17" cy="5" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Voice Tone Icon
export const VoiceToneIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    <circle cx="18" cy="6" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Keywords Icon
export const KeywordsIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
    <circle cx="18" cy="6" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Match Score Icon
export const MatchScoreIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M16 12l-4-4-4 4" />
    <line x1="12" y1="16" x2="12" y2="8" />
    <circle cx="17" cy="7" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Notifications Icon
export const NotificationsIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <circle cx="18" cy="6" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Messages Icon
export const MessagesIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <circle cx="18" cy="6" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Profile Icon
export const ProfileIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
    <circle cx="18" cy="6" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Settings Icon
export const SettingsIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
    <circle cx="18" cy="6" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Preferences Icon
export const PreferencesIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
    <circle cx="18" cy="6" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Subscription Tier Icon
export const SubscriptionTierIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    <circle cx="17" cy="5" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Auto Apply Icon
export const AutoApplyIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    <circle cx="18" cy="6" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Recruiter Visibility Icon
export const RecruiterVisibilityIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  accentColor,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
    <circle cx="18" cy="6" r="2" fill={accentColor || defaultAccent} stroke="none" />
  </svg>
);

// Check Icon
export const CheckIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 2,
  color = "currentColor",
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Close Icon
export const CloseIcon: React.FC<IconProps> = ({
  size = 24,
  strokeWidth = 2,
  color = "currentColor",
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
