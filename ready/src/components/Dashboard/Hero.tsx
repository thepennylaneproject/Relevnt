import React from 'react';

export const Hero: React.FC = () => {
    return (
        <section className="bg-gradient-to-r from-primary/10 to-transparent p-8 rounded-2xl border border-primary/20">
            <h1 className="text-4xl md:text-5xl font-bold text-ink">How ready are you?</h1>
            <p className="mt-4 text-xl text-ink-secondary max-w-2xl">
                Ready tracks your interview performance, identifies skill gaps, and guides you toward career mastery.
            </p>
        </section>
    );
};
