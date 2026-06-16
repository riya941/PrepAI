const fillerWords = [
  "um",
  "uh",
  "like",
  "you know",
  "basically",
  "actually",
  "sort of",
  "kind of",
  "i mean",
];

const hesitationWords = [
  "maybe",
  "probably",
  "i guess",
  "not sure",
  "i think",
];

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const countPhraseMatches = (text, phrases) =>
  phrases.reduce((total, phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = text.match(new RegExp(`\\b${escaped}\\b`, "gi"));
    return total + (matches?.length || 0);
  }, 0);

const countRepeatedAdjacentWords = (words) => {
  let repeats = 0;

  for (let i = 1; i < words.length; i += 1) {
    if (words[i] === words[i - 1]) repeats += 1;
  }

  return repeats;
};

export const analyzeVoiceConfidence = (text, durationSeconds = 0) => {
  const words = tokenize(text);
  const wordCount = words.length;
  const uniqueWords = new Set(words).size;
  const lowerText = text.toLowerCase();
  const fillerCount = countPhraseMatches(lowerText, fillerWords);
  const hesitationCount = countPhraseMatches(lowerText, hesitationWords);
  const repeatedWords = countRepeatedAdjacentWords(words);
  const vocabularyRichness = wordCount ? uniqueWords / wordCount : 0;
  const wordsPerMinute =
    durationSeconds > 0 ? Math.round(wordCount / (durationSeconds / 60)) : 0;

  let score = 82;

  score -= fillerCount * 5;
  score -= hesitationCount * 4;
  score -= repeatedWords * 3;

  if (wordCount < 18) score -= 22;
  if (wordCount >= 45) score += 8;
  if (wordCount >= 80) score += 4;

  if (wordsPerMinute > 0 && wordsPerMinute < 90) score -= 8;
  if (wordsPerMinute > 175) score -= 8;
  if (wordsPerMinute >= 110 && wordsPerMinute <= 155) score += 6;

  if (vocabularyRichness < 0.45 && wordCount > 20) score -= 8;
  if (vocabularyRichness > 0.68 && wordCount > 20) score += 6;

  return {
    score: clamp(score),
    metrics: {
      wordCount,
      fillerCount,
      hesitationCount,
      repeatedWords,
      vocabularyRichness: Number(vocabularyRichness.toFixed(2)),
      wordsPerMinute,
      durationSeconds: Math.round(durationSeconds),
    },
  };
};

export const analyzeFacialConfidence = (signals = {}) => {
  const {
    cameraActive = false,
    faceVisible = false,
    lookingAwayEvents = 0,
    headMovementEvents = 0,
  } = signals;

  if (!cameraActive) {
    return {
      score: 50,
      metrics: {
        cameraActive,
        faceVisible,
        lookingAwayEvents,
        headMovementEvents,
        engagementLevel: "unknown",
      },
    };
  }

  let score = faceVisible ? 76 : 48;
  score -= lookingAwayEvents * 4;
  score -= headMovementEvents * 2;
  if (faceVisible && lookingAwayEvents <= 1) score += 12;

  const finalScore = clamp(score);

  return {
    score: finalScore,
    metrics: {
      cameraActive,
      faceVisible,
      lookingAwayEvents,
      headMovementEvents,
      engagementLevel:
        finalScore >= 80 ? "high" : finalScore >= 60 ? "steady" : "needs attention",
    },
  };
};

export const buildConfidenceSnapshot = ({
  question,
  answer,
  durationSeconds,
  facialSignals,
}) => {
  const voice = analyzeVoiceConfidence(answer, durationSeconds);
  const facial = analyzeFacialConfidence(facialSignals);
  const overallConfidence = clamp(voice.score * 0.6 + facial.score * 0.4);

  return {
    question,
    confidence: overallConfidence,
    voiceConfidence: voice.score,
    facialConfidence: facial.score,
    overallConfidence,
    metrics: {
      voice: voice.metrics,
      facial: facial.metrics,
    },
  };
};

export const averageConfidence = (history = []) => {
  if (!history.length) return 0;

  const total = history.reduce(
    (sum, item) => sum + Number(item.overallConfidence ?? item.confidence ?? 0),
    0
  );

  return Math.round(total / history.length);
};
