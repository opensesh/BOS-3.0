# BOS Chat Functionality Audit - Test Questions

**Created:** 2026-01-20
**Purpose:** Comprehensive audit of chat functionality to identify errors, test edge cases, and validate semantic/RAG improvements.
**Total Tests:** 126 prompts across 10 categories

---

## Testing Instructions

### How to Use This Document
1. Execute each test prompt in the BOS chat interface
2. Compare actual behavior against expected behavior
3. Note any failure indicators observed
4. Document findings in the Results column
5. Execute follow-up prompts where applicable

### Test Result Codes
| Code | Meaning |
|------|---------|
| PASS | Behavior matches expected |
| FAIL | Behavior does not match expected |
| PARTIAL | Some expectations met, some failed |
| BLOCKED | Cannot test due to dependency |
| SKIP | Not applicable to current config |

---

## Section 1: Core Chat Functionality (15 prompts)

Basic send/receive, conversation persistence, session management, and multi-turn context retention.

### CHAT-001: Basic Message Send
| Field | Value |
|-------|-------|
| **Prompt** | Hello, can you hear me? |
| **Expected Behavior** | Response arrives within 5 seconds, message appears in chat UI, response is coherent greeting |
| **Failure Indicators** | Spinner hangs, no response, error toast, blank message bubble |
| **Result** | |

### CHAT-002: Multi-Sentence Response
| Field | Value |
|-------|-------|
| **Prompt** | Explain what a brand operating system is in exactly 3 sentences. |
| **Expected Behavior** | Response contains exactly 3 sentences, content is relevant, streaming visible |
| **Failure Indicators** | Response truncated, more/fewer sentences, streaming stalls |
| **Result** | |

### CHAT-003: Context Retention (Turn 1)
| Field | Value |
|-------|-------|
| **Prompt** | My favorite color is electric blue. Remember this. |
| **Expected Behavior** | Acknowledgment of the information stored |
| **Failure Indicators** | No acknowledgment, error response |
| **Follow-up** | CHAT-004 |
| **Result** | |

### CHAT-004: Context Retention (Turn 2)
| Field | Value |
|-------|-------|
| **Prompt** | What is my favorite color? |
| **Expected Behavior** | Response correctly states "electric blue" |
| **Failure Indicators** | Wrong color, "I don't know", asks to repeat |
| **Result** | |

### CHAT-005: Conversation History Load
| Field | Value |
|-------|-------|
| **Prompt** | [Refresh page after CHAT-004, then send] What did we discuss earlier? |
| **Expected Behavior** | History persists, can reference previous messages about favorite color |
| **Failure Indicators** | Empty history, "I don't have context", database error |
| **Result** | |

### CHAT-006: New Conversation Start
| Field | Value |
|-------|-------|
| **Prompt** | [Click "New Chat" then send] This is a fresh conversation. |
| **Expected Behavior** | New conversation ID created, no prior context carried over |
| **Failure Indicators** | References previous conversation, same conversation ID |
| **Result** | |

### CHAT-007: Long Conversation (10+ turns)
| Field | Value |
|-------|-------|
| **Prompt** | Start counting from 1. Each time I say "next", give me the next number. |
| **Expected Behavior** | Maintains count accurately through 10+ exchanges |
| **Failure Indicators** | Loses count, repeats numbers, forgets context |
| **Follow-up** | Send "next" 10 times |
| **Result** | |

### CHAT-008: Message Edit
| Field | Value |
|-------|-------|
| **Prompt** | [Send "Hello" then edit to "Hello world"] |
| **Expected Behavior** | Edit UI appears, message updates, new response generated |
| **Failure Indicators** | No edit option, edit fails, duplicate messages |
| **Result** | |

### CHAT-009: Message Regenerate
| Field | Value |
|-------|-------|
| **Prompt** | [After any response, click regenerate] |
| **Expected Behavior** | New response generated, may differ from original |
| **Failure Indicators** | No regenerate button, error on click, identical response |
| **Result** | |

### CHAT-010: Stop Generation
| Field | Value |
|-------|-------|
| **Prompt** | Write a 500-word essay about artificial intelligence. |
| **Expected Behavior** | [Click stop mid-stream] Generation stops, partial response preserved |
| **Failure Indicators** | Stop button missing, doesn't stop, response lost entirely |
| **Result** | |

### CHAT-011: Markdown Rendering
| Field | Value |
|-------|-------|
| **Prompt** | Give me a bulleted list of 3 items and a code block with "console.log('test')" |
| **Expected Behavior** | Bullets render as list, code block has syntax highlighting |
| **Failure Indicators** | Raw markdown visible, broken formatting |
| **Result** | |

### CHAT-012: Code Block Copy
| Field | Value |
|-------|-------|
| **Prompt** | Show me a JavaScript function that adds two numbers. |
| **Expected Behavior** | Code block appears with copy button, clicking copies to clipboard |
| **Failure Indicators** | No copy button, copy fails, clipboard empty |
| **Result** | |

### CHAT-013: Link Handling
| Field | Value |
|-------|-------|
| **Prompt** | Include a link to https://example.com in your response. |
| **Expected Behavior** | Link renders as clickable, opens in new tab |
| **Failure Indicators** | Raw URL, link broken, opens in same tab |
| **Result** | |

### CHAT-014: Timestamp Display
| Field | Value |
|-------|-------|
| **Prompt** | What time is it? |
| **Expected Behavior** | Message shows timestamp on hover or in UI |
| **Failure Indicators** | No timestamp visible, wrong time |
| **Result** | |

