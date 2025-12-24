import { getAnthropicClient } from '@/lib/ai/providers';

export const maxDuration = 30;

interface RequestBody {
  query: string;
  response: string;
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const { query, response } = body;

    if (!query || !response) {
      return new Response(
        JSON.stringify({ error: 'Query and response are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if Anthropic API key is available
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      // Return empty to trigger fallback in client
      return new Response(
        JSON.stringify({ questions: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = await getAnthropicClient();

    // Generate follow-up questions using Claude
    const result = await client.messages.create({
      model: 'claude-3-haiku-20240307', // Use Haiku for speed and cost
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Based on this conversation, generate 4 intelligent follow-up questions that a curious user might ask next. The questions should:
1. Be specific and actionable (not generic)
2. Build on the information provided
3. Help the user go deeper or apply what they learned
4. Be concise (under 15 words each)

Original question: "${query}"

Response summary: "${response.slice(0, 1500)}"

Return ONLY a JSON array of 4 question strings, nothing else. Example format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?"]`,
        },
      ],
    });

    // Parse the response
    const textContent = result.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    // Extract JSON array from response
    const jsonMatch = textContent.text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const questions = JSON.parse(jsonMatch[0]);
    
    // Validate and clean questions
    const cleanedQuestions = questions
      .filter((q: unknown): q is string => typeof q === 'string' && q.length > 10)
      .map((q: string) => q.trim())
      .slice(0, 4);

    return new Response(
      JSON.stringify({ questions: cleanedQuestions }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating related questions:', error);
    
    // Return empty array to trigger client-side fallback
    return new Response(
      JSON.stringify({ questions: [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

