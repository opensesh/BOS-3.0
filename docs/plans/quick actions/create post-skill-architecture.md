# Three-Layer Skill Architecture for Create Post Quick Actions Content Generation

## Overview

This document outlines a three-layer skill architecture for the "Create Post" feature in the brand operating system. This approach decouples UI/form definition, content generation logic, and channel-specific best practices into independently editable skills that work together as a cohesive system.

**Core Principle:** Each layer has a single responsibility and can be edited independently without breaking the others. The system is composable, auditable, and learning-enabled.

---

## Architecture Diagram

```
User fills form (Layer 1: UI/Schema)
         ↓
Generates JSON (standardized input)
         ↓
Passed to Layer 2 (Execution/Generation)
         ↓
Layer 2 queries Layer 3 (Channel Best Practices)
         ↓
Combined output: Generated post content
         ↓
User can edit output (triggers feedback loop)
         ↓
Learning system updates Layer 2 or Layer 3
         ↓
Next generation improves
```

---

## Layer 1: UI/Schema Skill

**Purpose:** Define the form structure, field validation, conditional logic, and channel-content format mappings.

**Owner:** Brand managers, product strategists

**Responsibility:**
- What information to collect from users
- How to validate/constrain inputs
- When to show/hide fields (conditional UI)
- How channels map to content formats
- Which channels are active for this brand

**Key Concept:** This layer is **NOT** about content generation. It's purely about asking the right questions in the right order based on the user's selections.

### Layer 1 Skill Definition: `create_post_ui`

