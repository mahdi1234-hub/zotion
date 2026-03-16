export interface VaultDocument {
  id: string;
  name: string;
  title: string;
  description: string;
  tags: string[];
  fileSize: number;
  fileType: string;
  uploadDate: string;
  thumbnailUrl: string | null;
  fileUrl: string;
  file: File;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "need", "dare",
  "ought", "used", "it", "its", "this", "that", "these", "those",
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you",
  "your", "yours", "yourself", "yourselves", "he", "him", "his",
  "himself", "she", "her", "hers", "herself", "they", "them", "their",
  "theirs", "themselves", "what", "which", "who", "whom", "when",
  "where", "why", "how", "all", "each", "every", "both", "few", "more",
  "most", "other", "some", "such", "no", "nor", "not", "only", "own",
  "same", "so", "than", "too", "very", "just", "because", "as", "until",
  "while", "about", "between", "through", "during", "before", "after",
  "above", "below", "up", "down", "out", "off", "over", "under", "again",
  "further", "then", "once", "here", "there", "also", "into", "if",
  "any", "new", "one", "two", "three", "per", "based", "using", "use",
  "many", "much", "well", "still", "since", "even", "make", "like",
  "get", "go", "see", "come", "take", "know", "think", "say", "give",
  "find", "tell", "ask", "seem", "feel", "try", "call", "keep",
  "let", "begin", "show", "hear", "play", "run", "move", "live",
  "believe", "bring", "happen", "write", "provide", "sit", "stand",
  "lose", "pay", "meet", "include", "continue", "set", "learn",
  "change", "lead", "understand", "watch", "follow", "stop", "create",
  "speak", "read", "allow", "add", "spend", "grow", "open", "walk",
  "win", "offer", "remember", "love", "consider", "appear", "buy",
  "wait", "serve", "die", "send", "expect", "build", "stay", "fall",
  "cut", "reach", "kill", "remain", "suggest", "raise", "pass",
  "sell", "require", "report", "decide", "pull", "however", "therefore",
  "thus", "hence", "although", "though", "whether", "yet", "already",
  "rather", "quite", "enough", "almost", "perhaps", "certainly",
  "probably", "actually", "really", "simply", "often", "never",
  "always", "sometimes", "together", "likely", "merely", "along",
  "apparently", "increasingly", "significantly", "particularly",
]);

const DOMAIN_KEYWORDS: [string, string[]][] = [
  ["Report", ["report", "analysis", "assessment", "evaluation", "review", "summary", "overview", "importance"]],
  ["Solar Energy", ["solar", "sunlight", "solar panel"]],
  ["Renewable Energy", ["renewable", "clean energy", "green energy", "sustainable energy", "wind", "hydro", "geothermal"]],
  ["Sustainability", ["sustainable", "sustainability", "eco-friendly"]],
  ["Photovoltaic", ["photovoltaic", "pv system", "pv ", "solar cell", "solar module"]],
  ["Environmental", ["environment", "environmental", "pollution", "emissions", "carbon", "greenhouse", "climate"]],
  ["Climate Change", ["climate change", "global warming", "carbon dioxide", "co2"]],
  ["Energy Storage", ["battery", "energy storage", "storage system", "lithium"]],
  ["Finance", ["financial", "finance", "investment", "revenue", "budget", "profit", "roi"]],
  ["Technology", ["technology", "software", "hardware", "digital", "computing", "algorithm", "ai", "machine learning"]],
  ["Healthcare", ["health", "medical", "clinical", "patient", "hospital", "disease", "treatment", "diagnosis"]],
  ["Education", ["education", "student", "school", "university", "academic", "curriculum", "teaching"]],
  ["Legal", ["legal", "law", "regulation", "compliance", "contract", "liability", "jurisdiction"]],
  ["Engineering", ["engineering", "mechanical", "electrical", "civil", "structural"]],
  ["Research", ["research", "study", "experiment", "hypothesis", "methodology", "findings"]],
];

export function generateTags(text: string, fileName: string): string[] {
  const lowerText = (text + " " + fileName).toLowerCase();
  const tags: string[] = [];

  for (const [tag, keywords] of DOMAIN_KEYWORDS) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        tags.push(tag);
        break;
      }
    }
  }

  if (tags.length < 3) {
    const words = text
      .replace(/[^a-zA-Z\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4 && !STOP_WORDS.has(w.toLowerCase()))
      .map((w) => w.toLowerCase());

    const freq: Record<string, number> = {};
    for (const w of words) {
      freq[w] = (freq[w] || 0) + 1;
    }

    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));

    for (const w of sorted) {
      if (tags.length >= 5) break;
      if (!tags.includes(w)) {
        tags.push(w);
      }
    }
  }

  return tags.slice(0, 6);
}

export function generateDescription(text: string, fileName: string): string {
  const cleanName = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const sentences = text
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && s.length < 300);

  if (sentences.length > 0) {
    const desc =
      "A comprehensive analysis of " +
      sentences[0].substring(0, 120).trim().toLowerCase();
    if (desc.length > 200) {
      return desc.substring(0, 197) + "...";
    }
    return desc + ".";
  }

  return `A comprehensive analysis of ${cleanName.toLowerCase()}.`;
}

export function generateTitle(text: string, fileName: string): string {
  const cleanName = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]/g, " ")
    .replace(/\+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const lowerText = text.toLowerCase();

  const topicPatterns: [string, string][] = [
    ["solar", "Solar Energy Systems"],
    ["renewable energy", "Renewable Energy"],
    ["machine learning", "Machine Learning"],
    ["artificial intelligence", "Artificial Intelligence"],
    ["climate change", "Climate Change"],
    ["data science", "Data Science"],
    ["blockchain", "Blockchain Technology"],
    ["cybersecurity", "Cybersecurity"],
    ["healthcare", "Healthcare Systems"],
    ["financial", "Financial Analysis"],
  ];

  for (const [keyword, topic] of topicPatterns) {
    if (lowerText.includes(keyword)) {
      return "Analysis of " + topic + ": " + cleanName;
    }
  }

  return "Analysis of " + cleanName;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "kB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(0)) + " " + sizes[i];
}

export function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
