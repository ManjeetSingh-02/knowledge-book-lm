// internal-imports
import { embeddings, getIndex } from './config.js';

export async function retrieveSource(query: string, workspaceId: string) {
  const index = getIndex(workspaceId);
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
