import React from 'react';
import { StatCard } from '../ui/StatCard';
import { Target, CheckCircle, Zap } from 'lucide-react';

export const QuickStats: React.FC = () => {
    return (
        <div className="grid grid-cols-1 gap-4">
            <StatCard 
                label="Practice Sessions" 
                value="12" 
                icon={<Target className="w-5 h-5" />} 
            />
            <StatCard 
                label="Assessments" 
                value="4" 
                icon={<Zap className="w-5 h-5" />} 
            />
            <StatCard 
                label="Gaps Closed" 
                value="5" 
                icon={<CheckCircle className="w-5 h-5 text-success" />} 
            />
        </div>
    );
};
