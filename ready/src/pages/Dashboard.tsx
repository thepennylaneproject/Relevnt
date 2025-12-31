import React from 'react';
import { Hero } from '../components/Dashboard/Hero';
import { ReadinessScore } from '../components/Dashboard/ReadinessScore';
import { QuickStats } from '../components/Dashboard/QuickStats';
import { RecommendedAction } from '../components/Dashboard/RecommendedAction';
import { RecentActivity } from '../components/Dashboard/RecentActivity';

/**
 * DASHBOARD PAGE
 * 
 * The main landing page for authenticated users.
 * Provides a high-level overview of interview readiness.
 */
const Dashboard: React.FC = () => {
    return (
        <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
            {/* Hero Section */}
            <Hero />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    <RecommendedAction />
                    <RecentActivity />
                </div>

                {/* Sidebar Area */}
                <div className="space-y-8">
                    <ReadinessScore score={78} />
                    <QuickStats />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