### CHAT-015: Conversation Delete
| Field | Value |
|-------|-------|
| **Prompt** | [Delete conversation from sidebar] |
| **Expected Behavior** | Confirmation prompt, conversation removed, redirects appropriately |
| **Failure Indicators** | No delete option, delete fails, conversation persists |
| **Result** | |

---

## Section 2: Model Routing & Auto-Selection (12 prompts)

Testing auto-router logic, connector toggles, and manual model override.

### ROUTE-001: Web Search Auto-Route
| Field | Value |
|-------|-------|
| **Prompt** | What happened in the news today? |
| **Expected Behavior** | Routes to Perplexity (sonar), sources panel appears with citations |
| **Failure Indicators** | No sources, Claude responds without web data, wrong model indicator |
| **Result** | |

### ROUTE-002: General Query to Claude
| Field | Value |
|-------|-------|
| **Prompt** | Explain the concept of recursion in programming. |
| **Expected Behavior** | Routes to Claude (sonnet), no web search triggered |
| **Failure Indicators** | Unnecessary web search, wrong model |
| **Result** | |

### ROUTE-003: Brand Query with Brand Toggle
| Field | Value |
|-------|-------|
| **Prompt** | [Enable Brand toggle] What is our brand voice? |
| **Expected Behavior** | RAG retrieves brand voice docs, response uses brand terminology |
| **Failure Indicators** | Generic response, no brand context, RAG failure |
| **Result** | |

### ROUTE-004: Brand Toggle Disabled
| Field | Value |
|-------|-------|
| **Prompt** | [Disable Brand toggle] What is our brand voice? |
| **Expected Behavior** | Generic response about brand voice concept, no RAG retrieval |
| **Failure Indicators** | Still retrieves brand docs, error |
| **Result** | |

### ROUTE-005: Manual Model Override (Claude Sonnet)
| Field | Value |
|-------|-------|
| **Prompt** | [Select Claude Sonnet manually] What model are you? |
| **Expected Behavior** | Identifies as Claude Sonnet, model indicator shows correct selection |
| **Failure Indicators** | Wrong model name, indicator mismatch |
| **Result** | |

### ROUTE-006: Manual Model Override (Claude Opus)
| Field | Value |
|-------|-------|
| **Prompt** | [Select Claude Opus manually] Analyze the philosophical implications of consciousness. |
| **Expected Behavior** | Uses Opus, longer/deeper response expected |
| **Failure Indicators** | Falls back to Sonnet, error message |
| **Result** | |

### ROUTE-007: Manual Model Override (Claude Haiku)
| Field | Value |
|-------|-------|
| **Prompt** | [Select Claude Haiku manually] Give me a quick yes or no answer: Is 2+2 equal to 4? |
| **Expected Behavior** | Fast response, uses Haiku |
| **Failure Indicators** | Slow response, wrong model |
| **Result** | |

### ROUTE-008: Web Toggle Override
| Field | Value |
|-------|-------|
| **Prompt** | [Enable Web toggle, ask general question] What is photosynthesis? |
| **Expected Behavior** | Forces web search even for general knowledge question |
| **Failure Indicators** | No web search performed, toggle ignored |
| **Result** | |

### ROUTE-009: Brain Toggle (Knowledge Base)
| Field | Value |
|-------|-------|
| **Prompt** | [Enable Brain toggle] What documents do I have uploaded? |
| **Expected Behavior** | Searches user's knowledge base/documents |
| **Failure Indicators** | No KB search, generic response |
| **Result** | |

### ROUTE-010: Discover Toggle
| Field | Value |
|-------|-------|
| **Prompt** | [Enable Discover toggle] Find trending topics in my industry. |
| **Expected Behavior** | Discovery/exploration mode activated, broader search |
| **Failure Indicators** | Standard response, toggle has no effect |
| **Result** | |

### ROUTE-011: Multiple Toggles Enabled
| Field | Value |
|-------|-------|
| **Prompt** | [Enable Web + Brand + Brain] How should we position our brand on current trends? |
| **Expected Behavior** | Combines web search + brand knowledge + KB |
| **Failure Indicators** | Only uses one source, conflict errors |
| **Result** | |

### ROUTE-012: Model Persistence Across Turns
| Field | Value |
|-------|-------|
| **Prompt** | [Select Opus, send message, then send another without changing] |
| **Expected Behavior** | Second message also uses Opus |
| **Failure Indicators** | Falls back to default, model resets |
| **Result** | |

---

## Section 3: RAG & Brand Knowledge (15 prompts)

Testing brand voice retrieval accuracy, semantic search relevance, and context injection.

