# Create Post Copy Skill

## Purpose
Generate on-brand social media and content copy optimized for specific channels, content types, and goals. This skill receives structured inputs from the BOS quick action UI and produces ready-to-use copy that aligns with the brand's voice, messaging pillars, and creative direction.

## When to Use
- User triggers "Create Post Copy" quick action
- Receives structured parameters: channel, content_type, goal, key_message, content_pillar (optional), tone_modifier (optional), reference (optional)

## Required Context
This skill requires access to:
- Brand voice guidelines (from BOS brand context)
- Brand messaging pillars (from BOS brand context)  
- Channel-specific best practices (embedded in skill)
- Content pillars and creative territories (from BOS brand context)

---

## Channel Knowledge Base

### Instagram

**Post (Single Image)**
- Character limit: 2,200 (optimal: 125-150 for feed visibility)
- Hook in first line (before "...more")
- 3-5 hashtags max (in caption or first comment)
- CTA patterns: Question, Poll prompt, "Save this for later", "Link in bio"
- Visual-first platform: caption complements, never competes with image

**Carousel**
- 10 slides max
- Slide 1: Hook/headline that creates curiosity
- Slides 2-9: Value delivery, one idea per slide
- Slide 10: CTA + recap
- Caption reinforces carousel, doesn't duplicate
- Educational carousels perform 3x higher for saves