```json
{
  "skill": {
    "id": "create_post_ui",
    "name": "Create Post UI Schema",
    "version": "1.2.0",
    "type": "ui_schema_generator",
    "owner": "brand_management",
    "description": "Defines the form structure, fields, and conditional logic for the post creation interface. Manages channel-to-content-format mappings specific to your brand.",
    
    "channelConfiguration": {
      "description": "Map content formats to available channels for this brand. Remove channels your business doesn't use.",
      "short_form": {
        "channels": ["Instagram", "LinkedIn"],
        "preferred_content_types": {
          "Instagram": ["Reel", "Post", "Story"],
          "LinkedIn": ["Document", "Video"]
        }
      },
      "long_form": {
        "channels": ["YouTube", "LinkedIn"],
        "preferred_content_types": {
          "YouTube": ["Long-form Video", "Tutorial"],
          "LinkedIn": ["Article", "Document"]
        }
      },
      "written": {
        "channels": ["Newsletter", "Blog", "LinkedIn"],
        "preferred_content_types": {
          "Newsletter": ["Educational", "Promotional", "Narrative"],
          "Blog": ["How-to", "Analysis", "Case Study"],
          "LinkedIn": ["Post", "Article"]
        }
      }
    },

    "schema": {
      "description": "Form structure with sections and conditional fields",
      "sections": [
        {
          "id": "content_format",
          "label": "Content Format",
          "description": "Choose the primary format for this post",
          "fields": [
            {
              "id": "format",
              "type": "button_group",
              "label": "Format",
              "options": ["Short-form", "Long-form", "Written"],
              "default": "Short-form",
              "required": true,
              "description": "Select the content format that best fits your message"
            }
          ]
        },

        {
          "id": "channels",
          "label": "Channels",
          "description": "Select where this post will be published",
          "conditionalOn": "format",
          "conditionalLogic": "Only show after format is selected",
          "fields": [
            {
              "id": "channel",
              "type": "multi_button_group",
              "label": "Publishing Channel",
              "dynamicOptions": "pulled from channelConfiguration based on selected format",
              "required": true,
              "helpText": "Only channels configured for this format are shown"
            },
            {
              "id": "content_type",
              "type": "button_group",
              "label": "Content Type",
              "conditionalOn": "channel",
              "dynamicOptions": "pulled from channelConfiguration based on selected channel",
              "required": true,
              "helpText": "Available types depend on selected channel"
            }
          ]
        },

        {
          "id": "content_strategy",
          "label": "Content Strategy",
          "description": "Define the core message and goal",
          "conditionalOn": "channel",
          "fields": [
            {
              "id": "goal",
              "type": "button_group",
              "label": "Primary Goal",
              "options": ["Awareness", "Engagement", "Conversion", "Education", "Entertainment", "Community"],
              "default": "Engagement",
              "required": true,
              "description": "What do you want this post to accomplish?"
            },
            {
              "id": "key_message",
              "type": "textarea",
              "label": "Key Message",
              "placeholder": "What's the core message or topic for this post?",
              "required": true,
              "maxLength": 500,
              "description": "Be specific about the main point you want to communicate",
              "characterCount": true
            }
          ]
        },

        {
          "id": "reference_materials",
          "label": "Reference Materials",
          "description": "Optional: Provide context or assets the LLM should consider",
          "fields": [
            {
              "id": "references",
              "type": "file_upload_or_url",
              "label": "Upload or paste reference content",
              "required": false,
              "acceptTypes": ["image", "text", "url"],
              "description": "Images, blog posts, links, or other materials to inform the post"
            }
          ]
        },

        {
          "id": "output_preferences",
          "label": "Output Preferences",
          "description": "Control how the content is generated",
          "fields": [
            {
              "id": "variations",
              "type": "slider",
              "label": "Number of variations",
              "min": 1,
              "max": 5,
              "default": 1,
              "description": "Generate multiple variations for A/B testing"
            },
            {
              "id": "output_length",
              "type": "select",
              "label": "Preferred length",
              "options": ["Short", "Standard", "Long"],
              "default": "Standard",
              "description": "How much detail to include in the output"
            },
            {
              "id": "hashtags",
              "type": "select",
              "label": "Hashtag strategy",
              "options": ["None", "Minimal", "Generated", "Aggressive"],
              "default": "Generated",
              "description": "Control hashtag inclusion and density"
            },
            {
              "id": "cta_type",
              "type": "select",
              "label": "Call-to-action style",
              "options": ["Direct", "Subtle", "Question", "None"],
              "default": "Direct",
              "description": "How explicit should the CTA be?"
            },
            {
              "id": "emoji_style",
              "type": "select",
              "label": "Emoji usage",
              "options": ["None", "Minimal (1-2)", "Moderate (3-5)", "Expressive (5+)"],
              "default": "Moderate (3-5)",
              "description": "Channel-specific emoji recommendations apply"
            }
          ]
        }
      ]
    },

    "validationRules": {
      "description": "Rules that validate inputs before passing to Layer 2",
      "key_message_not_empty": true,
      "at_least_one_channel": true,
      "format_channel_compatibility": "Validate selected channel matches selected format"
    },

    "editableByNonTechnical": true,
    "notes": "This skill can be edited by brand managers without touching code. Changes here immediately reflect in the UI without requiring backend changes."
  }
}
```

### When to Edit Layer 1

- ✅ Add a new question (e.g., "Brand Voice Preset")
- ✅ Change conditional visibility logic
- ✅ Add/remove channels your business uses
- ✅ Change field labels or help text
- ✅ Add validation rules
- ❌ Never: Write content generation logic
- ❌ Never: Reference LLM reasoning or prompting

---

## Layer 2: Execution/Generation Skill

**Purpose:** Take the JSON input from Layer 1 and generate high-quality, brand-aligned post content.

**Owner:** Content strategists, copywriters, AI prompt engineers

**Responsibility:**
- Reasoning about the structured input
- Applying brand voice and guidelines
- Coordinating with Layer 3 (channel best practices)
- Generating variations
- Formatting output for readability and posting

**Key Concept:** This layer does NOT know about form fields, conditionals, or UI. It only knows: "I have this JSON input; generate great content based on brand guidelines and channel best practices."

### Layer 2 Skill Definition: `generate_post_content`

