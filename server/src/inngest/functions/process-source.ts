// internal-imports
import { inngest } from '@/core/index.js';
import { fetchSource, updateSource } from '@/modules/v1/workspaces/sources/repository.js';
import { processSourceChannel } from '../channels/process-source.js';

export const processSource = inngest.createFunction(
  {
    id: 'process-source',
    retries: 1,
    triggers: [{ event: 'source/process' }],
  },
  async ({ event, step }) => {
    // extract the soruce id
    const { id } = event.data;

    // step to fetch the source
    const source = await step.run('fetch-source', async () => fetchSource(id));

    // create a channel
    const channel = processSourceChannel({ sourceId: source.id });

    try {
      // mark the source as processing
      await step.run('mark-source-processing', () =>
        updateSource(source.id, { status: 'PROCESSING' })
      );

      // publish the source as processing
      await step.realtime.publish('publish-source-processing', channel.status, {
        status: 'PROCESSING',
      });

      // mark the source as ready
      await step.run('mark-source-ready', () => updateSource(source.id, { status: 'READY' }));

      // publish the source as ready
      await step.realtime.publish('publish-source-ready', channel.status, {
        status: 'READY',
      });
    } catch {
      // mark the source as failed
      await step.run('mark-source-failed', () => updateSource(source.id, { status: 'FAILED' }));

      // publish the source as failed
      await step.realtime.publish('publish-source-failed', channel.status, {
        status: 'FAILED',
      });
    }
  }
);
