import React from 'react';
import { Button } from '../ui/Button';
import { Play } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const RecommendedAction: React.FC = () => {
    const { profile } = useAuth();
    
    // Default values
    let title = 'Sharpen your "Conflict Resolution" answer';
    let subtitle = 'Your recent practice session flagged this as a weak point in behavioral interviews.';
    let actionText = 'Start Focused Practice';
    
    if (profile?.goal) {
        if (profile.goal === 'Ace my upcoming interview') {
            title = 'Prepare for your specific interview';
            subtitle = 'Set up a targeted practice session for your upcoming role and company.';
        } else if (profile.goal === 'Land my first job') {
            title = 'Build your foundational pitch';
            subtitle = 'Let\'s start by crafting a compelling "Tell me about yourself" narrative.';
        } else if (profile.goal === 'Change careers') {
            title = 'Bridge your skill gaps';
            subtitle = 'Identify which of your transferable skills need sharpening for your new path.';
            actionText = 'Analyze Gaps';
        }
        
        // Refine with focus areas
        if (profile.focus_areas?.includes('Negotiating offers')) {
            title = 'Market Value Check';
            subtitle = 'Review current market salary data to prepare for your next offer negotiation.';
            actionText = 'Check Market Data';
        } else if (profile.focus_areas?.includes('Building confidence')) {
            title = 'Low-Stakes Practice';
            subtitle = 'Try a 5-minute "warm-up" session to get comfortable with AI feedback.';
            actionText = 'Start Warm-up';
        }
    }

    return (
        <div className="bg-primary/5 border border-primary/10 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
                <span className="text-primary font-bold text-sm tracking-wider uppercase">Next Priority</span>
                <h2 className="text-2xl font-bold">{title}</h2>
                <p className="text-ink-secondary">{subtitle}</p>
            </div>
            <Button size="lg" className="shrink-0 group">
                {actionText}
                <Play className="ml-2 w-4 h-4" />
            </Button>
        </div>
    );
};
