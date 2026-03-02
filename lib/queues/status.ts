import { resumeQueue, fitScoreQueue, optimiserQueue } from "./index";

export async function getQueueHealth() {
  const queues = [
    { name: "resume", queue: resumeQueue },
    { name: "fit-score", queue: fitScoreQueue },
    { name: "optimiser", queue: optimiserQueue },
  ];

  const health = await Promise.all(
    queues.map(async ({ name, queue }) => {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);
      return { name, waiting, active, completed, failed };
    })
  );

  return health;
}
