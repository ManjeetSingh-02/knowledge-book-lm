// internal-imports
import { env } from '@/core/index.js';

// external-imports
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';

export const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' });
const pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY });

export function getIndex(workspaceId: string) {
  return pinecone.index({ name: env.PINECONE_INDEX_NAME }).namespace(workspaceId);
}