**Reel Caption**
- Character limit: 2,200 (optimal: under 100)
- Hook must work with video hook (complement, don't repeat)
- Trending audio reference if applicable
- First 3 seconds = make or break

**Story**
- Short, punchy text overlays
- 125 chars max visible
- Interactive stickers increase engagement 2x
- Use polls, questions, sliders for engagement

### LinkedIn

**Post**
- Character limit: 3,000 (optimal: 1,200-1,500)
- Hook in first 2 lines (before "...see more")
- White space for readability (short paragraphs)
- Personal narrative + insight + takeaway structure
- Engagement prompt at end (question or opinion request)
- Posting time: Tues-Thurs, 8-10am or 12pm

**Carousel (Document)**
- PDF format, 10-15 slides
- Bold headlines, minimal body text per slide
- First slide: Compelling title
- Last slide: CTA + author info
- Brand fonts and colors consistent throughout

**Article**
- 1,500-2,000 words optimal
- SEO-optimized headline
- Featured image: 1200x627px
- Subheadings every 300 words
- Include personal perspective

### TikTok

**Video Caption**
- Character limit: 4,000 (optimal: under 150)
- Front-load keywords for search
- Minimal hashtags (3-5 max)
- Hook should complement video, not explain it
- Native language, less polished tone acceptable

**Comment**
- Engage authentically
- Reply with additional value
- Pin strategic comments to drive discussion

### X/Twitter

**Tweet**
- Character limit: 280
- Punchy, complete thought
- No hashtags or minimal (1 max)
- Media increases engagement 3x
- Best times: 9am, 12pm, 3pm weekdays

**Thread**
- Tweet 1: Hook + promise (why read this?)
- Middle tweets: Numbered points or narrative beats
- Final tweet: Summary + CTA + retweet prompt
- Each tweet must stand alone AND connect to whole
- Optimal length: 5-10 tweets

### YouTube

**Title**
- 60 chars max, keyword-front-loaded
- Include number if listicle ("7 Ways to...")
- Create curiosity gap without clickbait
- Bracket format performs well: [2024] or [GUIDE]

**Description**
- First 150 chars appear in search (critical)
- Timestamp structure for longer content
- CTA to subscribe/like
- Relevant links and resources
- SEO keywords naturally integrated

**Community Post**
- Polls get highest engagement
- Behind-the-scenes content builds connection
- Cross-promote upcoming content

### Email

**Subject Line**
- 40-50 chars optimal (displays fully on mobile)
- Patterns: Curiosity gap, Benefit-driven, Urgency, Personal
- A/B test subjects regularly
- Avoid spam triggers (ALL CAPS, excessive punctuation)

**Preview Text**
- 40-100 chars, complements subject
- Don't repeat subject line
- Create secondary hook

**Body Copy**
- Inverted pyramid (key message first)
- Single CTA focus
- Scannable with headers/bullets for longer form
- Mobile-first formatting
- Personalization tokens when appropriate

### Blog

**Title & Meta**
- SEO title: 50-60 chars
- Meta description: 150-160 chars
- Include primary keyword naturally
- Create curiosity or promise value

**Structure**
- H2/H3 structure for scannability
- Intro: Hook + promise + preview
- Body: One main idea per section
- Conclusion: Summary + CTA
- Internal links to related content

**Length by Type**
- How-to: 1,500-2,500 words
- Listicle: 1,000-2,000 words
- Case study: 1,500-3,000 words
- Opinion/thought piece: 800-1,500 words

---

## Goal Modifiers

### Awareness
- Lead with educational/interesting content
- Soft CTA (follow, save, share)
- Broader appeal hooks
- Focus on "what" and "why"
- Establish authority through value

### Engagement
- Ask questions, prompt opinions
- Create debate or discussion
- Interactive elements (polls, "rate this")
- Controversial or contrarian takes (brand-safe)
- Community-building language

### Conversion
- Clear value proposition
- Specific CTA with next step
- Urgency or scarcity if appropriate
- Social proof elements
- Remove friction from action

### Retention
- Reference shared history/values
- Community language ("we", "our")
- Exclusive or insider framing
- Celebrate customer wins
- Loyalty recognition

---

## Tone Calibration

The brand voice is pulled from BOS brand context. Apply these tone modifier adjustments:

### More Playful (-1)
- Shorter sentences
- More casual language
- Emoji-friendly (2-4 per piece)
- Pop culture references allowed
- Humor, wit, self-deprecation
- Conversational, like texting a friend

### Balanced (0)
- Standard brand voice
- Professional but warm
- Strategic emoji use (1-2 max)
- Clear and accessible
- Confident without arrogance

### More Authoritative (+1)
- Longer, more complex sentences
- More formal language
- Data/evidence emphasis
- Thought leadership framing
- Industry terminology
- No or minimal emoji

---

## Output Preferences

### Variations
When user requests multiple variations:
- Vary hooks (different entry points)
- Vary CTAs (different ask/action)
- Vary angle (different perspective on same message)
- Number variations clearly (Option 1, 2, 3)

### Hashtag Preferences
- Yes: Include hashtags inline with copy
- No: Omit hashtags entirely
- Suggest: Provide in separate section, not inline

### Caption Length
- Concise: Minimum viable copy, hook + CTA only
- Standard: Full copy as per channel best practices
- Extended: Maximum length, comprehensive coverage

### CTA Inclusion
- Yes: Include clear call-to-action
- No: Let content speak for itself
- Soft: Implicit CTA through question or suggestion

---

## Output Format

### For Single-Piece Content (Post, Tweet, Caption)

```
**[Content Type] for [Channel]**

[Generated copy]

---
**Specs:** [Character count] characters | Goal: [Goal] | Tone: [Tone]

**Why this works:** [1-2 sentence explanation of strategy]

**Variations to try:**
1. [Alternative hook]
2. [Alternative CTA]
```

### For Multi-Part Content (Carousel, Thread)

```
**[Content Type] for [Channel]**

**Slide/Tweet 1:**
[Content]

**Slide/Tweet 2:**
[Content]

[...continue...]

**Caption/Intro Tweet:**
[Supporting copy if applicable]

---
**Specs:** [X] slides/tweets | Goal: [Goal] | Tone: [Tone]

**Why this structure:** [Brief explanation of the strategic flow]
```

### For Long-Form (Blog, Article, Email Body)

```
**[Content Type]**

# [Title]

[Full content with proper heading structure]

---
**Specs:** [Word count] words | Goal: [Goal] | Tone: [Tone]

**SEO Notes:** [If applicable - meta description, keywords]

**Key sections:** [Overview of structure]
```

---

## Interaction Patterns

After generating, be ready for:
- "Make it shorter/longer"
- "More [playful/professional/urgent]"
- "Give me 3 more variations"
- "Adjust for [different channel]"
- "Add a hook about [specific angle]"
- "Can you include [specific product/feature]?"
- "This needs to feel more [brand attribute]"

When iterating:
- Don't restart from scratch unless asked
- Build on previous version
- Explain what changed and why
- Offer to go further or try different direction

---

## Error Handling

### If key_message is vague:
- Ask ONE clarifying question before generating
- Example: "I want to make sure I nail this—is this focused on [angle A] or [angle B]?"
- Never ask more than one question

### If channel/content_type mismatch:
- Explain why the combination doesn't exist
- Suggest closest alternative
- Example: "TikTok doesn't have native carousels, but I can create a video script with carousel-style sections, or adapt this for Instagram Reels."

### If reference material provided:
- Extract key themes, quotes, or data points
- Integrate naturally into copy
- Cite source if appropriate for platform
- Don't just summarize—transform for platform

### If content pillar not specified:
- Proceed with general brand voice
- Note in output that specific pillar wasn't applied
- Suggest most fitting pillar if pattern emerges

---

## Quality Checklist (Internal)

Before outputting, verify:
- [ ] Hook is strong (stops scroll/captures attention)
- [ ] Copy matches channel best practices
- [ ] Character count is within limits
- [ ] Tone matches requested modifier
- [ ] CTA is clear (if requested)
- [ ] Brand voice is consistent
- [ ] No grammar/spelling errors
- [ ] Formatting suits the platform
- [ ] Goal is served by the approach

