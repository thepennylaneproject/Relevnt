import React, { useState } from 'react';
import { useOptimizeResume } from '../hooks/useOptimizeResume';
import { useAnalyzeSkillsGap } from '../hooks/useAnalyzeSkillsGap';
import { useTheme } from '../contexts/useTheme';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-50">
      {children}
    </h2>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-4 shadow-sm">
      {children}
    </div>
  );
}

const textareaClass =
  'w-full min-h-[160px] rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-vertical';

export default function ResumeOptimizerPage(): JSX.Element {
  const { mode } = useTheme();
  const isDark = mode === 'Dark';

  const { optimize, loading: optimizing, error: optimizeError } = useOptimizeResume();
  const { analyze, loading: analyzing, error: gapError } = useAnalyzeSkillsGap();

  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [optimizedResume, setOptimizedResume] = useState('');

  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [skillRecommendations, setSkillRecommendations] = useState<string[]>([]);

  const [touched, setTouched] = useState(false);

  const isBusy = optimizing || analyzing;

  async function handleAnalyzeAndOptimize() {
    setTouched(true);
    if (!resumeText.trim() || !jobDescription.trim()) {
      return;
    }

    try {
      // Fire both tasks in sequence so we always get both result sets
      const [optResult, gapResult] = await Promise.all([
        optimize(resumeText, jobDescription),
        analyze(resumeText, jobDescription),
      ]);

      if (optResult && optResult.success && optResult.data) {
        setOptimizedResume(optResult.data.optimizedResume || resumeText);
        setAtsScore(optResult.data.atsScore ?? null);
        setImprovements(optResult.data.improvements || []);
      }

      if (gapResult && gapResult.success && gapResult.data) {
        setMissingSkills(gapResult.data.missingSkills || []);
        setSkillRecommendations(gapResult.data.recommendations || []);
      }
    } catch (err) {
      // Errors are already exposed via optimizeError / gapError
      // We keep this catch to avoid unhandled promise rejections.
      console.error('AI optimization error', err);
    }
  }

  function handleAdoptOptimized() {
    if (optimizedResume.trim()) {
      setResumeText(optimizedResume);
    }
  }

  const showValidation =
    touched && (!resumeText.trim() || !jobDescription.trim());

  return (
    <div
      className="min-h-screen px-4 py-8 flex justify-center"
      style={{
        backgroundColor: isDark ? '#020617' : '#f3f4f6',
      }}
    >
      <div className="w-full max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Resume Optimizer & Skills Gap
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            Paste your current resume and a job description. Relevnt will
            optimize your resume, surface missing skills, and suggest next steps
            so you can decide what to add, learn, or reframe in your own voice.
          </p>
        </div>

        {/* Inputs */}
        <div className="grid md:grid-cols-2 gap-6">
          <Panel>
            <SectionTitle>Your current resume</SectionTitle>
            <p className="text-xs text-slate-500 mb-2">
              Raw text works best. You can paste from a PDF, Word doc, or your
              favorite builder.
            </p>
            <textarea
              className={textareaClass}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume content here..."
            />
          </Panel>

          <Panel>
            <SectionTitle>Target job description</SectionTitle>
            <p className="text-xs text-slate-500 mb-2">
              Include responsibilities and qualifications. The more detail, the
              better the mapping.
            </p>
            <textarea
              className={textareaClass}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
            />
          </Panel>
        </div>

        {/* Validation + action */}
        {showValidation && (
          <div className="text-sm text-rose-600">
            Please paste both your resume and the job description before
            running the analysis.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAnalyzeAndOptimize}
            disabled={isBusy || !resumeText.trim() || !jobDescription.trim()}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white ${
              isBusy
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-sky-700 hover:bg-sky-800'
            } transition`}
          >
            {isBusy ? 'Analyzing…' : 'Analyze and optimize'}
          </button>

          {optimizedResume && optimizedResume !== resumeText && (
            <button
              type="button"
              onClick={handleAdoptOptimized}
              className="inline-flex items-center justify-center rounded-md px-3 py-2 text-xs font-medium text-sky-700 border border-sky-200 bg-sky-50 hover:bg-sky-100 transition"
            >
              Replace original with optimized version
            </button>
          )}

          {(optimizeError || gapError) && (
            <span className="text-xs text-rose-600">
              Something went wrong talking to the AI service. Try again in a
              bit.
            </span>
          )}
        </div>

        {/* Results grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Optimized resume panel */}
          <Panel>
            <SectionTitle>Optimized resume draft</SectionTitle>

            {!optimizedResume && !atsScore && (
              <p className="text-sm text-slate-500">
                Run an analysis to see an AI optimized version of your resume
                aligned to this job. You stay in control. This is a draft, not
                gospel.
              </p>
            )}

            {atsScore !== null && (
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Estimated ATS alignment
                </div>
                <div className="text-sm font-semibold text-sky-700">
                  {atsScore}%
                </div>
              </div>
            )}

            {improvements.length > 0 && (
              <ul className="mb-3 list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                {improvements.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            )}

            {optimizedResume && (
              <textarea
                className={textareaClass}
                value={optimizedResume}
                readOnly
              />
            )}
          </Panel>

          {/* Skills gap panel */}
          <Panel>
            <SectionTitle>Skills gap and next steps</SectionTitle>

            {!missingSkills.length && !skillRecommendations.length && (
              <p className="text-sm text-slate-500">
                After analysis, you will see missing skills, plus suggestions
                for how to close the gap using courses, projects, and story
                tweaks that still feel like you.
              </p>
            )}

            {missingSkills.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-1 text-slate-800 dark:text-slate-100">
                  Missing or underrepresented skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-900"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {skillRecommendations.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold mb-1 text-slate-800 dark:text-slate-100">
                  Suggested learning and positioning
                </h3>
                <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  {skillRecommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-slate-500 mt-2">
                  These can represent Coursera, edX, YouTube deep dives,
                  internal projects, or narrative tweaks. The goal is not to
                  fake it, but to chart a path from where you are to what this
                  role honestly needs.
                </p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}