import { getAnthropicClient } from '@/lib/ai/providers';

export const maxDuration = 30;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json() as { messages: Message[] };

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = await getAnthropicClient();

    // Build a prompt for title generation
    // Take up to the first 2 user messages and their responses for context
    const relevantMessages = messages.slice(0, 4);
    const conversationContext = relevantMessages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 500)}`)
      .join('\n\n');

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022', // Use fast, cheap model for titles
      max_tokens: 50,
      system: `You are a conversation title generator. Generate a SHORT, descriptive title (3-6 words) that captures the semantic meaning of what the conversation is about. 

Rules:
- Focus on the TOPIC being discussed, not the exact question
- Be concise: 3-6 words maximum
- Don't use quotes or punctuation
- Don't start with "How to" or similar phrases
- Make it descriptive and specific
- If multiple topics, focus on the first/main topic

Examples:
- "What's new with Cursor?" → "Cursor IDE Updates"
- "Help me write a blog post about AI" → "AI Blog Post Writing"
- "Can you explain React hooks?" → "React Hooks Explained"
- "What's the weather like in NYC?" → "NYC Weather Query"`,
      messages: [
        {
          role: 'user',
          content: `Generate a short title for this conversation:\n\n${conversationContext}`,
        },
      ],
    });

    // Extract the title from the response
    const titleBlock = response.content.find(block => block.type === 'text');
    const title = titleBlock && 'text' in titleBlock ? titleBlock.text.trim() : 'New Conversation';

    // Clean up the title (remove quotes if present)
    const cleanTitle = title.replace(/^["']|["']$/g, '').slice(0, 60);

    return new Response(JSON.stringify({ title: cleanTitle }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating title:', error);
    
    // Return a fallback title on error
    return new Response(JSON.stringify({ title: 'New Conversation' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

