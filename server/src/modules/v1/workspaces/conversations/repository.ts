// internal-imports
import { prisma, type Conversation } from '@/core/index.js';

// function to fetch conversation
export async function fetchConversation(id: Conversation['id']) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      workspaceId: true,
      messages: {
        select: {
          createdAt: true,
          parts: true,
          role: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });
  if (!conversation) throw new Error('Conversation not found');

  return conversation;
}

// function to update conversation
export async function updateConversation(
  id: Conversation['id'],
  data: Partial<Pick<Conversation, 'generationStatus' | 'title'>>
) {
  return prisma.conversation.update({
    where: { id },
    data,
  });
}
