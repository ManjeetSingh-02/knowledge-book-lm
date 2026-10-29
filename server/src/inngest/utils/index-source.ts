// internal-imports
import { env } from '@/core/index.js';

// external-imports
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { createHash } from 'crypto';

const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' });
const pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY });
const UPSERT_BATCH_SIZE = 100;

function getIndex(workspaceId: string) {
  return pinecone.index({ name: env.PINECONE_INDEX_NAME }).namespace(workspaceId);
}

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
