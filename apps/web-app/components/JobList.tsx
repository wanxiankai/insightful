// apps/web-app/components/JobList.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Job {
  id: string;
  fileName: string | null;
  fileUrl: string | null;
  status: string;
  createdAt: string;
}

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/jobs');
        
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        
        const data = await response.json();
        setJobs(data.jobs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) {
    return <div>Loading jobs...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (jobs.length === 0) {
    return <div>No jobs found. Upload a file to get started.</div>;
  }

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Your Jobs</h2>
      
      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{job.fileName || 'Unnamed file'}</h3>
                <p className="text-sm text-gray-500">
                  Uploaded on {new Date(job.createdAt).toLocaleDateString()}
                </p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                  job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                  job.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                  job.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {job.status}
                </span>
              </div>
              
              <div className="flex space-x-2">
                {job.fileUrl && (
                  <Button
                    onClick={() => window.open(job.fileUrl as string, '_blank')}
                  >
                    View File
                  </Button>
                )}
                
                <Button
                  onClick={() => {
                    // Navigate to job details page
                    window.location.href = `/jobs/${job.id}`;
                  }}
                >
                  Details
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