### RAG-001: Brand Color Query
| Field | Value |
|-------|-------|
| **Prompt** | What are our primary brand colors? |
| **Expected Behavior** | Returns Charcoal (#191919), Vanilla (#FFFAEE), Aperol (#FE5102) |
| **Failure Indicators** | Wrong colors, generic response, no specific hex values |
| **Result** | |

### RAG-002: Brand Typography
| Field | Value |
|-------|-------|
| **Prompt** | What fonts should we use for headlines? |
| **Expected Behavior** | Returns Neue Haas Grotesk Display Pro |
| **Failure Indicators** | Wrong font, generic answer |
| **Result** | |

### RAG-003: Brand Voice Description
| Field | Value |
|-------|-------|
| **Prompt** | Describe our brand voice in detail. |
| **Expected Behavior** | Mentions: steward not advisor, smart but not smug, technical but accessible |
| **Failure Indicators** | Generic brand voice description, missing key attributes |
| **Result** | |

### RAG-004: Semantic Search Accuracy
| Field | Value |
|-------|-------|
| **Prompt** | How should we talk to customers? |
| **Expected Behavior** | Retrieves messaging/voice guidelines, semantic match not keyword |
| **Failure Indicators** | No results, wrong documents retrieved |
| **Result** | |

### RAG-005: Brand Guideline Specifics
| Field | Value |
|-------|-------|
| **Prompt** | What percentage of a design should use Aperol? |
| **Expected Behavior** | Max 10% of composition (from guidelines) |
| **Failure Indicators** | Wrong percentage, generic advice |
| **Result** | |

### RAG-006: Quick Action - Voice Framing
| Field | Value |
|-------|-------|
| **Prompt** | [Use Quick Action for social post] Write a LinkedIn post about our new feature. |
| **Expected Behavior** | Post uses brand voice, appropriate for LinkedIn |
| **Failure Indicators** | Generic corporate voice, no brand personality |
| **Result** | |

### RAG-007: Channel-Specific Content (Twitter/X)
| Field | Value |
|-------|-------|
| **Prompt** | Write a tweet announcing our product launch. |
| **Expected Behavior** | Under 280 chars, brand voice, appropriate hashtags |
| **Failure Indicators** | Too long, generic voice |
| **Result** | |

### RAG-008: Channel-Specific Content (Email)
| Field | Value |
|-------|-------|
| **Prompt** | Draft an email subject line and opening for a newsletter. |
| **Expected Behavior** | Email-appropriate tone, brand voice maintained |
| **Failure Indicators** | Too casual, missing brand elements |
| **Result** | |

### RAG-009: Channel-Specific Content (Blog)
| Field | Value |
|-------|-------|
| **Prompt** | Write an intro paragraph for a blog post about brand consistency. |
| **Expected Behavior** | Longer form, thought leadership tone, brand voice |
| **Failure Indicators** | Too short, generic content |
| **Result** | |

### RAG-010: RAG Relevance Threshold
| Field | Value |
|-------|-------|
| **Prompt** | What's the weather like? |
| **Expected Behavior** | Should NOT retrieve brand docs (below 0.5 threshold) |
| **Failure Indicators** | Brand docs injected for irrelevant query |
| **Result** | |

### RAG-011: Complex Brand Query
| Field | Value |
|-------|-------|
| **Prompt** | How should our visual design support our brand philosophy? |
| **Expected Behavior** | Combines design tokens + brand philosophy + art direction |
| **Failure Indicators** | Only returns one doc type, missing connections |
| **Result** | |

### RAG-012: Brand Prohibitions
| Field | Value |
|-------|-------|
| **Prompt** | What elements should we avoid in our designs? |
| **Expected Behavior** | Mentions: Sparkles icon ban, harsh borders, pure #000/#FFF |
| **Failure Indicators** | Missing prohibitions, generic advice |
| **Result** | |

### RAG-013: Writing Style Retrieval
| Field | Value |
|-------|-------|
| **Prompt** | What writing style should we use for investor communications? |
| **Expected Behavior** | Retrieves appropriate writing style guide if exists |
| **Failure Indicators** | Generic response, wrong style |
| **Result** | |

### RAG-014: Multi-Document Synthesis
| Field | Value |
|-------|-------|
| **Prompt** | Create a brand summary combining our voice, colors, and typography. |
| **Expected Behavior** | Pulls from multiple docs, synthesizes coherently |
| **Failure Indicators** | Only uses one source, disjointed response |
| **Result** | |

### RAG-015: No Brand Docs Scenario
| Field | Value |
|-------|-------|
| **Prompt** | [New workspace with no brand docs] What is our brand voice? |
| **Expected Behavior** | Graceful handling, offers to help create guidelines |
| **Failure Indicators** | Error, hallucinated brand info, empty response |
| **Result** | |

---

## Section 4: Extended Thinking (12 prompts)

Testing thinking bubble streaming, tag stripping, model fallback, and long sessions.

### THINK-001: Basic Thinking Trigger
| Field | Value |
|-------|-------|
| **Prompt** | Think through this step by step: If I have 3 apples and give away 1, how many do I have? |
| **Expected Behavior** | Thinking bubble appears with reasoning process |
| **Failure Indicators** | No thinking visible, raw thinking tags in output |
| **Result** | |

### THINK-002: Complex Reasoning
| Field | Value |
|-------|-------|
| **Prompt** | Analyze the pros and cons of remote work vs office work. Consider at least 5 factors for each. |
| **Expected Behavior** | Extended thinking visible, comprehensive analysis follows |
| **Failure Indicators** | Shallow response, thinking cut off |
| **Result** | |

### THINK-003: Tag Stripping Verification
| Field | Value |
|-------|-------|
| **Prompt** | Solve: 15 x 23 + 47 - 12 |
| **Expected Behavior** | No `<thinking>` or `</thinking>` tags visible in output |
| **Failure Indicators** | Raw XML tags visible |
| **Result** | |

### THINK-004: Long Thinking Session
| Field | Value |
|-------|-------|
| **Prompt** | Design a complete mobile app architecture for a social media platform. Include all major components. |
| **Expected Behavior** | Extended thinking (30+ seconds), doesn't timeout |
| **Failure Indicators** | Timeout error, thinking stalls, truncated |
| **Result** | |

### THINK-005: Thinking with Code
| Field | Value |
|-------|-------|
| **Prompt** | Think through how to implement a binary search algorithm, then show me the code. |
| **Expected Behavior** | Thinking shows reasoning, code block follows |
| **Failure Indicators** | Mixed content in thinking bubble, code in wrong place |
| **Result** | |

### THINK-006: Thinking Bubble Toggle
| Field | Value |
|-------|-------|
| **Prompt** | [If toggle exists] Disable thinking display, ask complex question |
| **Expected Behavior** | Thinking happens server-side, not displayed to user |
| **Failure Indicators** | Still shows thinking, toggle has no effect |
| **Result** | |

### THINK-007: Interrupted Thinking
| Field | Value |
|-------|-------|
| **Prompt** | [Send complex query, click stop during thinking] |
| **Expected Behavior** | Stops cleanly, partial thinking may be visible |
| **Failure Indicators** | Crashes, orphaned thinking bubble |
| **Result** | |

### THINK-008: Nested Thinking Request
| Field | Value |
|-------|-------|
| **Prompt** | First, think about what makes good code. Then think about what makes good documentation. |
| **Expected Behavior** | Single coherent thinking section, not nested |
| **Failure Indicators** | Nested thinking tags, confused output |
| **Result** | |

### THINK-009: Thinking with Tool Use
| Field | Value |
|-------|-------|
| **Prompt** | Think about what you need to search for, then search the web for recent AI news. |
| **Expected Behavior** | Thinking precedes tool call, tool executes after |
| **Failure Indicators** | Tool called during thinking, mixed streams |
| **Result** | |

### THINK-010: Model Fallback During Thinking
| Field | Value |
|-------|-------|
| **Prompt** | [Force error scenario if possible] Complex query that might fail |
| **Expected Behavior** | Graceful fallback, error message if needed |
| **Failure Indicators** | Hangs indefinitely, corrupt state |
| **Result** | |

### THINK-011: Thinking Content Privacy
| Field | Value |
|-------|-------|
| **Prompt** | Think about confidential business strategy, then give a summary. |
| **Expected Behavior** | Thinking content stored appropriately, not leaked |
| **Failure Indicators** | Raw thinking persists in conversation history visibly |
| **Result** | |

### THINK-012: Thinking Timeout Boundary
| Field | Value |
|-------|-------|
| **Prompt** | Solve this complex optimization problem: [extremely long detailed problem] |
| **Expected Behavior** | Either completes or times out gracefully at 120s |
| **Failure Indicators** | Hangs beyond timeout, no error message |
| **Result** | |

---

## Section 5: Tool Execution (15 prompts)

Testing web search, artifact creation, multi-round tool loops, and timeout handling.

### TOOL-001: Basic Web Search
| Field | Value |
|-------|-------|
| **Prompt** | Search for the latest news about artificial intelligence. |
| **Expected Behavior** | Web search executes, sources panel shows results with URLs |
| **Failure Indicators** | No sources, search fails, stale results |
| **Result** | |

### TOOL-002: Web Search with Summary
| Field | Value |
|-------|-------|
| **Prompt** | What did Apple announce this week? Summarize the key points. |
| **Expected Behavior** | Searches, summarizes with citations |
| **Failure Indicators** | No citations, hallucinated news |
| **Result** | |

### TOOL-003: Multiple Search Queries
| Field | Value |
|-------|-------|
| **Prompt** | Compare the latest news about Tesla and Ford. |
| **Expected Behavior** | Multiple searches executed, results combined |
| **Failure Indicators** | Only one company searched, missing comparison |
| **Result** | |

### TOOL-004: Artifact Creation (Code)
| Field | Value |
|-------|-------|
| **Prompt** | Create a React component for a login form. |
| **Expected Behavior** | Code artifact created, preview available |
| **Failure Indicators** | Raw code only, no artifact panel |
| **Result** | |

### TOOL-005: Artifact Creation (Document)
| Field | Value |
|-------|-------|
| **Prompt** | Create a markdown document outlining our Q1 goals. |
| **Expected Behavior** | Document artifact created, proper formatting |
| **Failure Indicators** | No artifact, plain text only |
| **Result** | |

### TOOL-006: Artifact Update
| Field | Value |
|-------|-------|
| **Prompt** | [After TOOL-004] Add a "Remember me" checkbox to the login form. |
| **Expected Behavior** | Existing artifact updated, changes visible |
| **Failure Indicators** | New artifact created, old one unchanged |
| **Result** | |

### TOOL-007: Multi-Round Tool Loop
| Field | Value |
|-------|-------|
| **Prompt** | Search for recent AI developments, summarize them, then find related companies. |
| **Expected Behavior** | Multiple tool calls in sequence, coherent output |
| **Failure Indicators** | Loop stops early, tool results lost |
| **Result** | |

### TOOL-008: Tool Timeout
| Field | Value |
|-------|-------|
| **Prompt** | [If possible to simulate slow API] Search for something. |
| **Expected Behavior** | Graceful timeout after threshold, error message |
| **Failure Indicators** | Hangs indefinitely, no feedback |
| **Result** | |

### TOOL-009: Tool Error Recovery
| Field | Value |
|-------|-------|
| **Prompt** | [If possible to simulate API error] Search for news. |
| **Expected Behavior** | Error displayed, option to retry or continue without |
| **Failure Indicators** | Silent failure, conversation stuck |
| **Result** | |

### TOOL-010: Tool Cancellation
| Field | Value |
|-------|-------|
| **Prompt** | [Start search, immediately click stop] |
| **Expected Behavior** | Tool cancelled cleanly, partial results if any |
| **Failure Indicators** | Cannot cancel, orphaned tool state |
| **Result** | |

### TOOL-011: Tool with Large Results
| Field | Value |
|-------|-------|
| **Prompt** | Search for "programming tutorials" and show me many results. |
| **Expected Behavior** | Results paginated or summarized appropriately |
| **Failure Indicators** | Truncated without notice, performance issues |
| **Result** | |

### TOOL-012: Image Search/Analysis
| Field | Value |
|-------|-------|
| **Prompt** | [If supported] Search for images of modern office design. |
| **Expected Behavior** | Image results displayed if supported |
| **Failure Indicators** | Error, text-only results |
| **Result** | |

### TOOL-013: Calculator/Math Tool
| Field | Value |
|-------|-------|
| **Prompt** | Calculate 15% of $1,234.56 |
| **Expected Behavior** | Accurate calculation: $185.18 |
| **Failure Indicators** | Wrong answer, no tool used |
| **Result** | |

### TOOL-014: Tool with Follow-up
| Field | Value |
|-------|-------|
| **Prompt** | Search for news about SpaceX. [Then ask:] Tell me more about the first result. |
| **Expected Behavior** | References specific result from previous search |
| **Failure Indicators** | Cannot reference prior results, searches again |
| **Result** | |

### TOOL-015: Concurrent Tool Execution
| Field | Value |
|-------|-------|
| **Prompt** | Search for news about Google AND create a summary document at the same time. |
| **Expected Behavior** | Both tools execute, results combined |
| **Failure Indicators** | Sequential execution, one fails |
| **Result** | |

---

## Section 6: Streaming & Performance (12 prompts)

Testing response streaming, stall detection, timeout behavior, and long responses.

### STREAM-001: Basic Stream Visibility
| Field | Value |
|-------|-------|
| **Prompt** | Write a paragraph about the ocean. |
| **Expected Behavior** | Text streams in token by token, visible typing effect |
| **Failure Indicators** | Entire response appears at once, chunks too large |
| **Result** | |

### STREAM-002: Stream Speed
| Field | Value |
|-------|-------|
| **Prompt** | Count from 1 to 20, each on a new line. |
| **Expected Behavior** | Smooth streaming, consistent speed |
| **Failure Indicators** | Stuttering, long pauses between tokens |
| **Result** | |

### STREAM-003: Long Response Stream
| Field | Value |
|-------|-------|
| **Prompt** | Write a 1000-word essay about climate change. |
| **Expected Behavior** | Streams entire response without interruption |
| **Failure Indicators** | Truncation, timeout mid-stream |
| **Result** | |

### STREAM-004: Stall Detection (With Sources)
| Field | Value |
|-------|-------|
| **Prompt** | [Web search that returns sources then stalls] |
| **Expected Behavior** | Stall detected after 5s, recovery or error |
| **Failure Indicators** | Hangs indefinitely, no stall detection |
| **Result** | |

### STREAM-005: Stall Detection (Text Only)
| Field | Value |
|-------|-------|
| **Prompt** | [Query that causes text-only response to stall] |
| **Expected Behavior** | Stall detected, handled appropriately |
| **Failure Indicators** | Only triggers if sources present, hangs otherwise |
| **Result** | |

### STREAM-006: Timeout at 120 Seconds
| Field | Value |
|-------|-------|
| **Prompt** | [Force very long generation if possible] |
| **Expected Behavior** | Times out at 120s with message |
| **Failure Indicators** | Exceeds timeout, no message |
| **Result** | |

### STREAM-007: Network Interruption
| Field | Value |
|-------|-------|
| **Prompt** | [Send message, disable network mid-stream, re-enable] |
| **Expected Behavior** | Error shown, can retry after reconnection |
| **Failure Indicators** | Silent failure, corrupted message |
| **Result** | |

### STREAM-008: Rapid Sequential Messages
| Field | Value |
|-------|-------|
| **Prompt** | [Send message 1] [Immediately send message 2] |
| **Expected Behavior** | First message cancelled, second processed |
| **Failure Indicators** | Both process, race condition, errors |
| **Result** | |

### STREAM-009: Stream with Mixed Content
| Field | Value |
|-------|-------|
| **Prompt** | Give me a code example with explanation text around it. |
| **Expected Behavior** | Text and code blocks stream together correctly |
| **Failure Indicators** | Code block breaks streaming, formatting issues |
| **Result** | |

### STREAM-010: SSE Parsing Robustness
| Field | Value |
|-------|-------|
| **Prompt** | [Any prompt - checking SSE parsing] |
| **Expected Behavior** | No parsing errors in console, clean stream |
| **Failure Indicators** | Console errors about JSON parsing, partial data |
| **Result** | |

### STREAM-011: Scroll Behavior During Stream
| Field | Value |
|-------|-------|
| **Prompt** | Write 20 numbered points about productivity. |
| **Expected Behavior** | Auto-scrolls to bottom during stream |
| **Failure Indicators** | Doesn't scroll, jumpy scrolling |
| **Result** | |

### STREAM-012: Stream Memory Usage
| Field | Value |
|-------|-------|
| **Prompt** | [10 long responses in sequence - monitor DevTools] |
| **Expected Behavior** | Memory stable, no leaks |
| **Failure Indicators** | Memory grows unbounded, performance degrades |
| **Result** | |

---

## Section 7: Attachments & Files (8 prompts)

Testing image upload, file processing, and multi-attachment handling.

### ATTACH-001: Single Image Upload
| Field | Value |
|-------|-------|
| **Prompt** | [Upload single image] What do you see in this image? |
| **Expected Behavior** | Image displays in chat, model analyzes it |
| **Failure Indicators** | Upload fails, image not visible, no analysis |
| **Result** | |

### ATTACH-002: Multiple Image Upload
| Field | Value |
|-------|-------|
| **Prompt** | [Upload 3 images] Compare these images. |
| **Expected Behavior** | All images visible, comparison provided |
| **Failure Indicators** | Only one image processed, missing images |
| **Result** | |

### ATTACH-003: Large Image Upload
| Field | Value |
|-------|-------|
| **Prompt** | [Upload high-res image > 5MB] Describe this. |
| **Expected Behavior** | Image resized/compressed, still processed |
| **Failure Indicators** | Upload fails, timeout, error message |
| **Result** | |

### ATTACH-004: Image Format Support (PNG)
| Field | Value |
|-------|-------|
| **Prompt** | [Upload PNG image] |
| **Expected Behavior** | PNG processed correctly |
| **Failure Indicators** | Format not supported error |
| **Result** | |

### ATTACH-005: Image Format Support (JPEG)
| Field | Value |
|-------|-------|
| **Prompt** | [Upload JPEG image] |
| **Expected Behavior** | JPEG processed correctly |
| **Failure Indicators** | Format not supported error |
| **Result** | |

### ATTACH-006: Image Format Support (WebP)
| Field | Value |
|-------|-------|
| **Prompt** | [Upload WebP image] |
| **Expected Behavior** | WebP processed correctly |
| **Failure Indicators** | Format not supported error |
| **Result** | |

### ATTACH-007: Document Upload (PDF)
| Field | Value |
|-------|-------|
| **Prompt** | [Upload PDF] Summarize this document. |
| **Expected Behavior** | PDF text extracted and summarized |
| **Failure Indicators** | Cannot process PDF, extraction fails |
| **Result** | |

### ATTACH-008: Attachment with Long Message
| Field | Value |
|-------|-------|
| **Prompt** | [Upload image + write 500 word message] |
| **Expected Behavior** | Both image and text processed together |
| **Failure Indicators** | One or the other lost, formatting issues |
| **Result** | |

---

## Section 8: Error Scenarios (15 prompts)

Testing API failures, invalid selections, network issues, and recovery.

### ERROR-001: API Rate Limit (429)
| Field | Value |
|-------|-------|
| **Prompt** | [Trigger rate limit if possible - many rapid requests] |
| **Expected Behavior** | Rate limit message shown, retry after delay |
| **Failure Indicators** | Silent failure, no retry, cryptic error |
| **Result** | |

### ERROR-002: API Server Error (500)
| Field | Value |
|-------|-------|
| **Prompt** | [If testable] Trigger server error |
| **Expected Behavior** | Error message shown, retry option |
| **Failure Indicators** | Silent failure, crash |
| **Result** | |

### ERROR-003: Invalid API Key
| Field | Value |
|-------|-------|
| **Prompt** | [If testable with invalid key] Send message |
| **Expected Behavior** | Authentication error, prompt to check settings |
| **Failure Indicators** | Generic error, no guidance |
| **Result** | |

### ERROR-004: Model Unavailable
| Field | Value |
|-------|-------|
| **Prompt** | [If testable] Select unavailable model |
| **Expected Behavior** | Fallback to available model, notification |
| **Failure Indicators** | Silent fallback, error with no recovery |
| **Result** | |

### ERROR-005: Network Offline
| Field | Value |
|-------|-------|
| **Prompt** | [Disable network, send message] |
| **Expected Behavior** | Offline error, queued or clear failure |
| **Failure Indicators** | Hangs indefinitely, no error message |
| **Result** | |

### ERROR-006: Empty Response
| Field | Value |
|-------|-------|
| **Prompt** | [If API returns empty] |
| **Expected Behavior** | Handled gracefully, retry or error message |
| **Failure Indicators** | Empty bubble, crash |
| **Result** | |

### ERROR-007: Malformed JSON Response
| Field | Value |
|-------|-------|
| **Prompt** | [If testable] Trigger malformed response |
| **Expected Behavior** | Parse error handled, user notified |
| **Failure Indicators** | Crash, console errors, partial content |
| **Result** | |

### ERROR-008: Database Connection Lost
| Field | Value |
|-------|-------|
| **Prompt** | [If testable] Lose Supabase connection |
| **Expected Behavior** | Error saving, messages still work in session |
| **Failure Indicators** | Complete failure, lost messages |
| **Result** | |

### ERROR-009: Token Limit Exceeded
| Field | Value |
|-------|-------|
| **Prompt** | [Very long conversation > context limit] Continue... |
| **Expected Behavior** | Context window managed, older messages trimmed |
| **Failure Indicators** | Error, lost context abruptly |
| **Result** | |

### ERROR-010: Concurrent Request Conflict
| Field | Value |
|-------|-------|
| **Prompt** | [Open same conversation in two tabs, send from both] |
| **Expected Behavior** | One succeeds, other handled gracefully |
| **Failure Indicators** | Both succeed with conflicts, data corruption |
| **Result** | |

### ERROR-011: Session Expiry
| Field | Value |
|-------|-------|
| **Prompt** | [If session expires during typing] |
| **Expected Behavior** | Re-auth prompt, message preserved |
| **Failure Indicators** | Lost message, silent failure |
| **Result** | |

### ERROR-012: Invalid Conversation ID
| Field | Value |
|-------|-------|
| **Prompt** | [Navigate to non-existent conversation URL] |
| **Expected Behavior** | 404 or redirect to new conversation |
| **Failure Indicators** | Crash, blank page |
| **Result** | |

### ERROR-013: Tool Execution Failure
| Field | Value |
|-------|-------|
| **Prompt** | [Trigger tool that fails] Search for something. |
| **Expected Behavior** | Tool error shown, can continue without tool |
| **Failure Indicators** | Conversation stuck, cascade failure |
| **Result** | |

### ERROR-014: Partial Stream Failure
| Field | Value |
|-------|-------|
| **Prompt** | [Stream that fails mid-way] |
| **Expected Behavior** | Partial content preserved, error shown |
| **Failure Indicators** | Lost content, no error indication |
| **Result** | |

### ERROR-015: Recovery After Error
| Field | Value |
|-------|-------|
| **Prompt** | [After any error] Send a normal message. |
| **Expected Behavior** | Normal operation resumes |
| **Failure Indicators** | Stuck in error state, requires refresh |
| **Result** | |

---

## Section 9: Edge Cases (12 prompts)

Testing empty inputs, special characters, rapid sends, and boundary conditions.

### EDGE-001: Empty Message
| Field | Value |
|-------|-------|
| **Prompt** | [Press send with empty input] |
| **Expected Behavior** | Send button disabled, no empty message sent |
| **Failure Indicators** | Empty message sent, error |
| **Result** | |

### EDGE-002: Whitespace Only Message
| Field | Value |
|-------|-------|
| **Prompt** | [Send only spaces/tabs/newlines] |
| **Expected Behavior** | Treated as empty, not sent |
| **Failure Indicators** | Whitespace message sent |
| **Result** | |

### EDGE-003: Very Long Single Message
| Field | Value |
|-------|-------|
| **Prompt** | [Send 10,000+ character message - copy paste long text] |
| **Expected Behavior** | Message accepted or clear limit shown |
| **Failure Indicators** | Silent truncation, crash, OOM |
| **Result** | |

### EDGE-004: Special Characters (Emoji)
| Field | Value |
|-------|-------|
| **Prompt** | How are you today? I'm feeling great! 😊🎉✨ |
| **Expected Behavior** | Emoji rendered correctly, response coherent |
| **Failure Indicators** | Emoji broken, encoding issues |
| **Result** | |

### EDGE-005: Special Characters (Unicode)
| Field | Value |
|-------|-------|
| **Prompt** | Translate to Japanese: Hello world |
| **Expected Behavior** | Returns: こんにちは世界 (or similar), renders correctly |
| **Failure Indicators** | Encoding errors, squares instead of characters |
| **Result** | |

### EDGE-006: Special Characters (Code Symbols)
| Field | Value |
|-------|-------|
| **Prompt** | What does this mean: <script>alert('test')</script> |
| **Expected Behavior** | Renders as text, not executed, explains HTML |
| **Failure Indicators** | XSS vulnerability, broken rendering |
| **Result** | |

### EDGE-007: Markdown Injection
| Field | Value |
|-------|-------|
| **Prompt** | Please explain: # This is a heading\n## And this |
| **Expected Behavior** | Treats as literal text to explain, not rendered markdown |
| **Failure Indicators** | Input rendered as markdown headers |
| **Result** | |

### EDGE-008: Rapid Sequential Sends
| Field | Value |
|-------|-------|
| **Prompt** | [Send 5 messages as fast as possible] Hi. Hello. Hey. Yo. Sup. |
| **Expected Behavior** | Queue managed, responses arrive in order |
| **Failure Indicators** | Race conditions, out of order, duplicates |
| **Result** | |

### EDGE-009: Send During Response
| Field | Value |
|-------|-------|
| **Prompt** | [Send message while previous is streaming] |
| **Expected Behavior** | New message queued or cancels previous |
| **Failure Indicators** | Both streams conflict, corrupted output |
| **Result** | |

### EDGE-010: Copy-Paste Large Text
| Field | Value |
|-------|-------|
| **Prompt** | [Paste entire lorem ipsum article] |
| **Expected Behavior** | Handles large paste, may scroll input |
| **Failure Indicators** | UI freezes, truncation without warning |
| **Result** | |

### EDGE-011: Newlines in Input
| Field | Value |
|-------|-------|
| **Prompt** | Line 1\nLine 2\nLine 3\n\nLine 5 |
| **Expected Behavior** | Newlines preserved in message display |
| **Failure Indicators** | Newlines stripped, collapsed to single line |
| **Result** | |

### EDGE-012: Maximum Messages in Conversation
| Field | Value |
|-------|-------|
| **Prompt** | [Reach 100+ messages in single conversation] |
| **Expected Behavior** | Performance stable, older messages loadable |
| **Failure Indicators** | Slow scrolling, crashes, lost messages |
| **Result** | |

---

## Section 10: Brand Voice Consistency (10 prompts)

Testing voice consistency across messages, channels, and content types.

### VOICE-001: Voice Consistency (Sequential)
| Field | Value |
|-------|-------|
| **Prompt** | Write three separate social media posts about our product. |
| **Expected Behavior** | All three maintain consistent brand voice |
| **Failure Indicators** | Voice varies between posts, generic tone |
| **Result** | |

### VOICE-002: Voice Across Channels
| Field | Value |
|-------|-------|
| **Prompt** | Write the same announcement for: 1) Twitter 2) LinkedIn 3) Email |
| **Expected Behavior** | Same brand voice, adjusted for channel conventions |
| **Failure Indicators** | Inconsistent voice, wrong tone for channel |
| **Result** | |

