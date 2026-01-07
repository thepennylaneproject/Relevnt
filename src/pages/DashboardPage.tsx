import React from 'react';
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import './DashboardPage.css';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE OPEN LEDGER BOOK — Dashboard
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Physical metaphor: A double-page spread of a personal ledger.
 * - Writing Page (left): where you compose your next action
 * - Gutter (center): the fold, deliberate pause
 * - Tally Page (right): where you count your facts
 * 
 * Constraints:
 * - ONE primary CTA total
 * - THREE ledger rows maximum
 * - TWO open loops maximum
 * - No cards, no panels, no widgets
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

export default function DashboardPage(): JSX.Element {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <div className="loading-overlay"><div className="loading-spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="ledger-spread">
        
        {/* ═══════════════════════════════════════════════════════════════════
            WRITING PAGE (Primary Zone)
            Purpose: This is where the user receives their singular, time-sensitive directive.
            ═══════════════════════════════════════════════════════════════════ */}
        <main className="writing-page">
          
          {/* Header Unit: Grounding phrase + Greeting */}
          <header className="header-unit">
            <h1 className="grounding-phrase">
              You're here. Nothing is on fire.
            </h1>
            <p className="greeting">
              Good afternoon, friend
            </p>
          </header>
          
          {/* Focus Block: Directive text + ONE primary CTA */}
          <section className="focus-block">
            <h2 className="focus-directive">
              Start your search
            </h2>
            <p className="focus-description">
              Find roles aligned with your goals.
            </p>
            <button className="sketch-button primary-cta">
              Browse Roles
            </button>
          </section>
          
          {/* Open Loops: Listed items, NOT boxed (below fold) */}
          <section className="open-loops">
            <h3 className="section-label">Open Loops</h3>
            <ol className="loops-list">
              <li className="loop-item">
                <span className="loop-title">Initial Setup</span>
                <span className="loop-desc">Add your first resume to get started.</span>
              </li>
              <li className="loop-item">
                <span className="loop-title">The Weekly Pulse</span>
                <span className="loop-desc">Review your application conversion rates.</span>
              </li>
            </ol>
          </section>
          
          {/* Footer Marginalia: Quiet closing note */}
          <footer className="footer-marginalia">
            <span>Authentic intelligence for real people navigating broken systems.</span>
            <span className="footer-marginalia__brand">
                Relevnt · Est. 2025
            </span>
          </footer>
          
        </main>
        
        {/* ═══════════════════════════════════════════════════════════════════
            GUTTER (Margin Zone)
            Purpose: Visual pause and structural rest between action and reference.
            Max 10 words, ~60% opacity, non-interactive.
            ═══════════════════════════════════════════════════════════════════ */}
        <aside className="gutter">
          <p className="marginalia-whisper">
            Quietly helping you grow.
          </p>
        </aside>
        
        {/* ═══════════════════════════════════════════════════════════════════
            TALLY PAGE (Secondary Zone)
            Purpose: Passive reference of progress at a glance—numbers, not actions.
            ═══════════════════════════════════════════════════════════════════ */}
        <aside className="tally-page">
          
          {/* Momentum Indicator */}
          <div className="momentum-indicator">
            <span className="section-label">Daily Momentum</span>
            <p className="momentum-status">
              —
            </p>
          </div>
          
          {/* Ledger Table: Exactly 3 rows */}
          <table className="ledger-table">
            <tbody>
              <tr className="ledger-row">
                <td className="ledger-label">Discovered</td>
                <td className="ledger-value">—</td>
              </tr>
              <tr className="ledger-row">
                <td className="ledger-label">Applied</td>
                <td className="ledger-value">—</td>
              </tr>
              <tr className="ledger-row">
                <td className="ledger-label">Interviews</td>
                <td className="ledger-value">—</td>
              </tr>
            </tbody>
          </table>
          
        </aside>
        
      </div>
  );
}
