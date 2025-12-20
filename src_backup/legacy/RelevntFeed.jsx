// pages/RelevntFeed.jsx - Key sections

import React, { useState, useEffect } from 'react';
import { fetchJobs, rankJobs } from '@/api/jobs';
import { deduplicateJobs, createJobDedupKey } from '@/utils/dedup';

export default function RelevntFeed() {
  const [jobs, setJobs] = useState([]);
  const [dedupStats, setDedupStats] = useState({ total: 0, hidden: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAndRankJobs();
  }, []);

  const loadAndRankJobs = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch from multiple sources
      const allJobs = await Promise.all([
        fetchFromRemoteOK(),
        fetchFromRemotive(),
        fetchFromWeWorkRemotely(),
      ]).then(results => results.flat());

      // 2. Deduplicate
      const seen = new Set();
      const uniqueJobs = [];
      let hidden = 0;

      for (const job of allJobs) {
        const dedupKey = createJobDedupKey(job);
        if (!seen.has(dedupKey)) {
          seen.add(dedupKey);
          uniqueJobs.push(job);
        } else {
          hidden++;
        }
      }

      // 3. Rank each job
      const rankedJobs = await rankJobs(uniqueJobs);

      // 4. Sort by score
      rankedJobs.sort((a, b) => b.rankingScore - a.rankingScore);

      setJobs(rankedJobs);
      setDedupStats({
        total: allJobs.length,
        hidden,
      });
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dedup indicator */}
      {dedupStats.hidden > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-900">
            Filtered {dedupStats.hidden} duplicate listings
          </span>
        </div>
      )}

      {/* Job list */}
      <div className="space-y-3">
        {jobs.map(job => (
          <JobCard
            key={job.id}
            job={job}
            onViewDetails={() => navigateToJobDetail(job.id)}
          />
        ))}
      </div>
    </div>
  );
}

function JobCard({ job, onViewDetails }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{job.title}</h3>
          <p className="text-sm text-gray-600">{job.company}</p>
        </div>
        {/* Ranking score badge */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {job.rankingScore}
            </div>
            <div className="text-xs text-gray-500">match</div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex gap-2 mt-3 text-sm text-gray-600">
        <span>{job.location}</span>
        <span>•</span>
        <span>{job.remote}</span>
        <span>•</span>
        <span>{job.yearsRequired} yrs</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onViewDetails}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          View Details
        </button>
        <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
          Save
        </button>
      </div>
    </div>
  );
}