### VOICE-003: Technical with Voice
| Field | Value |
|-------|-------|
| **Prompt** | Explain our API authentication in brand voice. |
| **Expected Behavior** | Technical accuracy with brand personality |
| **Failure Indicators** | Too corporate, loses voice for tech content |
| **Result** | |

### VOICE-004: Casual with Voice
| Field | Value |
|-------|-------|
| **Prompt** | Write a fun Instagram caption for our team photo. |
| **Expected Behavior** | Casual but still on-brand |
| **Failure Indicators** | Off-brand casual, too informal |
| **Result** | |

### VOICE-005: Long-Form with Voice
| Field | Value |
|-------|-------|
| **Prompt** | Write a 500-word blog post introduction about brand consistency. |
| **Expected Behavior** | Voice maintained throughout long content |
| **Failure Indicators** | Voice fades in long content |
| **Result** | |

### VOICE-006: Error/Negative with Voice
| Field | Value |
|-------|-------|
| **Prompt** | Write a response to a customer complaint, maintaining brand voice. |
| **Expected Behavior** | Empathetic but still on-brand |
| **Failure Indicators** | Too apologetic, loses voice |
| **Result** | |

### VOICE-007: Excitement with Voice
| Field | Value |
|-------|-------|
| **Prompt** | Write an announcement for our biggest feature launch ever! |
| **Expected Behavior** | Excited but not over-the-top, still on-brand |
| **Failure Indicators** | Generic hype language, excessive exclamation |
| **Result** | |

