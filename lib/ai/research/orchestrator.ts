/**
 * Deep Research Module - Orchestrator
 *
 * Main coordinator for the research pipeline. Manages the flow from
 * classification through planning, searching, synthesis, and gap filling.
 */

import type {
  ResearchSession,
  ResearchStreamEvent,
  SessionMetrics,
  SubQuestion,
  ResearchNote,
  Citation,
  QueryComplexity,
  SessionStatus,
} from './types';
import {
  RESEARCH_CONFIG,
  estimateSessionCost,
  STREAM_DELAY_MS,
  ERROR_CODES,
  ERROR_MESSAGES,
} from './config';
import { classifyQuery, shouldUseFastPath } from './classifier';
import { createResearchPlan, getParallelBatch, updateSubQuestionStatus } from './planner';
import { executeParallelSearches, estimateBatchCost } from './search-workers';
import {
  synthesizeAnswer,
  shouldProceedToRound2,
  getRound2Queries,
  mergeCitations,
  renumberCitations,
} from './synthesizer';

// ============================================
// TYPES
// ============================================

export interface OrchestratorOptions {
  useLLMClassification?: boolean;
  forceComplexity?: QueryComplexity;
  skipRound2?: boolean;
  maxCost?: number;
}

export interface StreamController {
  enqueue: (event: ResearchStreamEvent) => void;
  close: () => void;
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Create a new research session
 */
function createSession(query: string): ResearchSession {
  const sessionId = `research-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    id: sessionId,
    query,
    status: 'initializing',
    complexity: null,
    plan: null,
    notes: [],
    gaps: [],
    currentRound: 1,
    finalAnswer: null,
    citations: [],
    startedAt: new Date(),
    completedAt: null,
    error: null,
  };
}

/**
 * Update session status
 */
function updateSession(
  session: ResearchSession,
  updates: Partial<ResearchSession>
): ResearchSession {
  return { ...session, ...updates };
}

// ============================================
// EVENT HELPERS
// ============================================

function createEvent(
  type: ResearchStreamEvent['type'],
  sessionId: string,
  data: ResearchStreamEvent['data']
): ResearchStreamEvent {
  return {
    type,
    sessionId,
    timestamp: Date.now(),
    data,
  };
}

async function emitEvent(
  controller: StreamController,
  event: ResearchStreamEvent
): Promise<void> {
  controller.enqueue(event);
  // Small delay for smooth streaming
  await new Promise((resolve) => setTimeout(resolve, STREAM_DELAY_MS));
}

// ============================================
// FAST PATH (Simple Queries)
// ============================================

/**
 * Handle simple queries with a single Perplexity search
 */
async function executeFastPath(
  session: ResearchSession,
  controller: StreamController
): Promise<ResearchSession> {
  console.log('[Orchestrator] Using fast path for simple query');

  // Create a single sub-question from the original query
  const subQuestion: SubQuestion = {
    id: 'sq-fast',
    question: session.query,
    reasoning: 'Direct search (fast path)',
    priority: 'high',
    status: 'pending',
  };

  // Execute single search
  const { notes, totalDurationMs } = await executeParallelSearches(
    [subQuestion],
    session.id,
    'sonar',
    {
      onSearchStart: (id, question) => {
        emitEvent(
          controller,
          createEvent('search_start', session.id, {
            subQuestionId: id,
            question,
          })
        );
      },
      onSearchProgress: (id, sourcesFound) => {
        emitEvent(
          controller,
          createEvent('search_progress', session.id, {
            subQuestionId: id,
            sourcesFound,
          })
        );
      },
      onSearchComplete: (id, note) => {
        emitEvent(
          controller,
          createEvent('search_complete', session.id, {
            subQuestionId: id,
            note,
            citationsCount: note.citations.length,
          })
        );
      },
      onSearchError: () => {
        // Handled below
      },
    }
  );

  if (notes.length === 0) {
    throw new Error(ERROR_CODES.SEARCH_FAILED);
  }

  // For fast path, the note content IS the answer
  const note = notes[0];
  const { answer, citations } = renumberCitations(note.content, note.citations);

  return updateSession(session, {
    status: 'completed',
    notes,
    finalAnswer: answer,
    citations,
    completedAt: new Date(),
  });
}

// ============================================
// FULL RESEARCH PIPELINE
// ============================================

/**
 * Execute the full research pipeline
 */
async function executeFullPipeline(
  session: ResearchSession,
  complexity: QueryComplexity,
  controller: StreamController,
  options: OrchestratorOptions
): Promise<ResearchSession> {
  const metrics: Partial<SessionMetrics> = {
    sessionId: session.id,
    totalQueries: 0,
    totalCitations: 0,
    gapsFound: 0,
    gapsResolved: 0,
  };

  let currentSession = updateSession(session, { complexity });
  const model = complexity === 'complex' ? 'sonar-pro' : 'sonar';
  let totalCost = 0;

  // ========== PHASE 1: PLANNING ==========
  const planStartTime = Date.now();
  currentSession = updateSession(currentSession, { status: 'planning' });

  const plan = await createResearchPlan(session.query, session.id, complexity);
  currentSession = updateSession(currentSession, { plan });

  await emitEvent(
    controller,
    createEvent('plan', session.id, {
      subQuestions: plan.subQuestions,
      totalEstimatedTime: plan.totalEstimatedTime,
    })
  );

  metrics.planningDurationMs = Date.now() - planStartTime;

  // ========== PHASE 2: SEARCHING ==========
  const searchStartTime = Date.now();
  currentSession = updateSession(currentSession, { status: 'searching' });

  // Get questions that can run in parallel
  const completedIds = new Set<string>();
  let allNotes: ResearchNote[] = [];

  // Process in batches respecting dependencies
  let batch = getParallelBatch(plan.subQuestions, completedIds);

  while (batch.length > 0) {
    // Check cost limit
    const batchCost = estimateBatchCost(batch.length, model);
    if (totalCost + batchCost > (options.maxCost ?? RESEARCH_CONFIG.maxTotalCost)) {
      console.warn('[Orchestrator] Cost limit approaching, limiting batch');
      batch = batch.slice(0, Math.max(1, Math.floor((options.maxCost ?? RESEARCH_CONFIG.maxTotalCost - totalCost) / batchCost)));
    }

    const { notes, failedQuestions } = await executeParallelSearches(
      batch,
      session.id,
      model,
      {
        onSearchStart: (id, question) => {
          emitEvent(
            controller,
            createEvent('search_start', session.id, {
              subQuestionId: id,
              question,
            })
          );
        },
        onSearchProgress: (id, sourcesFound) => {
          emitEvent(
            controller,
            createEvent('search_progress', session.id, {
              subQuestionId: id,
              sourcesFound,
            })
          );
        },
        onSearchComplete: (id, note) => {
          emitEvent(
            controller,
            createEvent('search_complete', session.id, {
              subQuestionId: id,
              note,
              citationsCount: note.citations.length,
            })
          );
        },
        onSearchError: () => {
          // Continue with other searches
        },
      }
    );

    // Update state
    allNotes = [...allNotes, ...notes];
    totalCost += batchCost;
    metrics.totalQueries = (metrics.totalQueries || 0) + batch.length;

    // Mark completed
    for (const note of notes) {
      completedIds.add(note.subQuestionId);
    }

    // Update plan with statuses
    for (const sq of batch) {
      const status = failedQuestions.find((f) => f.id === sq.id)
        ? 'failed'
        : 'completed';
      currentSession = updateSession(currentSession, {
        plan: updateSubQuestionStatus(currentSession.plan!, sq.id, status),
      });
    }

    // Get next batch
    batch = getParallelBatch(currentSession.plan!.subQuestions, completedIds);
  }

  currentSession = updateSession(currentSession, { notes: allNotes });
  metrics.searchDurationMs = Date.now() - searchStartTime;

  if (allNotes.length === 0) {
    throw new Error(ERROR_CODES.SEARCH_FAILED);
  }

  // ========== PHASE 3: SYNTHESIS ==========
  const synthesisStartTime = Date.now();
  currentSession = updateSession(currentSession, { status: 'synthesizing' });

  await emitEvent(
    controller,
    createEvent('synthesize_start', session.id, {
      notesCount: allNotes.length,
      citationsCount: allNotes.reduce((sum, n) => sum + n.citations.length, 0),
    })
  );

  const synthesisResult = await synthesizeAnswer(
    {
      query: session.query,
      notes: allNotes,
    },
    session.id,
    1,
    {
      onProgress: (progress, partialAnswer) => {
        emitEvent(
          controller,
          createEvent('synthesize_progress', session.id, {
            progress,
            partialAnswer,
          })
        );
      },
    }
  );

  metrics.synthesisDurationMs = Date.now() - synthesisStartTime;
  metrics.gapsFound = synthesisResult.gaps.length;

  currentSession = updateSession(currentSession, {
    gaps: synthesisResult.gaps,
    finalAnswer: synthesisResult.answer,
    citations: synthesisResult.citations,
  });

  // ========== PHASE 4: GAP ANALYSIS & ROUND 2 ==========
  if (
    !options.skipRound2 &&
    currentSession.currentRound < RESEARCH_CONFIG.maxRounds &&
    shouldProceedToRound2(synthesisResult)
  ) {
    // Emit gap found events
    for (const gap of synthesisResult.gaps.filter((g) => g.priority !== 'low')) {
      await emitEvent(
        controller,
        createEvent('gap_found', session.id, {
          gap,
          willStartRound2: true,
        })
      );
    }

    // Check cost limit for round 2
    const round2Queries = getRound2Queries(synthesisResult.gaps);
    const round2Cost = estimateBatchCost(round2Queries.length, model);

    if (totalCost + round2Cost <= (options.maxCost ?? RESEARCH_CONFIG.maxTotalCost)) {
      const round2StartTime = Date.now();
      currentSession = updateSession(currentSession, {
        status: 'round2_searching',
        currentRound: 2,
      });

      await emitEvent(
        controller,
        createEvent('round2_start', session.id, {
          gaps: synthesisResult.gaps,
          newQueries: round2Queries,
        })
      );

      // Create sub-questions for round 2
      const round2Questions: SubQuestion[] = round2Queries.map((query, idx) => ({
        id: `sq-r2-${idx}`,
        question: query,
        reasoning: `Addressing gap: ${synthesisResult.gaps[idx]?.description || 'Additional research'}`,
        priority: synthesisResult.gaps[idx]?.priority || 'medium',
        status: 'pending',
      }));

      // Execute round 2 searches
      const round2Result = await executeParallelSearches(
        round2Questions,
        session.id,
        model,
        {
          onSearchStart: (id, question) => {
            emitEvent(
              controller,
              createEvent('search_start', session.id, {
                subQuestionId: id,
                question,
              })
            );
          },
          onSearchProgress: (id, sourcesFound) => {
            emitEvent(
              controller,
              createEvent('search_progress', session.id, {
                subQuestionId: id,
                sourcesFound,
              })
            );
          },
          onSearchComplete: (id, note) => {
            emitEvent(
              controller,
              createEvent('search_complete', session.id, {
                subQuestionId: id,
                note,
                citationsCount: note.citations.length,
              })
            );
          },
          onSearchError: () => {},
        },
        // Provide context from round 1
        synthesisResult.answer
      );

      metrics.totalQueries = (metrics.totalQueries || 0) + round2Queries.length;

      // Re-synthesize with all notes
      if (round2Result.notes.length > 0) {
        currentSession = updateSession(currentSession, {
          status: 'round2_synthesizing',
          notes: [...allNotes, ...round2Result.notes],
        });

        await emitEvent(
          controller,
          createEvent('synthesize_start', session.id, {
            notesCount: currentSession.notes.length,
            citationsCount: currentSession.notes.reduce(
              (sum, n) => sum + n.citations.length,
              0
            ),
          })
        );

        const round2Synthesis = await synthesizeAnswer(
          {
            query: session.query,
            notes: currentSession.notes,
            previousAnswer: synthesisResult.answer,
            gaps: synthesisResult.gaps,
          },
          session.id,
          2,
          {
            onProgress: (progress, partialAnswer) => {
              emitEvent(
                controller,
                createEvent('synthesize_progress', session.id, {
                  progress,
                  partialAnswer,
                })
              );
            },
          }
        );

        // Merge citations
        const mergedCitations = mergeCitations(
          synthesisResult.citations,
          round2Synthesis.citations
        );

        // Mark gaps as resolved
        metrics.gapsResolved = synthesisResult.gaps.length;

        currentSession = updateSession(currentSession, {
          finalAnswer: round2Synthesis.answer,
          citations: mergedCitations,
          gaps: currentSession.gaps.map((g) => ({ ...g, resolved: true })),
        });
      }

      metrics.round2DurationMs = Date.now() - round2StartTime;
    }
  }

  // Final citation renumbering
  if (currentSession.finalAnswer) {
    const { answer, citations } = renumberCitations(
      currentSession.finalAnswer,
      currentSession.citations
    );
    currentSession = updateSession(currentSession, {
      finalAnswer: answer,
      citations,
    });
  }

  metrics.totalCitations = currentSession.citations.length;

  return updateSession(currentSession, {
    status: 'completed',
    completedAt: new Date(),
  });
}

// ============================================
// MAIN ORCHESTRATOR
// ============================================

/**
 * Execute deep research for a query
 *
 * This is the main entry point for the research pipeline.
 * It creates a streaming response that emits events as the
 * research progresses.
 */
export async function executeResearch(
  query: string,
  controller: StreamController,
  options: OrchestratorOptions = {}
): Promise<void> {
  const session = createSession(query);
  const startTime = Date.now();

  try {
    // Emit start event
    await emitEvent(
      controller,
      createEvent('research_start', session.id, {
        query,
        estimatedTime: 30, // Will be updated after classification
      })
    );

    // ========== CLASSIFICATION ==========
    const classifyStartTime = Date.now();
    const classification = await classifyQuery(query, {
      useLLM: options.useLLMClassification,
      forceComplexity: options.forceComplexity,
    });

    await emitEvent(
      controller,
      createEvent('classify', session.id, {
        complexity: classification.complexity,
        confidence: classification.confidence,
        estimatedTime: classification.estimatedTime,
      })
    );

    const classificationDurationMs = Date.now() - classifyStartTime;

    // ========== EXECUTE PIPELINE ==========
    let finalSession: ResearchSession;

    if (shouldUseFastPath(classification)) {
      finalSession = await executeFastPath(
        updateSession(session, {
          status: 'classifying',
          complexity: classification.complexity,
        }),
        controller
      );
    } else {
      finalSession = await executeFullPipeline(
        updateSession(session, { status: 'classifying' }),
        classification.complexity,
        controller,
        options
      );
    }

    // ========== COMPLETE ==========
    const totalDurationMs = Date.now() - startTime;

    const metrics: Partial<SessionMetrics> = {
      sessionId: session.id,
      totalDurationMs,
      classificationDurationMs,
      estimatedCostUsd: estimateSessionCost(
        classification.complexity,
        classification.suggestedModel === 'sonar-pro'
      ),
    };

    await emitEvent(
      controller,
      createEvent('research_complete', session.id, {
        answer: finalSession.finalAnswer || '',
        citations: finalSession.citations,
        totalTime: totalDurationMs,
        metrics,
      })
    );

    console.log(
      `[Orchestrator] Research completed in ${totalDurationMs}ms with ` +
        `${finalSession.citations.length} citations`
    );
  } catch (error) {
    console.error('[Orchestrator] Research failed:', error);

    const errorCode =
      error instanceof Error && Object.values(ERROR_CODES).includes(error.message as any)
        ? error.message
        : ERROR_CODES.UNKNOWN;

    await emitEvent(
      controller,
      createEvent('error', session.id, {
        message: ERROR_MESSAGES[errorCode] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN],
        code: errorCode,
        recoverable: errorCode !== ERROR_CODES.UNKNOWN,
      })
    );
  } finally {
    controller.close();
  }
}

// ============================================
// EXPORTS
// ============================================

export { createSession, updateSession };
