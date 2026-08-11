export interface BackgroundJob {
  id: string;
  type: 'OCR_PARSE' | 'PRICE_REFRESH' | 'WARRANTY_CHECK' | 'METRIC_AGGREGATION';
  payload: any;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
}

const jobQueue: BackgroundJob[] = [];

export async function enqueueBackgroundJob(type: BackgroundJob['type'], payload: any): Promise<BackgroundJob> {
  const job: BackgroundJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type,
    payload,
    status: 'PENDING',
    createdAt: new Date(),
  };

  jobQueue.push(job);
  console.log(`[JobQueue] Enqueued background job ${job.id} (${type})`);

  // Execute synchronously in local dev / background async mock
  setTimeout(() => processBackgroundJob(job), 100);

  return job;
}

async function processBackgroundJob(job: BackgroundJob) {
  job.status = 'PROCESSING';
  try {
    if (job.type === 'WARRANTY_CHECK') {
      console.log(`[JobQueue] Executed warranty check job for household:`, job.payload?.householdId);
    }
    job.status = 'COMPLETED';
  } catch (err) {
    job.status = 'FAILED';
    console.error(`[JobQueue] Job ${job.id} failed:`, err);
  }
}

export function getPendingJobsCount(): number {
  return jobQueue.filter((j) => j.status === 'PENDING' || j.status === 'PROCESSING').length;
}