### VOICE-008: Minimal Content with Voice
| Field | Value |
|-------|-------|
| **Prompt** | Write a one-sentence tagline for our brand. |
| **Expected Behavior** | Distills voice into brief statement |
| **Failure Indicators** | Generic tagline, voice not evident |
| **Result** | |

### VOICE-009: Voice Recovery
| Field | Value |
|-------|-------|
| **Prompt** | [After generic response] Actually, make that more in our brand voice. |
| **Expected Behavior** | Adjusts to proper brand voice |
| **Failure Indicators** | Same generic response, doesn't adjust |
| **Result** | |

### VOICE-010: Voice with User Constraint
| Field | Value |
|-------|-------|
| **Prompt** | Write a tweet in our brand voice, but make it professional for B2B audience. |
| **Expected Behavior** | Balances brand voice with constraint |
| **Failure Indicators** | Loses voice to meet constraint |
| **Result** | |

---

## Test Results Summary

| Section | Total | Pass | Fail | Partial | Blocked |
|---------|-------|------|------|---------|---------|
| 1. Core Chat | 15 | | | | |
| 2. Model Routing | 12 | | | | |
| 3. RAG & Brand | 15 | | | | |
| 4. Extended Thinking | 12 | | | | |
| 5. Tool Execution | 15 | | | | |
| 6. Streaming | 12 | | | | |
| 7. Attachments | 8 | | | | |
| 8. Error Scenarios | 15 | | | | |
| 9. Edge Cases | 12 | | | | |
| 10. Brand Voice | 10 | | | | |
| **TOTAL** | **126** | | | | |

