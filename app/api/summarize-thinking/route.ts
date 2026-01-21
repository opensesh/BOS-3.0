import { getAnthropicClient } from '@/lib/ai/providers';

export const maxDuration = 30;

/**
 * POST /api/summarize-thinking
 * 
 * Generates a rich summary of thinking/reasoning content.
 * Captures the key reasoning journey, not just a generic label.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { thinking } = body as { thinking: string };

    if (!thinking || thinking.length < 20) {
      return new Response(
        JSON.stringify({ summary: 'Quick analysis' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = await getAnthropicClient();

    // Use Claude Sonnet for quality summarization
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      system: `You summarize AI reasoning into a brief, insightful phrase that captures what was actually considered—not generic labels.

RULES:
- 8-15 words max
- Capture the SPECIFIC reasoning, not just "analyzed the request"
- Include key considerations, trade-offs, or conclusions when possible
- Start with what was examined, weighed, or decided
- Sound like a thoughtful colleague describing their thought process
- NO quotes, NO periods at the end

GOOD examples (specific, insightful):
- "Weighed brand voice consistency against casual tone for general questions"
- "Considered web search relevance—decided direct answer better serves user"
- "Evaluated typography guidelines and font pairing for headline hierarchy"
- "Balanced technical accuracy with accessible explanation for design terms"
- "Assessed whether question needs brand context or general knowledge"

BAD examples (generic, vague):
- "Analyzed the user's question" (too generic)
- "Thought about the response" (says nothing)
- "Considered various factors" (meaningless)
- "Processed the request" (robotic)`,
      messages: [
        {
          role: 'user',
          content: `Summarize what was reasoned through here (8-15 words, specific and insightful):\n\n${thinking.slice(0, 3000)}`,
        },
      ],
    });

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === 'text');
    let summary = textBlock && 'text' in textBlock ? textBlock.text.trim() : 'Weighed context and crafted response';
    
    // Clean up any quotes or periods
    summary = summary.replace(/^["']|["']$/g, '').replace(/\.$/, '');

    return new Response(
      JSON.stringify({ summary }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error summarizing thinking:', error);
    
    // Return a fallback summary on error
    return new Response(
      JSON.stringify({ summary: 'Weighed context and crafted response' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

