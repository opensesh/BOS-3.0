import { getAnthropicClient } from '@/lib/ai/providers';

export const maxDuration = 30;

/**
 * POST /api/summarize-thinking
 * 
 * Generates a short summary of thinking/reasoning content.
 * Used by ThinkingBubble to show a concise description when collapsed.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { thinking } = body as { thinking: string };

    if (!thinking || thinking.length < 20) {
      return new Response(
        JSON.stringify({ summary: 'Analyzed the request' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = await getAnthropicClient();

    // Use Claude Haiku for fast, cheap summarization
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 100,
      system: `You are a concise summarizer. Generate a very short (5-10 words max) summary of what the AI was thinking about. The summary should:
- Start with an action verb (e.g., "Analyzed", "Synthesized", "Evaluated", "Considered")
- Be specific to the content
- Not include phrases like "I thought about" or "The AI considered"
- Sound natural as a label for a collapsible section

Examples:
- "Analyzed user requirements for dashboard design"
- "Synthesized research findings on brand identity"
- "Evaluated technical approaches for streaming UI"
- "Considered accessibility implications for modal"`,
      messages: [
        {
          role: 'user',
          content: `Summarize this thinking in 5-10 words:\n\n${thinking.slice(0, 2000)}`,
        },
      ],
    });

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === 'text');
    const summary = textBlock && 'text' in textBlock ? textBlock.text.trim() : 'Analyzed the request';

    return new Response(
      JSON.stringify({ summary }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error summarizing thinking:', error);
    
    // Return a fallback summary on error
    return new Response(
      JSON.stringify({ summary: 'Analyzed the request' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

