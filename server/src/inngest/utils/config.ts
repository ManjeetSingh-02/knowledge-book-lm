// internal-imports
import { env, type Message } from '@/core/index.js';

// external-imports
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';

export const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' });
const pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY });

export function getIndex(workspaceId: string) {
  return pinecone.index({ name: env.PINECONE_INDEX_NAME }).namespace(workspaceId);
}

export function getTextFromParts(parts: Message['parts']): string {
  return (Array.isArray(parts) ? parts : [])
    .filter(
      (p): p is { type: string; text: string } =>
        typeof p === 'object' &&
        p !== null &&
        'type' in p &&
        p.type === 'text' &&
        'text' in p &&
        typeof p.text === 'string'
    )
    .map(p => p.text)
    .join('\n')
    .trim();
}
