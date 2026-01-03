import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from "../lib/supabase";
import { PageLayout } from "../components/layout/PageLayout";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Heading, Text } from "../components/ui/Typography";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Icon, IconName } from "../components/ui/Icon";
import { useAuth } from "../contexts/AuthContext";
import { useApplications } from "../hooks/useApplications";
import { useJobStats } from "../hooks/useJobStats";
import { useWellnessMode } from "../hooks/useWellnessMode";
import { useStrategicPivot } from "../hooks/useStrategicPivot";
import { WellnessCheckin } from "../components/dashboard/WellnessCheckin";
import StrategicPivotReport from "../components/insights/StrategicPivotReport";
import InsightsEmptyState from "../components/insights/InsightsEmptyState";
import { getReadyUrl } from "../config/cross-product";

// User state enum for adaptive UI
enum UserState {
  ZERO_APPLICATIONS = "zero_applications",
  ACTIVE_APPLICATIONS = "active_applications",
  IN_INTERVIEWS = "in_interviews",
  ALL_CAUGHT_UP = "all_caught_up",
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DASHBOARD PAGE — Enhanced UX Redesign
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Key improvements:
 * 1. Centered hero with prominent CTA
 * 2. Today's Priority micro-module for immediate engagement
 * 3. Two-column foundation cards with actionable sublabels
 * 4. Multi-column pipeline stats (no more sprawling zeros)
 * 5. Quick actions row for momentum
 * 6. Progress tracker for engagement loops
 * 7. Celebratory microcopy and momentum cues
 */

export default function DashboardPage(): JSX.Element {
  const { user, loading: authLoading } = useAuth();
  const { applications } = useApplications();
  const { total } = useJobStats();
  const { mode: wellnessMode } = useWellnessMode();
  const {
    latestReport,
    loading: insightsLoading,
    canGenerateReport,
    minApplicationsRequired,
    currentApplicationCount,
    generateReport,
    applyRecommendation,
    dismissRecommendation,
  } = useStrategicPivot();
  const navigate = useNavigate();
  const [generatingReport, setGeneratingReport] = React.useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-accent/20 border-t-accent animate-spin mx-auto" />
          <Text muted className="uppercase tracking-widest text-[10px] font-bold">Initialising your desk...</Text>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DETECT USER STATE
  // ───────────────────────────────────────────────────────────────────────────

  const activeApplications = applications.filter((a) =>
    ["applied", "interviewing", "in-progress"].includes(a.status || "")
  );
  const interviewingCount = applications.filter(
    (a) => a.status === "interviewing"
  ).length;
  const appliedCount = applications.filter(
    (a) => a.status === "applied"
  ).length;
  const discoveredCount = total || 0;

  // Determine user state for adaptive content
  let userState = UserState.ZERO_APPLICATIONS;
  if (interviewingCount > 0) {
    userState = UserState.IN_INTERVIEWS;
  } else if (activeApplications.length > 0) {
    userState = UserState.ACTIVE_APPLICATIONS;
  } else if (applications.length > 0 && appliedCount === 0) {
    userState = UserState.ALL_CAUGHT_UP;
  }

  // Calculate profile completion (mock - would be from profile data)
  const profileCompletion = 60; // Would come from actual profile data

  // ───────────────────────────────────────────────────────────────────────────
  // ADAPTIVE CONTENT BASED ON USER STATE
  // ───────────────────────────────────────────────────────────────────────────

  // Time-adaptive greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Primary CTA content
  const getPrimaryCTA = () => {
    switch (userState) {
      case UserState.ZERO_APPLICATIONS:
        return {
          heading: "Your next move",
          title: "Start your search",
          description: "Find roles aligned with your skills and goals.",
          cta: "Search roles",
          ctaLink: "/jobs",
          secondaryCta: "Import resume",
          secondaryLink: "/resumes",
        };
      case UserState.ACTIVE_APPLICATIONS:
        return {
          heading: "Keep momentum",
          title: `${appliedCount} application${
            appliedCount !== 1 ? "s" : ""
          } in progress`,
          description:
            "Responses typically arrive in 5–10 days. Send 2–3 more this week.",
          cta: "Find more roles",
          ctaLink: "/jobs",
          secondaryCta: "Track applications",
          secondaryLink: "/applications",
        };
      case UserState.IN_INTERVIEWS:
        return {
          heading: "Prepare to shine",
          title: `${interviewingCount} interview${
            interviewingCount !== 1 ? "s" : ""
          } scheduled`,
          description: "Practice your responses and research each company.",
          cta: "Practice interviews",
          ctaLink: getReadyUrl("/practice"),
          ctaIsExternal: true,
          secondaryCta: "View schedule",
          secondaryLink: "/applications",
        };
      default:
        return {
          heading: "Rest and reflect",
          title: "You're caught up",
          description: "Strengthen your profile or explore new opportunities.",
          cta: "Explore roles",
          ctaLink: "/jobs",
          secondaryCta: "Improve profile",
          secondaryLink: "/settings?section=profile",
        };
    }
  };

  // Today's Priority items
  const getTodaysPriorities = (): {
    icon: IconName;
    label: string;
    action: string;
    link: string;
    isExternal?: boolean;
  }[] => {
    const priorities: {
      icon: IconName;
      label: string;
      action: string;
      link: string;
      isExternal?: boolean;
    }[] = [];

    if (userState === UserState.ZERO_APPLICATIONS) {
      priorities.push({
        icon: "search",
        label: "Discover roles",
        action: "5 AI-curated picks",
        link: "/jobs",
      });
      priorities.push({
        icon: "scroll",
        label: "Resume check",
        action: "Quick optimization tips",
        link: "/resumes",
      });
    } else if (userState === UserState.ACTIVE_APPLICATIONS) {
      priorities.push({
        icon: "briefcase",
        label: "Follow up",
        action: `${appliedCount} pending responses`,
        link: "/applications",
      });
      priorities.push({
        icon: "microphone",
        label: "Stay sharp",
        action: "Practice top questions",
        link: getReadyUrl("/practice"),
        isExternal: true,
      });
    } else if (userState === UserState.IN_INTERVIEWS) {
      priorities.push({
        icon: "microphone",
        label: "Interview prep",
        action: "Review company research",
        link: getReadyUrl("/practice"),
        isExternal: true,
      });
      priorities.push({
        icon: "book",
        label: "Company intel",
        action: "Key talking points",
        link: "/jobs",
      });
    }

    // Always suggest profile improvement if not complete
    if (profileCompletion < 100) {
      priorities.push({
        icon: "stars",
        label: "Profile strength",
        action: `${profileCompletion}% → Improve`,
        link: "/settings?section=profile",
      });
    }

    return priorities.slice(0, 3);
  };

  // Foundation cards
  const getFoundationCards = (): {
    icon: IconName;
    title: string;
    description: string;
    cta: string;
    ctaLink: string;
    sublabel?: string;
  }[] => [
    {
      icon: "book",
      title: "Learn your market",
      description: "Understand industry trends and company needs.",
      cta: "Explore insights",
      ctaLink: "/jobs",
      sublabel: "Suggested for you",
    },
    {
      icon: "scroll",
      title: "Polish your resume",
      description: "Make sure your resume stands out to recruiters.",
      cta: "Build resume",
      ctaLink: "/resumes",
      sublabel:
        profileCompletion < 80
          ? `Resume strength: ${profileCompletion}/100`
          : "Looking good",
    },
  ];

  // Quick actions
  const getQuickActions = (): {
    icon: IconName;
    label: string;
    link: string;
    isExternal?: boolean;
  }[] => [
    { icon: "search", label: "Search saved filters", link: "/jobs" },
    { icon: "scroll", label: "Upload resume", link: "/resumes" },
    { icon: "microphone", label: "Mock interview", link: "/interview-prep" },
    {
      icon: "stars",
      label: "Not ready? Get prepared",
      link: getReadyUrl("/"),
      isExternal: true,
    },
  ];

  // Momentum message
  const getMomentumMessage = () => {
    if (discoveredCount > 0 && appliedCount === 0) {
      return `You explored ${discoveredCount} role${
        discoveredCount !== 1 ? "s" : ""
      } yesterday—ready to apply?`;
    }
    if (appliedCount > 0) {
      return `${appliedCount} application${
        appliedCount !== 1 ? "s" : ""
      } sent—keep the momentum going!`;
    }
    return null;
  };

  const primaryCTA = getPrimaryCTA();
  const todaysPriorities = getTodaysPriorities();
  const foundationCards = getFoundationCards();
  const quickActions = getQuickActions();
  const momentumMessage = getMomentumMessage();

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <PageLayout
      title={`Welcome, ${user.email?.split('@')[0] || 'Friend'}.`}
      subtitle={momentumMessage || "Your career records are up to date."}
      actions={
        <Button variant="primary" onClick={() => navigate(primaryCTA.ctaLink)}>
          {primaryCTA.cta}
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Primary Directive */}
          <section>
            <Card className="border-accent/20 bg-accent-glow/5">
              <header className="mb-6">
                <Text muted className="uppercase tracking-widest text-xs font-bold mb-1">{primaryCTA.heading}</Text>
                <Heading level={2}>{primaryCTA.title}</Heading>
              </header>
              <Text className="mb-8 max-w-xl italic">{primaryCTA.description}</Text>
              <div className="flex gap-4">
                <Button variant="primary" onClick={() => navigate(primaryCTA.ctaLink)}>
                  {primaryCTA.cta}
                </Button>
                <Button variant="secondary" onClick={() => navigate(primaryCTA.secondaryLink)}>
                  {primaryCTA.secondaryCta}
                </Button>
              </div>
            </Card>
          </section>

          {/* Priorities & Quick Actions */}
          <section className="space-y-6">
            <header className="flex items-baseline justify-between border-b border-border pb-2">
              <Heading level={4} className="uppercase tracking-wider text-text-muted">Next Steps</Heading>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {todaysPriorities.map((item, idx) => (
                <Card 
                  key={idx} 
                  className="p-4 flex flex-col justify-between group hover:border-text transition-colors"
                  onClick={() => item.isExternal ? window.open(item.link, '_blank') : navigate(item.link)}
                >
                  <div>
                    <Text className="font-bold mb-1 group-hover:underline underline-offset-4">{item.label}</Text>
                    <Text muted className="text-xs italic">{item.action}</Text>
                  </div>
                  <Icon name={item.icon} size="sm" className="mt-4 text-text-muted group-hover:text-text transition-colors" />
                </Card>
              ))}
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => action.isExternal ? window.open(action.link, '_blank') : navigate(action.link)}
                  className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-text-muted hover:text-text transition-colors"
                >
                  <Icon name={action.icon} size="xs" />
                  {action.label}
                  {action.isExternal && <Icon name="external-link" size="xs" className="opacity-40" />}
                </button>
              ))}
            </div>
          </section>

          {/* Strategic Insights */}
          <section className="space-y-6">
            <header className="flex items-baseline justify-between border-b border-border pb-2">
              <Heading level={4} className="uppercase tracking-wider text-text-muted">Strategic Analysis</Heading>
              {canGenerateReport && (
                <button
                  className="text-[10px] uppercase tracking-widest font-bold border-b border-text/20 hover:border-text transition-colors disabled:opacity-50"
                  onClick={async () => {
                    setGeneratingReport(true);
                    try {
                      await generateReport();
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setGeneratingReport(false);
                    }
                  }}
                  disabled={generatingReport}
                >
                  {generatingReport ? 'Generating...' : 'Refresh Report'}
                </button>
              )}
            </header>

            {insightsLoading ? (
              <Text muted className="py-12 text-center uppercase tracking-widest text-[10px] font-bold">Analysing application patterns...</Text>
            ) : canGenerateReport && latestReport ? (
              <StrategicPivotReport
                report={latestReport}
                onApplyRecommendation={async (recId) => {
                  await applyRecommendation(latestReport.id, recId);
                }}
                onDismissRecommendation={async (recId) => {
                  await dismissRecommendation(latestReport.id, recId);
                }}
              />
            ) : (
              <InsightsEmptyState
                currentCount={currentApplicationCount}
                requiredCount={minApplicationsRequired}
              />
            )}
          </section>

          {/* Foundation */}
          <section className="space-y-6">
            <header className="flex items-baseline justify-between border-b border-border pb-2">
              <Heading level={4} className="uppercase tracking-wider text-text-muted">Foundation</Heading>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {foundationCards.map((card, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="p-2 border border-border">
                      <Icon name={card.icon} size="md" />
                    </div>
                    <Heading level={3}>{card.title}</Heading>
                  </div>
                  <Text muted className="italic">{card.description}</Text>
                  <button
                    onClick={() => navigate(card.ctaLink)}
                    className="text-xs uppercase tracking-widest font-bold text-accent border-b border-accent/20 hover:border-accent transition-colors"
                  >
                    {card.cta} →
                  </button>
                  {card.sublabel && <Text className="text-[10px] uppercase tracking-widest text-text-muted">{card.sublabel}</Text>}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-12">
          {/* Progress Ledger */}
          <section className="space-y-6">
            <header className="border-b border-border pb-2">
              <Heading level={4} className="uppercase tracking-wider text-text-muted">Career Ledger</Heading>
            </header>
            <div className="space-y-1">
              {[
                { label: 'Discovered', count: discoveredCount, link: '/jobs' },
                { label: 'Applied', count: appliedCount, link: '/applications' },
                { label: 'Awaiting', count: appliedCount - interviewingCount, link: '/applications?status=awaiting' },
                { label: 'Interviews', count: interviewingCount, link: '/applications?status=interviewing' },
              ].map((stat, idx) => (
                <div 
                  key={idx}
                  onClick={() => navigate(stat.link)}
                  className="flex justify-between items-baseline py-2 border-b border-border/50 cursor-pointer group hover:bg-surface-2 px-2 -mx-2 transition-colors"
                >
                  <Text className="group-hover:font-medium transition-all">{stat.label}</Text>
                  <Heading level={3} className="text-text-muted group-hover:text-text">{stat.count}</Heading>
                </div>
              ))}
            </div>

            {/* Profile Integrity */}
            <div className="space-y-2 mt-8">
              <div className="flex justify-between items-baseline mb-4">
                <Text className="uppercase tracking-widest text-[10px] font-bold">Profile Integrity</Text>
                <Text className="font-bold font-mono">{profileCompletion}%</Text>
              </div>
              <div className="h-1 bg-border w-full">
                <div className="h-full bg-text transition-all duration-1000" style={{ width: `${profileCompletion}%` }} />
              </div>
              <button 
                onClick={() => navigate('/settings?section=profile')}
                className="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-text transition-colors"
              >
                Refine profile →
              </button>
            </div>
          </section>

          {/* Wellness Check */}
          {wellnessMode === "gentle" && (
            <section className="space-y-6">
              <header className="border-b border-border pb-2">
                <Heading level={4} className="uppercase tracking-wider text-text-muted">Observation</Heading>
              </header>
              <WellnessCheckin />
            </section>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
