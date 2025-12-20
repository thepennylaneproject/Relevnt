import { useState } from 'react';
import { useAnalyzeSkillsGap } from '../hooks/useAnalyzeSkillsGap';
import { useTheme } from '../contexts/useTheme';

export default function SkillsGapPage() {
  const { mode } = useTheme();
  const isDark = mode === 'Dark';

  const { analyze, loading, error } = useAnalyzeSkillsGap();

  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  async function handleAnalyze() {
    const result = await analyze(resumeText, jobDescription);
    if (result?.success && result.data) {
      setMissingSkills(result.data.missingSkills || []);
      setRecommendations(result.data.recommendations || []);
    }
  }

  return (
    <div
      className="min-h-screen px-4 py-8 flex justify-center"
      style={{
        backgroundColor: isDark ? '#020617' : '#f3f4f6',
      }}
    >
      <div className="w-full max-w-5xl space-y-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Skills Gap Analyzer
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <textarea
            className="w-full h-48 p-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            placeholder="Paste your resume here..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
          <textarea
            className="w-full h-48 p-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="px-4 py-2 rounded bg-sky-600 text-white hover:bg-sky-700"
        >
          {loading ? 'Analyzing…' : 'Analyze Skills Gap'}
        </button>

        {error && (
          <p className="text-red-600 text-sm mt-2">Something went wrong.</p>
        )}

        {missingSkills.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Missing Skills</h2>
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>

            <h2 className="text-xl font-semibold mt-6">Recommendations</h2>
            <ul className="list-disc list-inside text-sm space-y-1">
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}