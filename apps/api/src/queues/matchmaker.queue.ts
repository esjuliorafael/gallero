import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

export interface MatchmakerJobData {
  betOrderId: string;
  fightId:    string;
  side:       'RED' | 'GREEN';
  amountStaked:      string;
  targetWinAmount:   string;
}

let matchmakerQueue: Queue<MatchmakerJobData> | null = null;

export const getMatchmakerQueue = (connection: Redis) => {
  if (!matchmakerQueue) {
    matchmakerQueue = new Queue<MatchmakerJobData>('matchmaker', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return matchmakerQueue;
};