```json
{
  "skill": {
    "id": "generate_post_content",
    "name": "Generate Post Content",
    "version": "2.1.0",
    "type": "execution_generator",
    "owner": "content_team",
    "description": "Takes structured JSON input from Layer 1 and generates brand-aligned, channel-optimized post content. Queries Layer 3 for channel-specific best practices.",

    "inputContract": {
      "description": "This matches the JSON output from Layer 1's form",
      "format": {
        "type": "string",
        "enum": ["Short-form", "Long-form", "Written"],
        "description": "Content format selected by user"
      },
      "channel": {
        "type": "array",
        "items": "string",
        "description": "Selected publishing channels (e.g., ['Instagram', 'LinkedIn'])"
      },
      "content_type": {
        "type": "string",
        "description": "Specific content type for the channel"
      },
      "goal": {
        "type": "string",
        "enum": ["Awareness", "Engagement", "Conversion", "Education", "Entertainment", "Community"],
        "description": "Primary objective for this post"
      },
      "key_message": {
        "type": "string",
        "description": "Core message or topic"
      },
      "references": {
        "type": "string | null",
        "description": "Optional reference materials provided by user"
      },
      "variations": {
        "type": "number",
        "description": "How many variations to generate"
      },
      "output_length": {
        "type": "string",
        "enum": ["Short", "Standard", "Long"],
        "description": "Desired length of output"
      },
      "hashtags": {
        "type": "string",
        "enum": ["None", "Minimal", "Generated", "Aggressive"],
        "description": "Hashtag density preference"
      },
      "cta_type": {
        "type": "string",
        "enum": ["Direct", "Subtle", "Question", "None"],
        "description": "Call-to-action approach"
      },
      "emoji_style": {
        "type": "string",
        "description": "Emoji usage preference"
      }
    },

    "systemPrompt": `You are an expert social media content strategist and copywriter. Your job is to transform structured user input into authentic, engaging post content that resonates with the target audience and aligns perfectly with brand voice.

## YOUR BRAND VOICE & GUIDELINES

[Retrieved from brand database]
- Tone: [Describe tone here - e.g., "Professional but approachable", "Bold and experimental"]
- Core Values: [List values]
- Do's: [Specific guidance on what to include]
- Don'ts: [Specific guidance on what to avoid]
- Brand Personality: [e.g., "Thought leader", "Creator", "Community builder"]

Example posts that nail the voice:
[Include 2-3 real examples from your best-performing content]

---

## YOUR TASK

You will receive structured input with:
- format, channel(s), content_type, goal, key_message
- Optional references
- Output preferences (length, hashtags, cta_type, emoji_style)

You must generate post content that:
1. Hits the primary goal (Awareness, Engagement, etc.)
2. Respects brand voice exactly as specified above
3. Follows channel-specific best practices (pulled from Layer 3)
4. Matches the user's output preferences
5. Is ready to post immediately

---

## CHANNEL-SPECIFIC BEST PRACTICES

For each channel the user selected, you will receive detailed best practices from Layer 3:
- Optimal post structure
- Character limits and recommendations
- Engagement patterns
- Hashtag strategy for that channel
- Emoji usage norms
- Timing and frequency insights

**Always apply these practices when relevant.**

---

## OUTPUT FORMAT

Generate the requested number of variations in this structure:

