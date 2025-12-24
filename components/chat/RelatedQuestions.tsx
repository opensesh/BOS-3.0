'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CornerDownRight, Loader2, RefreshCw } from 'lucide-react';

interface RelatedQuestionsProps {
  responseContent: string;
  originalQuery: string;
  onQuestionClick: (question: string) => void;
  modelUsed?: string;
}

export function RelatedQuestions({
  responseContent,
  originalQuery,
  onQuestionClick,
  modelUsed,
}: RelatedQuestionsProps) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasGenerated = useRef(false);

  useEffect(() => {
    // Only generate once per response content change
    if (responseContent && responseContent.length > 100 && !hasGenerated.current) {
      hasGenerated.current = true;
      generateRelatedQuestions();
    }
  }, [responseContent]);

  // Reset the flag when original query changes (new conversation)
  useEffect(() => {
    hasGenerated.current = false;
  }, [originalQuery]);

  const generateRelatedQuestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call our API to generate intelligent follow-up questions
      const response = await fetch('/api/related-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: originalQuery,
          response: responseContent.slice(0, 2000), // Limit context size
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions.slice(0, 4));
      } else {
        // Fallback to smart local generation
        setQuestions(generateSmartQuestions(originalQuery, responseContent));
      }
    } catch (err) {
      console.error('Error generating related questions:', err);
      // Fallback to smart local generation on error
      setQuestions(generateSmartQuestions(originalQuery, responseContent));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    hasGenerated.current = false;
    generateRelatedQuestions();
  };

  if (isLoading) {
    return (
      <div className="mt-6">
        <div className="flex items-center gap-2 text-[var(--fg-tertiary)] text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Finding follow-up questions...</span>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold text-[var(--fg-primary)]">
          Keep exploring
        </h3>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-lg text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          title="Generate new questions"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-1">
        {questions.map((question, idx) => (
          <button
            key={idx}
            onClick={() => onQuestionClick(question)}
            className="w-full flex items-start gap-3 py-2.5 px-3 text-left hover:bg-[var(--bg-secondary)]/50 transition-colors group rounded-lg border border-transparent hover:border-[var(--border-primary)]/30"
          >
            <CornerDownRight className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--fg-brand-primary)] mt-0.5 flex-shrink-0 transition-colors" />
            <span className="text-[14px] text-[var(--fg-primary)]/80 group-hover:text-[var(--fg-primary)] transition-colors leading-relaxed">
              {question}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Smart local question generation as fallback
 * Analyzes the response content to generate contextually relevant questions
 */
function generateSmartQuestions(query: string, content: string): string[] {
  const questions: string[] = [];
  const queryLower = query.toLowerCase();
  
  // Extract key entities and concepts from the response
  const entities = extractKeyEntities(content);
  const topics = extractMainTopics(content);
  const actions = extractActionItems(content);
  
  // Determine query intent and generate appropriate follow-ups
  if (queryLower.includes('what is') || queryLower.includes('what are') || queryLower.includes('define')) {
    // Definition queries → exploration and application
    if (topics.length > 0) {
      questions.push(`How can I apply ${topics[0]} in practice?`);
    }
    if (entities.length > 0) {
      questions.push(`What are the key differences between ${entities[0]} and alternatives?`);
    }
    questions.push(`What are common challenges when working with this?`);
    questions.push(`Can you show me real-world examples?`);
    
  } else if (queryLower.includes('how to') || queryLower.includes('how do') || queryLower.includes('how can')) {
    // How-to queries → next steps and troubleshooting
    questions.push(`What should I do if this doesn't work as expected?`);
    if (actions.length > 0) {
      questions.push(`What's the best way to ${actions[0]}?`);
    }
    questions.push(`Are there any shortcuts or best practices I should know?`);
    questions.push(`What tools or resources would help with this?`);
    
  } else if (queryLower.includes('why') || queryLower.includes('explain')) {
    // Explanation queries → deeper understanding
    if (topics.length > 0) {
      questions.push(`What are the implications of ${topics[0]}?`);
    }
    questions.push(`How does this compare to other approaches?`);
    questions.push(`What evidence supports this?`);
    questions.push(`Are there any counterarguments or limitations?`);
    
  } else if (queryLower.includes('compare') || queryLower.includes('difference') || queryLower.includes('vs')) {
    // Comparison queries → decision making
    questions.push(`Which option would you recommend for beginners?`);
    questions.push(`What are the cost-benefit tradeoffs?`);
    if (entities.length >= 2) {
      questions.push(`When should I use ${entities[0]} instead of ${entities[1]}?`);
    }
    questions.push(`Can I combine these approaches?`);
    
  } else if (queryLower.includes('best') || queryLower.includes('recommend') || queryLower.includes('should')) {
    // Recommendation queries → specifics and alternatives
    questions.push(`What factors should I consider for my specific situation?`);
    questions.push(`Are there budget-friendly alternatives?`);
    if (entities.length > 0) {
      questions.push(`What are the pros and cons of ${entities[0]}?`);
    }
    questions.push(`How do I get started with this?`);
    
  } else {
    // General queries → contextual follow-ups
    if (topics.length > 0) {
      questions.push(`Tell me more about ${topics[0]}`);
    }
    if (entities.length > 0) {
      questions.push(`How does ${entities[0]} work?`);
    }
    questions.push(`What are the key takeaways here?`);
    questions.push(`Can you elaborate on this further?`);
  }

  // Return unique questions, limited to 4
  return [...new Set(questions)].slice(0, 4);
}

/**
 * Extract key entities (proper nouns, technical terms) from content
 */
function extractKeyEntities(content: string): string[] {
  const entities: string[] = [];
  
  // Match capitalized phrases (2-3 words)
  const capitalizedPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g;
  const matches = content.match(capitalizedPattern) || [];
  
  // Filter out common words and sentence starters
  const skipWords = new Set([
    'The', 'This', 'That', 'These', 'Those', 'What', 'How', 'When', 'Where', 'Why',
    'Which', 'Who', 'It', 'They', 'We', 'You', 'For', 'With', 'From', 'About',
    'Here', 'There', 'However', 'Additionally', 'Furthermore', 'Moreover', 'Also',
    'First', 'Second', 'Third', 'Finally', 'Next', 'Then', 'Now', 'Today'
  ]);
  
  for (const match of matches) {
    const words = match.split(' ');
    if (!skipWords.has(words[0]) && match.length > 4) {
      entities.push(match);
    }
  }
  
  // Deduplicate and return top entities
  return [...new Set(entities)].slice(0, 5);
}

/**
 * Extract main topics from content based on frequency and position
 */
function extractMainTopics(content: string): string[] {
  const topics: string[] = [];
  
  // Look for patterns like "X is", "about X", "the X"
  const topicPatterns = [
    /\b(?:about|regarding|concerning)\s+([a-z]+(?:\s+[a-z]+)?)/gi,
    /\bthe\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:is|are|was|were|involves?|includes?)/gi,
  ];
  
  for (const pattern of topicPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const topic = match[1].toLowerCase().trim();
      if (topic.length > 3 && !['this', 'that', 'what', 'which'].includes(topic)) {
        topics.push(topic);
      }
    }
  }
  
  return [...new Set(topics)].slice(0, 3);
}

/**
 * Extract action-oriented phrases from content
 */
function extractActionItems(content: string): string[] {
  const actions: string[] = [];
  
  // Look for verb phrases suggesting actions
  const actionPatterns = [
    /\b(?:you can|you should|try to|consider|make sure to|don't forget to)\s+([a-z]+(?:\s+[a-z]+){0,3})/gi,
    /\b(?:start by|begin with|first)\s+([a-z]+(?:ing)?(?:\s+[a-z]+)?)/gi,
  ];
  
  for (const pattern of actionPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const action = match[1].toLowerCase().trim();
      if (action.length > 5) {
        actions.push(action);
      }
    }
  }
  
  return [...new Set(actions)].slice(0, 3);
}
