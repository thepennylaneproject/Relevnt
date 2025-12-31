/**
 * ONBOARDING PAGE - Ready App
 * A 2-step onboarding wizard for new users.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { Icon } from '../components/ui/Icon';

const GOAL_OPTIONS = [
  "Land my first job",
  "Level up in my career",
  "Change careers",
  "Return to work",
  "Ace my upcoming interview"
];

const FOCUS_OPTIONS = [
  "Interviewing",
  "Knowing my gaps",
  "Building confidence",
  "Negotiating offers",
  "Telling my story"
];

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [goal, setGoal] = useState<string | null>(null);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  const handleFocusToggle = (option: string) => {
    setFocusAreas(prev => 
      prev.includes(option) 
        ? prev.filter(a => a !== option) 
        : [...prev, option]
    );
  };

  const handleComplete = async () => {
    if (!user) {
        showToast("No active user session found.", "error");
        return;
    }
    
    setLoading(true);
    try {
      // Use upsert to create or update the profile
      const { error } = await supabase
        .from('ready_profiles')
        .upsert({
          id: user.id,
          goal,
          focus_areas: focusAreas,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Refresh the profile in AuthContext so OnboardingGate knows it's done
      await refreshProfile();
      
      showToast("Onboarding complete! Welcome to Ready.", "success");
      navigate('/');
    } catch (err) {
      console.error('Onboarding failed:', err);
      showToast("Failed to save onboarding data.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <Card className="max-w-md w-full p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="zap" size="md" className="text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text">Welcome to Ready</h1>
          <p className="text-text-secondary mt-2">Let's personalize your experience.</p>
          <div className="flex justify-center gap-2 mt-4">
            <div className={`h-1.5 w-8 rounded-full ${step === 1 ? 'bg-primary' : 'bg-border'}`} />
            <div className={`h-1.5 w-8 rounded-full ${step === 2 ? 'bg-primary' : 'bg-border'}`} />
          </div>
        </div>

        {step === 1 ? (
          <div className="step-content animate-in fade-in duration-300">
            <h2 className="text-xl font-semibold mb-6">What's your goal?</h2>
            <div className="flex flex-col gap-3">
              {GOAL_OPTIONS.map(opt => (
                <button
                  key={opt}
                  className={`p-4 rounded-lg border-2 text-left transition-all cursor-pointer ${
                    goal === opt 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border hover:border-primary/50 text-text-secondary'
                  }`}
                  onClick={() => setGoal(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <Button 
                onClick={() => setStep(2)} 
                disabled={!goal}
                variant="primary"
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="step-content animate-in fade-in duration-300">
            <h2 className="text-xl font-semibold mb-6">Where do you need help?</h2>
            <div className="grid grid-cols-1 gap-3">
              {FOCUS_OPTIONS.map(opt => (
                <button
                  key={opt}
                  className={`p-4 rounded-lg border-2 text-left transition-all cursor-pointer ${
                    focusAreas.includes(opt) 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border hover:border-primary/50 text-text-secondary'
                  }`}
                  onClick={() => handleFocusToggle(opt)}
                >
                  <div className="flex items-center justify-between">
                    <span>{opt}</span>
                    {focusAreas.includes(opt) && (
                      <div className="text-primary">
                        <Icon name="check" size="sm" hideAccent />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-between gap-4">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button 
                onClick={handleComplete} 
                loading={loading}
                disabled={focusAreas.length === 0}
              >
                Complete
              </Button>
            </div>
          </div>
        )}
      </Card>

      <style>{`
        .onboarding-page {
          background-image: radial-gradient(circle at 50% 50%, rgba(78, 128, 141, 0.05) 0%, transparent 100%);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
