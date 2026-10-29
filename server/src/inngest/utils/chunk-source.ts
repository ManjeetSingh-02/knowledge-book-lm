// internal-imports
import { getSignedCloudinaryDownloadUrl, scrapeWebsite, type Source } from '@/core/index.js';
import { updateSource } from '@/modules/v1/workspaces/sources/repository.js';

// external-imports
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PDFParse } from 'pdf-parse';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

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

export async function chunkSource(source: Partial<Source>) {
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
