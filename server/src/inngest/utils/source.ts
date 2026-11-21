// internal-imports
import {
  getSignedCloudinaryDownloadUrl,
  prisma,
  scrapeWebsite,
  type Message,
  type Source,
} from '@/core/index.js';
import { embeddings, getIndex, getTextFromParts } from './config.js';

// external-imports
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { createHash } from 'crypto';
import { PDFParse } from 'pdf-parse';

// function to fetch source
export async function fetchSource(id: Source['id']) {
  const source = await prisma.source.findUnique({
    where: { id },
    select: {
      id: true,
      workspaceId: true,
      cloudinaryPublicId: true,
      content: true,
      url: true,
      type: true,
    },
  });
  if (!source) throw new Error('Source not found');

  return source;
}

// function to update source
export async function updateSource(
  id: Source['id'],
  data: Partial<Pick<Source, 'content' | 'status'>>
) {
  return prisma.source.update({
    where: { id },
    data,
  });
}

// function to chunk source
export async function chunkSource(source: Partial<Source>) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const content = await extractContentFromSource(source);
  if (typeof content === 'string') return splitter.splitText(content);

  const parser = new PDFParse({ data: content });

  try {
    const result = await parser.getText();
    if (!result.text.trim()) throw new Error('Failed to extract text from the PDF.');

    return splitter.splitText(result.text.trim());
  } finally {
    await parser.destroy();
  }
}

// function to index source
export async function indexSource(chunks: string[], workspaceId: string, sourceId: string) {
  const UPSERT_BATCH_SIZE = 100;
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

// function to retrieve sources
export async function retrieveSources(
  messages: Pick<Message, 'role' | 'parts'>[],
  workspaceId: string
) {
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

// function to extract content from source
async function extractContentFromSource(source: Partial<Source>): Promise<string | Buffer> {
  if (source.type === 'TEXT') {
    if (!source.content?.trim()) throw new Error('Source content is empty.');

    return source.content.trim();
  } else if (source.type === 'WEBSITE') {
    const { markdown } = await scrapeWebsite(source.url!);
    if (!markdown?.trim()) throw new Error('Failed to scrape the website.');

    await updateSource(source.id!, { content: markdown.trim() });

    return markdown.trim();
  } else {
    const url = getSignedCloudinaryDownloadUrl(source.cloudinaryPublicId!);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch the source.');

    return Buffer.from(await response.arrayBuffer());
  }
}

// function to get query from messages
async function getQuery(messages: Pick<Message, 'role' | 'parts'>[]) {
  const message = messages.at(-1);
  if (!message || message.role !== 'USER' || !Array.isArray(message.parts))
    throw new Error('Invalid message');

  const query = getTextFromParts(message.parts);
  if (!query) throw new Error('Message contains no text');

  return query;
}
