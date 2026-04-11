import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const matchmakerWorker = new Worker(
  'matchmaker',
  async (job: Job) => {
    // TODO: Implementar algoritmo de emparejamiento
    console.log(`Processing job ${job.id} from matchmaker queue`);
  },
  { connection }
);

matchmakerWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

matchmakerWorker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
});
