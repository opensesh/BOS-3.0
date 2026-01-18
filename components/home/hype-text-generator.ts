/**
 * Hype Text Generator
 * Generates professional but warm phrases for the engage state
 * when users start typing in the chat input.
 */

// Openers - energizing without being cheesy
const hypeOpeners = [
  "Ready to create",
  "Let's get started",
  "Time to build",
  "Ready when you are",
  "Let's make it happen",
  "Here to help",
  "Let's dive in",
  "Ready to go",
];

// Actions - follow-up questions that are inquisitive
const hypeActions = [
  "What's the plan?",
  "What are we working on?",
  "What can I help with?",
  "Where should we start?",
  "What's on your mind?",
  "What are we building?",
  "What's the goal?",
  "What do you need?",
];

/**
 * Get a random item from an array
 */
function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a single hype phrase with opener and action
 */
export function generateHypePhrase(): { opener: string; action: string } {
  return {
    opener: getRandomItem(hypeOpeners),
    action: getRandomItem(hypeActions),
  };
}

/**
 * Generate multiple unique hype phrases (useful for preloading)
 */
export function generateHypeSet(count: number = 5): Array<{ opener: string; action: string }> {
  const set: Array<{ opener: string; action: string }> = [];
  const usedOpeners = new Set<string>();
  const usedActions = new Set<string>();

  // Ensure we don't exceed available unique combinations
  const maxUnique = Math.min(count, hypeOpeners.length, hypeActions.length);

  while (set.length < maxUnique) {
    const opener = getRandomItem(hypeOpeners);
    const action = getRandomItem(hypeActions);

    // Avoid duplicates
    if (!usedOpeners.has(opener) && !usedActions.has(action)) {
      usedOpeners.add(opener);
      usedActions.add(action);
      set.push({ opener, action });
    }
  }

  return set;
}
