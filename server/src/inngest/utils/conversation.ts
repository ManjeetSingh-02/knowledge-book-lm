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
          id: true,
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
  data: Partial<Pick<Conversation, 'status' | 'title'>>
) {
  return prisma.conversation.update({
    where: { id },
    data,
  });
}

export async function saveAssistantMessageAndUpdateConversationStatus(
  id: Conversation['id'],
  text: string
) {
  return await prisma.$transaction(async tx => {
    await tx.message.create({
      data: {
        role: 'ASSISTANT',
        conversationId: id,
        parts: [{ type: 'text', text }],
      },
    });

    await tx.conversation.update({
      where: { id },
      data: { status: 'READY' },
    });
  });
}