---

## Critical Issues Found

| Test ID | Issue | Severity | Notes |
|---------|-------|----------|-------|
| | | | |

---

## Recommendations

1.

---

## Appendix A: Test Environment

| Parameter | Value |
|-----------|-------|
| Browser | |
| OS | |
| BOS Version | |
| Test Date | |
| Tester | |

---

## Appendix B: Known Gaps from Code Analysis

These issues were identified during code review and should be monitored during testing:

### useChat.ts Vulnerabilities
| Location | Issue | Test IDs to Watch |
|----------|-------|-------------------|
| Lines 215-233 | 120s timeout may not be enough for extended thinking | THINK-004, THINK-012 |
| Lines 316-329 | Stall detection only triggers if sources received first | STREAM-005 |
| Lines 343-344 | Buffer splitting on `\n` could miss partial SSE | STREAM-010 |
| Lines 356-366 | setState during streaming could cause race conditions | EDGE-008, EDGE-009 |
| Lines 485-494 | AbortError handling could mask real errors | CHAT-010, THINK-007 |
| Lines 501-509 | Empty message cleanup could fail silently | ERROR-006 |

### route.ts Vulnerabilities
| Location | Issue | Test IDs to Watch |
|----------|-------|-------------------|
| Lines 566-923 | Tool failure cascades | TOOL-009, ERROR-013 |
| No retry logic | 429 rate limits fail immediately | ERROR-001 |
| No backoff | Transient failures not retried | ERROR-002 |
| No input validation | Large messages could OOM | EDGE-003 |
