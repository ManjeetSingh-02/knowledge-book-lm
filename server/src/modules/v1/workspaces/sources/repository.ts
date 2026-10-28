// internal-imports
import { prisma, type Source } from '@/core/index.js';

// function to fetch source
export async function fetchSource(id: Source['id']) {
  const source = await prisma.source.findUnique({
    where: { id },
    select: { id: true, prompt: true, userId: true },
  });
  if (!source) throw new Error('Source not found');

  return source;
}

// function to update source
export async function updateSource(
  id: Source['id'],
  data: Partial<Pick<Source, 'content' | 'status' | 'title'>>
) {
  return prisma.source.update({
    where: { id },
    data,
  });
}
