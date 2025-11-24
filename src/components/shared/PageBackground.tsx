import React from "react";

type PageBackgroundProps = {
  children: React.ReactNode;
  className?: string;
};

export const PageBackground: React.FC<PageBackgroundProps> = ({ children, className = "" }) => {
  return (
    <div
      className={className}
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text)",
      }}
    >
      {children}
    </div>
  );
};

export default PageBackground;
