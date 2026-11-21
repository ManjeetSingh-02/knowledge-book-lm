// internal-imports
import { inngest } from '@/core/index.js';
import { processSourceChannel } from '../channels/process-source.js';
import { chunkSource, fetchSource, indexSource, updateSource } from '../utils/source.js';

export const processSource = inngest.createFunction(
  {
    id: 'process-source',
    retries: 1,
    triggers: [{ event: 'source/process' }],
    onFailure: async ({ event }) => {
      // extract the soruce id
      const { id } = event.data.event.data;

      // create a channel
      const channel = processSourceChannel({ sourceId: id });

      // mark the source status as failed
      await updateSource(id, { status: 'FAILED' });

      // publish the source status as failed
      await inngest.realtime.publish(channel.status, { status: 'FAILED' });
    },
  },
  async ({ event, step }) => {
    // extract the soruce id
    const { id } = event.data;

    // step to fetch the source
    const source = await step.run('fetch-source', () => fetchSource(id));

    // create a channel
    const channel = processSourceChannel({ sourceId: source.id });

    // mark the source status as processing
    await step.run('mark-source-processing', () =>
      updateSource(source.id, { status: 'PROCESSING' })
    );

    // publish the source status as processing
    await step.realtime.publish('publish-source-processing', channel.status, {
      status: 'PROCESSING',
    });

    // chunk the source
    const chunks = await step.run('chunk-source', () => chunkSource(source));

    // index the source
    await step.run('index-source', () => indexSource(chunks, source.workspaceId, source.id));

    // mark the source status as ready
    await step.run('mark-source-ready', () => updateSource(source.id, { status: 'READY' }));

    // publish the source status as ready
    await step.realtime.publish('publish-source-ready', channel.status, {
      status: 'READY',
    });
  }
);