\`\`\`json
{
  "metadata": {
    "generated_at": "ISO timestamp",
    "format": "user's selected format",
    "channels": ["list of channels"],
    "goal": "user's goal",
    "variations_count": number
  },
  "variations": [
    {
      "variation_id": 1,
      "copy": "The main post text, ready to paste",
      "hashtags": ["tag1", "tag2"],
      "cta": "The call-to-action or engagement hook",
      "channel_notes": {
        "Instagram": "Why this works well on Instagram",
        "LinkedIn": "Why this works well on LinkedIn",
        // ... for each channel
      },
      "reasoning": "Brief explanation of why this variation works for the stated goal"
    }
  ],
  "generation_notes": "Overall observations about the variations"
}
\`\`\`

---

## APPLYING OUTPUT PREFERENCES

- **output_length**: 
  - "Short": 50-100 words, punchy, no fluff
  - "Standard": 100-200 words, balanced detail
  - "Long": 200+ words, comprehensive and storytelling

- **hashtags**:
  - "None": No hashtags
  - "Minimal": 2-3 hashtags, high intent
  - "Generated": 5-8 hashtags, balanced
  - "Aggressive": 10-15 hashtags, maximum reach

- **cta_type**:
  - "Direct": "Buy now", "Sign up", "Join us"
  - "Subtle": Implied action, soft touch
  - "Question": End with engaging question
  - "None": No explicit CTA

- **emoji_style**: Apply based on channel norms and user preference

---

## IMPORTANT REMINDERS

- Do NOT include any meta-commentary or explanations in the copy itself
- Make the copy feel authentic to your brand voice, not generic
- If references are provided, weave them in naturally
- Generate truly different variations—don't just shuffle sentences
- Each variation should be independently postable
- Consider the user's goal in every creative decision
`,

    "layerThreeIntegration": {
      "description": "How Layer 2 queries Layer 3 for channel-specific best practices",
      "method": "For each channel selected by user, call the corresponding Layer 3 skill",
      "example": "If user selected ['Instagram', 'LinkedIn'], call 'channel_best_practices_instagram' and 'channel_best_practices_linkedin'",
      "integration_pattern": "Before generating, retrieve best practices for each channel and include in context"
    },

    "refinementGuidance": {
      "description": "How to improve this skill over time",
      "adjust_tone": "Modify the voice guidelines section to shift tone (more casual, more formal, etc.)",
      "channel_rules": "Add or remove specific rules for how this brand should approach each channel",
      "goal_weighting": "Adjust how strongly the LLM optimizes for each goal type",
      "quality_examples": "Update example posts to reflect your best current content",
      "output_format": "Customize the JSON output structure if needed"
    },

    "editableByNonTechnical": true,
    "notes": "Brand strategists and content leads should regularly review and refine the brand voice section and adjust goal-weighting based on what's working."
  }
}
```

### When to Edit Layer 2

- ✅ Update brand voice guidelines
- ✅ Adjust tone or personality
- ✅ Change how the LLM approaches each goal type
- ✅ Add new brand rules (e.g., "Always mention sustainability")
- ✅ Update example posts
- ✅ Adjust output format preferences
- ✅ Refine the reasoning and quality
- ❌ Never: Change the input schema (that's Layer 1)
- ❌ Never: Add channel-specific rules (that's Layer 3)

---

## Layer 3: Channel Best Practices Skills

**Purpose:** Define and maintain the latest, research-backed best practices for each content channel your brand uses.

**Owner:** Channel specialists, content strategists (can be auto-generated and regularly reviewed)

**Responsibility:**
- Channel-specific posting best practices
- Engagement patterns and algorithms
- Optimal post structure and formatting
- Hashtag strategies per channel
- Emoji norms
- Content type performance data
- Timing and frequency recommendations
- Length guidelines

**Key Concept:** Each channel has its own skill. These are "auto-generated" from research, but editable by your team to customize for your specific brand's performance on that channel.

### Layer 3 Skills: Individual Channel Best Practices

#### Example: `channel_best_practices_instagram`

```json
{
  "skill": {
    "id": "channel_best_practices_instagram",
    "name": "Instagram Best Practices & Rules",
    "version": "1.0.0",
    "type": "channel_best_practices",
    "owner": "social_media_specialist",
    "channel": "Instagram",
    "lastUpdated": "2026-01-19",
    "researchBased": true,
    "description": "Current Instagram algorithm best practices, engagement patterns, and format recommendations. Customizable for brand-specific performance.",

    "overview": {
      "algorithm": "Instagram prioritizes content that drives interactions (saves, shares, comments) over likes. The algorithm favors authentic content and watch time.",
      "keyInsights": [
        "Reels get 30% more reach than static posts",
        "Comments beat likes in signal importance",
        "Save rate indicates content utility/inspiration",
        "Watch time on video content is critical metric"
      ]
    },

    "contentTypePerformance": {
      "Post": {
        "bestFor": ["Product showcase", "Announcements", "Brand aesthetics", "Inspirational content"],
        "recommendedLength": "Caption: 150-300 characters (optimal for full visibility)",
        "engagementTips": [
          "Ask a question to prompt comments",
          "Pose a choice (Would you rather...)",
          "Include call-to-action that encourages saves (e.g., 'Save this for later')"
        ],
        "careelPerformance": "Average engagement 3-5%"
      },
      "Reel": {
        "bestFor": ["Tutorial", "Entertainment", "Trending audio", "Story-driven content", "Behind-the-scenes"],
        "recommendedLength": "15-60 seconds (sweet spot: 21-34 seconds)",
        "engagementTips": [
          "Hook in first 1-2 seconds",
          "Use trending audio (increases reach by 20-40%)",
          "Include text overlays (increases retention)",
          "End with clear CTA (link, follow, message)"
        ],
        "averageEngagement": "8-12%"
      },
      "Story": {
        "bestFor": ["Ephemeral content", "Daily updates", "Polls and questions", "Event coverage", "Urgency creation"],
        "recommendedLength": "3-5 seconds per frame",
        "engagementTips": [
          "Use interactive stickers (polls, questions, quizzes)",
          "Include swipe-up link if eligible",
          "Create urgency (limited time offers, flash sales)",
          "Post 1-3 times daily for visibility"
        ],
        "viewDuration": "Average 2-3 seconds before swipe"
      },
      "Carousel": {
        "bestFor": ["Step-by-step guides", "Before/after", "Product comparisons", "Educational content"],
        "recommendedLength": "3-7 slides optimal",
        "engagementTips": [
          "First slide is most critical—hook viewers",
          "Use text to guide viewers (e.g., 'Swipe to see...')",
          "Each slide should stand alone",
          "Last slide should have strong CTA"
        ],
        "averageEngagement": "6-9%"
      }
    },

    "postingStrategy": {
      "optimalTimes": {
        "Monday": ["9 AM", "12 PM", "5 PM"],
        "Tuesday": ["9 AM", "11 AM", "3 PM"],
        "Wednesday": ["9 AM", "12 PM", "6 PM"],
        "Thursday": ["9 AM", "1 PM", "5 PM"],
        "Friday": ["9 AM", "12 PM", "7 PM"],
        "Saturday": ["11 AM", "3 PM"],
        "Sunday": ["12 PM", "5 PM"],
        "note": "Customize based on YOUR audience timezone and actual performance data"
      },
      "frequencyRecommendation": "4-7 feed posts per week, 1-3 stories per day",
      "consistencyMatters": "Regular posting schedule trains the algorithm; consistency matters more than frequency"
    },

    "captionGuidelines": {
      "length": {
        "optimal": "150-300 characters for full visibility without 'more' truncation",
        "extended": "Up to 2,200 characters if story demands it",
        "note": "First 125 characters appear without clicking 'more'"
      },
      "structure": {
        "line1": "Hook or emoji opener (grab attention in 125 chars)",
        "body": "Main message or story (2-5 sentences)",
        "cta": "Clear call-to-action (comment, save, share, click link)",
        "hashtags": "See hashtag section below"
      },
      "emotionalTriggers": [
        "Start with emotion or curiosity (not information)",
        "Ask a direct question to encourage comments",
        "Use line breaks for readability (not one wall of text)",
        "Be authentic—Instagram favors conversational tone"
      ]
    },

    "hashtagStrategy": {
      "recommendedCount": "5-10 hashtags for posts, 3-5 for stories",
      "researchBackedApproach": {
        "3_popular": "3 hashtags with 100K-500K posts (reach potential)",
        "4_medium": "4 hashtags with 10K-100K posts (niche relevance)",
        "3_niche": "3 hashtags with <10K posts (ultra-targeted community)"
      },
      "placement": "Add hashtags in first comment for algorithmic benefits, or at end of caption",
      "avoid": [
        "Don't use hashtags in stories (reduces impressions)",
        "Don't use banned hashtags (Instagram has a hidden blocklist)",
        "Don't use the same 30 hashtags every post (looks spammy)"
      ],
      "brandSpecificAdjustment": "For your brand, use these hashtags: [User-provided branded hashtags]"
    },

    "emojiGuidelines": {
      "brandRecommendation": "3-5 emojis per post optimal",
      "placement": "Use in caption and within text for visual breaks",
      "strategy": [
        "Lead with emoji that represents your niche",
        "Use 1-2 emojis per line of text for visual rhythm",
        "Match emoji to content (don't overuse irrelevant emojis)"
      ],
      "forYourBrand": "Avoid: [User-provided list]. Embrace: [User-provided list]"
    },

    "callToActionGuidelines": {
      "explicitCTAs": [
        "Double-tap if you agree",
        "Save this for later",
        "Tag someone who needs to see this",
        "Comment your answer below",
        "Click the link in bio"
      ],
      "implicitCTAs": [
        "Ask a question (prompts comments naturally)",
        "Pose a dilemma (Would you rather...)",
        "Incomplete statement (The best [X] is...)"
      ],
      "algorithmicNote": "Comments > Likes in signal strength, so encourage comments over clicks"
    },

    "commonMistakes": [
      "Using irrelevant hashtags (kills reach)",
      "Posting at off-peak times for audience",
      "Captions over 300 chars without visual hierarchy",
      "Stories that don't use interactive stickers",
      "Reels without trending audio",
      "Generic CTAs that don't match content",
      "Inconsistent posting schedule"
    ],

    "performanceMetrics": {
      "trackThese": [
        "Reach vs. Impressions (reach = unique users, impressions = total views)",
        "Engagement rate (total interactions / followers)",
        "Save rate (saves indicate utility)",
        "Comment sentiment (are comments positive?)",
        "Share rate (highest value engagement signal)",
        "Click-through rate to bio link"
      ],
      "benchmarks": "For your brand, based on your niche: [Custom benchmarks if available]"
    },

    "customizationNotes": {
      "editThisSkill": [
        "Update 'brandSpecificAdjustment' with your top-performing hashtags",
        "Adjust 'optimalTimes' based on YOUR audience data",
        "Add your brand's common mistakes to avoid list",
        "Update emoji preferences for your brand voice",
        "Document which content types perform best for you"
      ],
      "autoGeneratedButEditable": "This skill was generated from current Instagram best practices research, but your team should customize it with your brand's unique performance patterns."
    }
  }
}
```

#### Template: Additional Channel Skills

For each channel, create a similar skill:
- `channel_best_practices_linkedin`
- `channel_best_practices_tiktok`
- `channel_best_practices_youtube`
- `channel_best_practices_newsletter`
- `channel_best_practices_blog`
- etc.

### When to Edit Layer 3

- ✅ Update best practices with latest research
- ✅ Add brand-specific customizations (your top hashtags, your optimal times)
- ✅ Document what content types work best for YOUR brand
- ✅ Adjust metrics/benchmarks based on performance
- ✅ Add common mistakes specific to your audience
- ❌ Never: Write content generation logic
- ❌ Never: Change form fields or UI

---

## System Integration: How the Layers Work Together

### The Complete Flow

```
1. USER FILLS FORM (Layer 1)
   └─ Form validates inputs
   └─ Generates JSON:
      {
        "format": "Short-form",
        "channel": ["Instagram"],
        "content_type": "Reel",
        "goal": "Engagement",
        "key_message": "New product launch announcement",
        "references": null,
        "variations": 2,
        "output_length": "Standard",
        "hashtags": "Generated",
        "cta_type": "Direct",
        "emoji_style": "Moderate"
      }

