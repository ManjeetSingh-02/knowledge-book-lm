// internal-imports
import { inngest } from '@/core/index.js';
import { generateConversationMessageChannel } from '../channels/generate-conversation-message.js';
import { getTextFromParts, OPENAI_CONFIG } from '../utils/config.js';
import {
  fetchConversation,
  saveAssistantMessageAndUpdateConversationStatus,
  updateConversation,
} from '../utils/conversation.js';
import { retrieveSources } from '../utils/source.js';

// external-imports
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, generateText, Output, streamText, validateUIMessages } from 'ai';
import z from 'zod';

export const generateConversationMessage = inngest.createFunction(
  {
    id: 'generate-conversation-message',
    retries: 1,
    triggers: [{ event: 'conversation/generate.message' }],
    onFailure: async ({ event }) => {
      // extract the conversation id
      const { id } = event.data.event.data;

      // create a channel
      const channel = generateConversationMessageChannel({ conversationId: id });

      // mark the generation status as failed
      await updateConversation(id, { generationStatus: 'FAILED' });

      // publish the generation status as failed
      await inngest.realtime.publish(channel.status, { status: 'FAILED' });
    },
  },
  async ({ event, step }) => {
    // extract the conversation id
    const { id } = event.data;

    // step to fetch the conversation
    const conversation = await step.run('fetch-conversation', () => fetchConversation(id));

    // create a channel
    const channel = generateConversationMessageChannel({ conversationId: conversation.id });

    // if the conversation has only one message
    if (conversation.messages.length === 1) {
      // generate the conversation title
      const title = await step.run('generate-conversation-title', async () => {
        const result = await generateText({
          model: openai(OPENAI_CONFIG.TITLE.model),
          instructions: OPENAI_CONFIG.TITLE.system_prompt,
          output: Output.object({
            schema: z.object({ title: z.string().trim().nonempty().max(30) }),
          }),
          prompt: getTextFromParts(conversation.messages[0]!.parts),
        });

        return result.output.title;
      });

      // update the conversation title
      await step.run('update-conversation-title', () =>
        updateConversation(conversation.id, { title })
      );

      // publish the title
      await step.realtime.publish('publish-conversation-title', channel.data, { title });
    }

    // retrieve the sources having relevant information
    const sources = await step.run('retrieve-relevant-sources', () =>
      retrieveSources(conversation.messages, conversation.workspaceId)
    );

    // validate the messages and convert them to model messages
    const vMessages = await validateUIMessages({ messages: conversation.messages });
    const modelMessages = await convertToModelMessages(vMessages);

    // generate and stream text
    const generatedText = await step.run('generate-and-stream-text', async () => {
      const result = streamText({
        model: openai(OPENAI_CONFIG.MESSAGE.model),
        instructions: OPENAI_CONFIG.MESSAGE.buildSystemPrompt(sources),
        messages: modelMessages,
      });

      let text = '';

      for await (const chunk of result.textStream) {
        text += chunk;

        await inngest.realtime.publish(channel.data, {
          message: {
            id: conversation.messages.at(-1)!.id,
            token: chunk,
          },
        });
      }

      return text;
    });

    // save the assistant message and update the conversation status
    await step.run('save-assistant-message', async () =>
      saveAssistantMessageAndUpdateConversationStatus(conversation.id, generatedText)
    );

    // publish the generation status as completed
    await step.realtime.publish('publish-generation-status-completed', channel.status, {
      status: 'COMPLETED',
    });
  }
);
