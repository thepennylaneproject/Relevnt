import { useState } from 'react';
import { usePrepareInterview } from '../hooks/usePrepareInterview';
import { useTheme } from '../contexts/useTheme';

const textareaClass =
  'w-full min-h-[120px] rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-vertical';

export default function ApplicationQuestionsHelper(): JSX.Element {
  const { mode } = useTheme();
  const isDark = mode === 'Dark';
  const { prepare, loading, error } = usePrepareInterview();

  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [resumeContent, setResumeContent] = useState('');

  const [questions, setQuestions] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  const [touched, setTouched] = useState(false);

  async function handleGenerate() {
    setTouched(true);
    if (!jobTitle.trim() || !company.trim() || !resumeContent.trim()) {
      return;
    }

    try {
      const result = await prepare(jobTitle, company, resumeContent);

      if (result && result.success && result.data) {
        // data: { questions: string[]; tips: string[]; commonAnswers: Record<string, string> }
        setQuestions(result.data.questions || []);
        setTips(result.data.tips || []);

        // [Inference] Use the keys of commonAnswers as “focus areas” to drill into
        const commonAnswers = result.data.commonAnswers || {};
        setFocusAreas(Object.keys(commonAnswers));
      }
    } catch (err) {
      console.error('Application helper error', err);
    }
  }

  const showValidation =
    touched &&
    (!jobTitle.trim() || !company.trim() || !resumeContent.trim());

  return (
    <div
      className="min-h-screen px-4 py-8 flex justify-center"
      style={{ backgroundColor: isDark ? '#020617' : '#f3f4f6' }}
    >
      <div className="w-full max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Application Questions Helper
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Use your resume and the role you are applying for to generate
            practice questions and talking points you can reuse in written
            applications and interviews.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
              Job title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="Senior Marketing Manager"
            />

            <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="Relevnt"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
              Resume snapshot or highlights
            </label>
            <textarea
              className={textareaClass}
              value={resumeContent}
              onChange={(e) => setResumeContent(e.target.value)}
              placeholder="Paste the most relevant parts of your resume or a summary here..."
            />
          </div>
        </div>

        {showValidation && (
          <div className="text-xs text-rose-600">
            Fill in job title, company, and a resume snapshot before generating.
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white ${loading
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-sky-700 hover:bg-sky-800'
              } transition`}
          >
            {loading ? 'Generating…' : 'Generate questions and prompts'}
          </button>

          {error && (
            <span className="text-xs text-rose-600">
              There was a problem talking to the AI service. Try again later.
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Suggested questions
            </h2>
            {questions.length === 0 ? (
              <p className="text-xs text-slate-500">
                Questions will appear here once generated. You can reuse them
                for written applications and interviews.
              </p>
            ) : (
              <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-200 space-y-1">
                {questions.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            {tips.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
                  Answering tips
                </h2>
                <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-200 space-y-1">
                  {tips.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {focusAreas.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
                  Focus areas to highlight
                </h2>
                <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-200 space-y-1">
                  {focusAreas.map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-slate-500 mt-1">
                  These usually map to themes the system thinks you should
                  emphasize or answer consistently.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}