2. JSON PASSED TO LAYER 2 (Execution Skill)
   └─ Layer 2 receives the JSON
   └─ For each selected channel, queries corresponding Layer 3 skill
   └─ Example: Calls "channel_best_practices_instagram"
   └─ Layer 3 returns:
      {
        "contentTypePerformance": { ... },
        "postingStrategy": { ... },
        "captionGuidelines": { ... },
        "hashtagStrategy": { ... },
        "emojiGuidelines": { ... }
      }

3. LAYER 2 COMBINES & GENERATES
   └─ Combines user input + brand voice + channel best practices
   └─ Generates 2 variations optimized for Instagram Reels
   └─ Returns structured JSON with copy, hashtags, CTAs

4. UI DISPLAYS OUTPUT
   └─ User sees 2 variations ready to post
   └─ Can select one, edit, or regenerate

5. USER PROVIDES FEEDBACK (Layer 5)
   └─ User: "Make this more conversational"
   └─ System captures: { "feedback_type": "tone", "direction": "more_conversational" }
   └─ Triggers learning skill to update Layer 2's systemPrompt
   └─ Next generation incorporates improvement
```

### API Contracts Between Layers

#### Layer 1 → Layer 2
**Input Format:**
```json
{
  "format": "string",
  "channel": "array<string>",
  "content_type": "string",
  "goal": "string",
  "key_message": "string",
  "references": "string | null",
  "variations": "number",
  "output_length": "string",
  "hashtags": "string",
  "cta_type": "string",
  "emoji_style": "string"
}
```

#### Layer 2 → Layer 3 (per channel)
**Query:**
```
Call: channel_best_practices_{channel_name}
Return: Best practices configuration object
```

#### Layer 2 → UI
**Output Format:**
```json
{
  "metadata": {
    "generated_at": "ISO timestamp",
    "format": "string",
    "channels": "array<string>",
    "goal": "string",
    "variations_count": "number"
  },
  "variations": [
    {
      "variation_id": "number",
      "copy": "string (ready to post)",
      "hashtags": "array<string>",
      "cta": "string",
      "channel_notes": "object (per-channel insights)",
      "reasoning": "string"
    }
  ]
}
```

---

## Layer 5: Feedback & Learning System

**Purpose:** Observe user behavior (edits, regenerations, manual refinements) and improve Layers 2 and 3 over time.

**How It Works:**

### 5A: Capture User Feedback
When a user edits generated content, capture:
```json
{
  "generated_output": "original text",
  "user_edit": "edited text",
  "feedback_type": "tone | structure | length | cta | emoji_usage",
  "feedback_direction": "more_casual | more_professional | longer | shorter",
  "applied_to": "variation_id",
  "timestamp": "ISO",
  "context": {
    "goal": "Engagement",
    "channel": "Instagram",
    "content_type": "Reel"
  }
}
```

### 5B: Analyze Patterns
The learning skill identifies patterns:
- If 80% of edits for "Engagement" goal are "make it more conversational" → update Layer 2's engagement voice
- If Instagram Reels consistently get shortened → update Layer 3's length recommendation
- If hashtag counts vary wildly → analyze which density works best

### 5C: Update Layers
```
Pattern detected: Engagement posts consistently need more conversational tone

