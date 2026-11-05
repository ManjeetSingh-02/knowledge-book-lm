// internal-imports
import { embeddings, getIndex } from './config.js';

// external-imports
import { createHash } from 'crypto';

const UPSERT_BATCH_SIZE = 100;

export async function indexSource(chunks: string[], workspaceId: string, sourceId: string) {
  const index = getIndex(workspaceId);
  const vectors = await embeddings.embedDocuments(chunks);
  const documents = chunks.map((content, chunkIndex) => ({
    _id: createHash('sha256').update(`${sourceId}:${chunkIndex}`).digest('hex'),
    values: vectors[chunkIndex],
    content,
    chunkIndex,
    sourceId,
  }));

  for (let i = 0; i < documents.length; i += UPSERT_BATCH_SIZE) {
    await index.documents.upsert({ documents: documents.slice(i, i + UPSERT_BATCH_SIZE) });
  }
}
