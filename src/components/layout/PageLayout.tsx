/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PAGE LAYOUT — Margins, Not Containers
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A page is a printed sheet. Layout is margins.
 * 
 * Editorial column width (max-w-4xl) — readable, not wide.
 * Structural margins, not generous padding.
 * Header has bottom border (like printed page separator).
 * Large vertical rhythm (paragraph spacing).
 * 
 * No background colors. No shadows. Structural only.
 * 
 * Printable test: Would this feel correct on a sheet of paper? Yes.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { ReactNode } from 'react';
import { Heading, Text } from '../ui/Typography';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export const PageLayout = ({ 
  title, 
  subtitle, 
  actions, 
  children 
}: PageLayoutProps) => {
  return (
    <article className="max-w-4xl mx-auto px-8 py-12">
      <header className="mb-12 border-b border-border pb-6">
        <div className="flex items-baseline justify-between">
          <Heading level={1}>{title}</Heading>
          {actions}
        </div>
        {subtitle && (
          <Text muted className="mt-2 max-w-2xl">
            {subtitle}
          </Text>
        )}
      </header>
      <main className="space-y-12">
        {children}
      </main>
    </article>
  );
};
