/**
 * API Route for AI-Guided Content Generation
 * 
 * Uses Claude to help users create structured markdown content
 * through an interview-style flow.
 * 
 * POST /api/brain/guided-input - Generate content from interview answers
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { BrandDocumentCategory } from '@/lib/supabase/types';

const anthropic = new Anthropic();

// ============================================
// INTERVIEW QUESTIONS BY CATEGORY
// ============================================

const INTERVIEW_QUESTIONS: Record<BrandDocumentCategory, string[]> = {
  'brand-identity': [
    "What is your brand name?",
    "What is your brand's mission or purpose? (Why does your brand exist?)",
    "What are your core values? (3-5 principles that guide your brand)",
    "Who is your target audience?",
    "What makes your brand unique or different from competitors?",
    "What personality traits describe your brand? (e.g., friendly, professional, innovative)",
    "What emotions do you want people to feel when interacting with your brand?",
  ],
  'writing-styles': [
    "What platform or context is this writing style for? (e.g., blog, social media, email)",
    "Who is your target reader/audience for this content?",
    "What tone should this writing have? (e.g., casual, professional, playful)",
    "What reading level should the content target?",
    "What pronouns should be used? (e.g., 'we', 'I', 'you')",
    "Are there specific words or phrases that should always or never be used?",
    "What's the typical length for this type of content?",
    "Should the content include CTAs? If so, what kind?",
  ],
  'skills': [
    "What is the name of this skill/capability?",
    "What does this skill enable the AI to do?",
    "When should this skill be used? (What triggers it?)",
    "What inputs does this skill need to work properly?",
    "What outputs or artifacts does this skill produce?",
    "Are there any limitations or constraints to be aware of?",
    "Can you provide an example of this skill in action?",
  ],
  'commands': [
    "What is the command name (e.g., /my-command)?",
    "What does this command do?",
    "What inputs or arguments does it accept?",
    "What output does it produce?",
  ],
  'data': [
    "What type of data is this (e.g., reference list, lookup table)?",
    "What is this data used for?",
    "How should this data be formatted?",
  ],
  'config': [
    "What is this configuration for?",
    "What settings or options does it define?",
    "Are there any dependencies or requirements?",
  ],
};

// ============================================
// SYSTEM PROMPTS BY CATEGORY
// ============================================

const SYSTEM_PROMPTS: Record<BrandDocumentCategory, string> = {
  'brand-identity': `You are a brand strategist helping create comprehensive brand identity documentation.
Based on the user's answers to interview questions, generate a well-structured markdown document that captures their brand identity.

The document should include:
- Brand name and tagline (if provided)
- Mission statement
- Core values with brief explanations
- Target audience profile
- Unique value proposition
- Brand personality traits
- Emotional associations

Format the output as clean, professional markdown with appropriate headers, bullet points, and sections.
Make the language warm but professional. Fill in reasonable defaults where information is sparse, but mark assumptions clearly.`,

  'writing-styles': `You are a content strategist helping create writing style guidelines.
Based on the user's answers, generate a comprehensive writing style guide in markdown format.

The document should include:
- Quick reference section (platform, voice, tone)
- Target audience description
- Tone and voice guidelines with DO/DON'T examples
- Formatting rules (headers, paragraphs, lists)
- Word choice guidelines
- Example openings and closings
- Content length recommendations
- CTA guidelines if applicable

Format as clean markdown that's easy to reference. Include practical examples where helpful.`,

  'skills': `You are a technical writer helping document AI capabilities and skills.
Based on the user's answers, generate clear skill documentation in markdown format.

The document should include:
- Skill name and brief description
- Purpose and use cases
- Trigger conditions (when to use)
- Required inputs with formats
- Expected outputs with examples
- Limitations and constraints
- Example usage scenario

Format as clear, technical markdown suitable for AI instruction. Be precise and unambiguous.`,

  'commands': `You are a technical writer helping document slash commands.
Based on the user's answers, generate clear command documentation in markdown format.

The document should include:
- Command name and syntax
- Description of what it does
- Arguments and options
- Example usage
- Expected output

Format as clear, technical markdown suitable for reference.`,

  'data': `You are a technical writer helping document reference data.
Based on the user's answers, generate well-structured data documentation in markdown format.

The document should include:
- Data type and purpose
- Format and structure
- Usage guidelines
- Example entries

Format as clear markdown with appropriate tables or lists.`,

  'config': `You are a technical writer helping document configuration files.
Based on the user's answers, generate clear configuration documentation in markdown format.

The document should include:
- Configuration purpose
- Available settings
- Default values
- Dependencies and requirements

Format as clear, technical markdown suitable for reference.`,
};

// ============================================
// GET - Get interview questions for category
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as BrandDocumentCategory | null;

    if (!category) {
      // Return all categories with questions
      return NextResponse.json({
        categories: Object.entries(INTERVIEW_QUESTIONS).map(([cat, questions]) => ({
          category: cat,
          questions,
          questionCount: questions.length,
        })),
      });
    }

    // Validate category
    if (!INTERVIEW_QUESTIONS[category]) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      category,
      questions: INTERVIEW_QUESTIONS[category],
    });
  } catch (error) {
    console.error('Error in GET /api/brain/guided-input:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview questions' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Generate content from answers
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, answers, title } = body;

    // Validate inputs
    if (!category || !answers) {
      return NextResponse.json(
        { error: 'Category and answers are required' },
        { status: 400 }
      );
    }

    // Validate category
    if (!INTERVIEW_QUESTIONS[category as BrandDocumentCategory]) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const questions = INTERVIEW_QUESTIONS[category as BrandDocumentCategory];
    const systemPrompt = SYSTEM_PROMPTS[category as BrandDocumentCategory];

    // Build the user message with Q&A pairs
    const qaPairs = questions
      .map((question, index) => {
        const answer = answers[index] || answers[question] || '(Not provided)';
        return `**Q: ${question}**\nA: ${answer}`;
      })
      .join('\n\n');

    const userMessage = `Please create a ${category} document based on these interview answers:

${qaPairs}

${title ? `Document title: ${title}` : ''}

Generate a comprehensive, well-structured markdown document based on these responses.`;

    // Call Claude to generate content
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    const generatedContent = textContent.text;

    // Try to extract a title from the generated content if not provided
    let suggestedTitle = title;
    if (!suggestedTitle) {
      const titleMatch = generatedContent.match(/^#\s+(.+?)[\n\r]/m);
      if (titleMatch) {
        suggestedTitle = titleMatch[1].trim();
      }
    }

    return NextResponse.json({
      content: generatedContent,
      suggestedTitle,
      category,
      questionCount: questions.length,
      answeredCount: Object.values(answers).filter(a => a && String(a).trim()).length,
    });
  } catch (error) {
    console.error('Error in POST /api/brain/guided-input:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

