import React from 'react';
import { Clock, MessageSquare, ShieldCheck, TrendingUp } from 'lucide-react';

const activities = [
    {
        id: '1',
        type: 'practice',
        title: 'Interview Practice',
        description: 'Completed "Behavioral Basics" session',
        time: '2 hours ago',
        icon: <MessageSquare className="w-5 h-5 text-primary" />,
    },
    {
        id: '2',
        type: 'assessment',
        title: 'LinkedIn Analysis',
        description: 'Profile score improved by 12 points',
        time: 'Yesterday',
        icon: <TrendingUp className="w-5 h-5 text-ready" />,
    },
    {
        id: '3',
        type: 'certification',
        title: 'Skill Verified',
        description: 'Passed "System Design" assessment',
        time: '3 days ago',
        icon: <ShieldCheck className="w-5 h-5 text-success" />,
    },
];

export const RecentActivity: React.FC = () => {
    return (
        <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold">Recent Activity</h3>
                <button className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">
                    View History
                </button>
            </div>
            
            <div className="space-y-6">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center shrink-0 border border-border-light">
                            {activity.icon}
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-ink leading-none">{activity.title}</h4>
                            <p className="text- ink-secondary text-sm">{activity.description}</p>
                            <div className="flex items-center gap-1 text-ink-tertiary text-xs mt-2">
                                <Clock className="w-3 h-3" />
                                {activity.time}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
