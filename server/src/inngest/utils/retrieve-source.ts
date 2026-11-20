// internal-imports
import type { Message } from '@/core/index.js';
import { embeddings, getIndex, getTextFromParts } from './config.js';

type Messages = Pick<Message, 'role' | 'parts'>[];

async function getQuery(messages: Messages) {
  const message = messages.at(-1);
  if (!message || message.role !== 'USER' || !Array.isArray(message.parts))
    throw new Error('Invalid message');

  const query = getTextFromParts(message.parts);
  if (!query) throw new Error('Message contains no text');

  return query;
}

export async function retrieveSources(messages: Messages, workspaceId: string) {
  const index = getIndex(workspaceId);
  const query = await getQuery(messages);
  const vector = await embeddings.embedQuery(query);
  const response = await index.query({
    vector,
    topK: 5,
    includeMetadata: true,
  });

  return (response.matches ?? [])
    .map(match => ({
      metadata: {
        sourceId: match.metadata?.sourceId,
        chunkIndex: match.metadata?.chunkIndex,
      },
      pageContent: match.metadata?.content ?? '',
      score: match.score,
    }))
    .filter(doc => doc.pageContent.toString().trim().length > 0);
}
