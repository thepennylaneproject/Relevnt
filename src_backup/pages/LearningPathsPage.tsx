import { useState } from 'react';
import { useAnalyzeSkillsGap } from '../hooks/useAnalyzeSkillsGap';
import { useTheme } from '../contexts/useTheme';

export default function LearningPathsPage() {
  const { mode } = useTheme();
  const isDark = mode === 'Dark';

  const { analyze, loading } = useAnalyzeSkillsGap();

  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [recommendedCourses, setRecommendedCourses] = useState<string[]>([]);

  async function handleRecommend() {
    const result = await analyze(resumeText, jobDescription);

    if (result?.success && result.data) {
      const skills = result.data.missingSkills || [];

      const fakeCatalog = [
        {
          name: 'Coursera: Foundations of Project Management (FREE)',
          matches: ['project management', 'stakeholders', 'communication'],
        },
        {
          name: 'edX: Introduction to Data Analytics (FREE)',
          matches: ['analytics', 'data analysis', 'sql'],
        },
        {
          name: 'Google Career Certificates: IT Support',
          matches: ['it', 'troubleshooting', 'technical support'],
        },
        {
          name: 'Harvard Online — CS50 (FREE)',
          matches: ['python', 'programming', 'software'],
        },
      ];

      const courses = fakeCatalog.filter((course) =>
        course.matches.some((skill) =>
          skills.join(' ').toLowerCase().includes(skill.toLowerCase())
        )
      );

      setRecommendedCourses(courses.map((c) => c.name));
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
          Recommended Learning Paths
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
          Paste your resume and a job description. Relevnt identifies skill gaps and recommends free or accessible courses to help you level up.
        </p>

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
          onClick={handleRecommend}
          disabled={loading}
          className="px-4 py-2 rounded bg-sky-600 text-white hover:bg-sky-700"
        >
          {loading ? 'Analyzing…' : 'Get Learning Path Recommendations'}
        </button>

        {recommendedCourses.length > 0 && (
          <div className="space-y-3 mt-6">
            <h2 className="text-xl font-semibold">Recommended Courses</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-800 dark:text-slate-200">
              {recommendedCourses.map((course, i) => (
                <li key={i}>{course}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}