Action: Update Layer 2 systemPrompt to say:
"For goal=Engagement, prioritize:
- Conversational language, contractions
- Avoid corporate jargon
- Use questions to invite conversation"
```

### 5D: Optional: Create Variants
```
Learning system creates variants of Layer 2 and Layer 3:
- "generate_post_content.conversational_v1"
- "channel_best_practices_instagram.high_engagement_v1"

User can select which variant to use, or system auto-picks based on goal
```

---

## Implementation Roadmap

### Phase 1: Build Core Layers
- [ ] Create Layer 1 (UI/Schema Skill) - manually authored
- [ ] Create Layer 2 (Execution Skill) - manually authored
- [ ] Create Layer 3 (Channel Best Practices Skills) - manually authored for each channel
- [ ] Wire up API contracts between layers
- [ ] Test end-to-end flow

### Phase 2: Frontend Integration
- [ ] UI reads Layer 1 schema and renders dynamic form
- [ ] Form submission creates JSON and passes to Layer 2
- [ ] Layer 2 queries Layer 3 for each channel
- [ ] Output displayed in UI
- [ ] User can edit outputs

### Phase 3: Feedback Loop
- [ ] Capture user edits as structured feedback
- [ ] Build analysis skill to identify patterns
- [ ] Create update mechanism for Layer 2 and Layer 3
- [ ] Test that improvements compound over time

### Phase 4: Advanced Features
- [ ] Create skill variants based on feedback patterns
- [ ] Build UI to show "why this was generated this way"
- [ ] Enable A/B testing different Layer 2 variants
- [ ] Add audit trail (who edited what, when, why)

---

## Key Design Principles

1. **Separation of Concerns**
   - Layer 1 ≠ content generation
   - Layer 2 ≠ form structure
   - Layer 3 ≠ brand voice
   - Each can evolve independently

2. **Composability**
   - One skill can use multiple Layer 3s (multi-channel posts)
   - One Layer 3 can serve multiple skills
   - New channels = new Layer 3, no changes to 1 or 2

3. **Editability**
   - Non-technical users edit Layer 1 (form structure)
   - Content strategists edit Layer 2 (voice, reasoning)
   - Channel specialists edit Layer 3 (best practices)
   - System improves continuously without code changes

4. **Auditability**
   - Every output has source (Layer 2 + Layer 3 versions used)
   - User feedback is logged and analyzed
   - Changes to skills are versioned
   - Can trace why output was generated a certain way

5. **Learning**
   - Feedback updates Layer 2 and/or Layer 3
   - Patterns compound over time
   - System gets smarter with usage
   - Non-technical continuous improvement loop

---

## FAQ & Troubleshooting

### Q: What if Layer 2 output doesn't match Layer 3 best practices?
**A:** Layer 2 should always incorporate Layer 3 practices. If conflict, Layer 3 should override (it's research-based). Check that Layer 2's integration with Layer 3 is properly weighted in the systemPrompt.

### Q: Can I have multiple versions of Layer 2 (e.g., different brand voices)?
**A:** Yes. Create `generate_post_content.brand_a` and `generate_post_content.brand_b`. UI can let users select which skill to use, or Layer 1 can route to the correct version based on a "brand" field.

### Q: How do I prevent Layer 1 changes from breaking Layer 2?
**A:** The contract between them is the JSON structure. As long as Layer 1's output JSON matches Layer 2's inputContract schema, changes to Layer 1 are backward compatible. If you add a new field, update Layer 2's inputContract and systemPrompt to handle it.

### Q: What if a user wants to manually edit the Layer 3 best practices?
**A:** They absolutely should. Layer 3 is research-based but customizable. User can say "for our brand, Instagram engagement is 20%, so adjust post structure accordingly" and edit the skill.

### Q: How do I prevent skill bloat?
**A:** Keep skills focused. If a skill starts doing multiple things, consider splitting it. For example, if "generate_post_content" starts handling both copy AND image generation, split into "generate_post_copy" and "generate_post_images."

---

## Conclusion

This three-layer architecture provides:
- **Scalability:** Add new channels by creating new Layer 3 skills
- **Flexibility:** Edit any layer independently based on business needs
- **Quality:** Combine brand guidelines (Layer 2) with research-backed best practices (Layer 3)
- **Learning:** Feedback loop continuously improves output without manual intervention
- **Auditability:** Clear record of what generated what, and why
- **Non-Technical Access:** Brand teams can customize without touching code

The system treats **UI as a skill output** (not hard-coded), **content generation as composable reasoning** (not monolithic), and **learning as a built-in feature** (not an afterthought).
