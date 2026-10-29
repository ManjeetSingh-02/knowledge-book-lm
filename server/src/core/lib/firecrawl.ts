// internal-imports
import { env } from '../config/env.js';

// external-imports
import { Firecrawl } from 'firecrawl';

const client = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });

export async function scrapeWebsite(url: string) {
  const result = await client.scrape(url, { formats: ['markdown'] });
  if (!result.markdown?.trim()) throw new Error('No content found in the scraped result.');

  return result;
}
