import { ChatMessage } from "@/hooks/useAiChat";

export type AgentAction =
  | { type: "create_document"; title: string; content?: string; icon?: string }
  | { type: "navigate_document"; documentId: string }
  | { type: "list_documents" }
  | { type: "search_documents"; query: string }
  | { type: "delete_document"; documentId: string }
  | { type: "archive_document"; documentId: string }
  | { type: "set_theme"; theme: "light" | "dark" | "system" }
  | { type: "open_settings" }
  | { type: "open_search" }
  | { type: "update_document"; documentId: string; title?: string; icon?: string }
  | { type: "reply"; message: string }
  | { type: "create_notebook"; title: string; subject: string; icon?: string };

interface DocumentInfo {
  _id: string;
  title: string;
  icon?: string;
  isArchived: boolean;
}

const NOTEBOOK_TEMPLATES: Record<string, () => object[]> = {
  default: () => buildNotebookContent("General Notes", [
    { text: "Welcome to your new notebook!", color: "blue" },
    { text: "Start writing your ideas here.", color: "default" },
  ]),
  science: () => buildNotebookContent("Science Notes", [
    { text: "Scientific Observations", color: "purple", heading: 2 },
    { text: "Record your hypotheses and experiments below.", color: "default" },
    { text: "Key Concepts", color: "green", heading: 3 },
    { text: "Important formulas and principles go here.", color: "default" },
    { text: "Lab Results", color: "orange", heading: 3 },
    { text: "Document your findings and analysis.", color: "default" },
  ]),
  math: () => buildNotebookContent("Mathematics", [
    { text: "Mathematical Concepts", color: "blue", heading: 2 },
    { text: "Formulas & Equations", color: "red", heading: 3 },
    { text: "Write your equations and proofs here.", color: "default" },
    { text: "Practice Problems", color: "green", heading: 3 },
    { text: "Work through practice exercises below.", color: "default" },
    { text: "Key Theorems", color: "purple", heading: 3 },
    { text: "Important theorems and their applications.", color: "default" },
  ]),
  history: () => buildNotebookContent("History Notes", [
    { text: "Historical Events", color: "orange", heading: 2 },
    { text: "Timeline of key events and their significance.", color: "default" },
    { text: "Key Figures", color: "blue", heading: 3 },
    { text: "Important historical personalities and their contributions.", color: "default" },
    { text: "Analysis & Themes", color: "purple", heading: 3 },
    { text: "Major themes and patterns in history.", color: "default" },
  ]),
  programming: () => buildNotebookContent("Programming Notes", [
    { text: "Code & Development", color: "green", heading: 2 },
    { text: "Concepts & Patterns", color: "blue", heading: 3 },
    { text: "Document design patterns and architectural decisions.", color: "default" },
    { text: "Code Snippets", color: "orange", heading: 3 },
    { text: "Save useful code examples and references.", color: "default" },
    { text: "Debugging Notes", color: "red", heading: 3 },
    { text: "Track bugs and their solutions.", color: "default" },
  ]),
  "project-plan": () => buildNotebookContent("Project Plan", [
    { text: "Project Overview", color: "blue", heading: 2 },
    { text: "Describe the project goals and scope.", color: "default" },
    { text: "Milestones", color: "green", heading: 3 },
    { text: "List key milestones and deadlines.", color: "default" },
    { text: "Tasks", color: "orange", heading: 3 },
    { text: "Break down the work into actionable tasks.", color: "default" },
    { text: "Resources", color: "purple", heading: 3 },
    { text: "Team members, tools, and references.", color: "default" },
  ]),
  meeting: () => buildNotebookContent("Meeting Notes", [
    { text: "Meeting Agenda", color: "blue", heading: 2 },
    { text: "List the topics to be discussed.", color: "default" },
    { text: "Discussion Points", color: "green", heading: 3 },
    { text: "Key discussion items and decisions.", color: "default" },
    { text: "Action Items", color: "red", heading: 3 },
    { text: "Tasks assigned with owners and deadlines.", color: "default" },
    { text: "Follow-up", color: "orange", heading: 3 },
    { text: "Next steps and follow-up dates.", color: "default" },
  ]),
  recipe: () => buildNotebookContent("Recipe Collection", [
    { text: "Recipe Details", color: "orange", heading: 2 },
    { text: "Ingredients", color: "green", heading: 3 },
    { text: "List all ingredients with quantities.", color: "default" },
    { text: "Instructions", color: "blue", heading: 3 },
    { text: "Step-by-step cooking instructions.", color: "default" },
    { text: "Tips & Notes", color: "purple", heading: 3 },
    { text: "Additional tips and variations.", color: "default" },
  ]),
  fitness: () => buildNotebookContent("Fitness Tracker", [
    { text: "Workout Plan", color: "red", heading: 2 },
    { text: "Exercises", color: "blue", heading: 3 },
    { text: "List your exercises, sets, and reps.", color: "default" },
    { text: "Progress Log", color: "green", heading: 3 },
    { text: "Track your progress over time.", color: "default" },
    { text: "Nutrition Notes", color: "orange", heading: 3 },
    { text: "Meal plans and dietary notes.", color: "default" },
  ]),
  travel: () => buildNotebookContent("Travel Planner", [
    { text: "Trip Details", color: "blue", heading: 2 },
    { text: "Destination, dates, and budget overview.", color: "default" },
    { text: "Itinerary", color: "green", heading: 3 },
    { text: "Day-by-day plan of activities.", color: "default" },
    { text: "Packing List", color: "orange", heading: 3 },
    { text: "Essential items to bring.", color: "default" },
    { text: "Bookings & Reservations", color: "purple", heading: 3 },
    { text: "Hotels, flights, and restaurant reservations.", color: "default" },
  ]),
};

interface ContentItem {
  text: string;
  color: string;
  heading?: number;
}

function buildNotebookContent(_title: string, items: ContentItem[]): object[] {
  const blocks: object[] = [];

  for (const item of items) {
    if (item.heading) {
      blocks.push({
        type: "heading",
        props: {
          textColor: item.color !== "default" ? item.color : "default",
          backgroundColor: "default",
          textAlignment: "left",
          level: item.heading,
        },
        content: [{ type: "text", text: item.text, styles: { bold: true } }],
        children: [],
      });
    } else {
      blocks.push({
        type: "paragraph",
        props: {
          textColor: item.color !== "default" ? item.color : "default",
          backgroundColor: "default",
          textAlignment: "left",
        },
        content: [{ type: "text", text: item.text, styles: {} }],
        children: [],
      });
    }
  }

  // Add trailing empty paragraph
  blocks.push({
    type: "paragraph",
    props: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [],
    children: [],
  });

  return blocks;
}

function getSubjectTemplate(subject: string): object[] {
  const lower = subject.toLowerCase();

  for (const [key, builder] of Object.entries(NOTEBOOK_TEMPLATES)) {
    if (lower.includes(key)) {
      return builder();
    }
  }

  // Check for common keywords
  if (lower.includes("code") || lower.includes("dev") || lower.includes("software")) {
    return NOTEBOOK_TEMPLATES["programming"]();
  }
  if (lower.includes("cook") || lower.includes("food") || lower.includes("meal")) {
    return NOTEBOOK_TEMPLATES["recipe"]();
  }
  if (lower.includes("work out") || lower.includes("exercise") || lower.includes("gym")) {
    return NOTEBOOK_TEMPLATES["fitness"]();
  }
  if (lower.includes("trip") || lower.includes("vacation") || lower.includes("journey")) {
    return NOTEBOOK_TEMPLATES["travel"]();
  }
  if (lower.includes("plan") || lower.includes("project") || lower.includes("roadmap")) {
    return NOTEBOOK_TEMPLATES["project-plan"]();
  }

  // Generate custom template for unknown subjects
  return buildNotebookContent(subject, [
    { text: `${capitalize(subject)} - Overview`, color: "blue", heading: 2 },
    { text: `Welcome to your ${subject} notebook. Start organizing your thoughts here.`, color: "default" },
    { text: "Key Points", color: "green", heading: 3 },
    { text: "Add the most important information and concepts.", color: "default" },
    { text: "Notes & Details", color: "purple", heading: 3 },
    { text: "Expand on your ideas with detailed notes.", color: "default" },
    { text: "References & Resources", color: "orange", heading: 3 },
    { text: "Links, books, and other reference materials.", color: "default" },
  ]);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const SUBJECT_ICONS: Record<string, string> = {
  science: "\ud83d\udd2c",
  math: "\ud83d\udcca",
  history: "\ud83c\udfdb\ufe0f",
  programming: "\ud83d\udcbb",
  code: "\ud83d\udcbb",
  recipe: "\ud83c\udf73",
  cook: "\ud83c\udf73",
  fitness: "\ud83c\udfcb\ufe0f",
  travel: "\u2708\ufe0f",
  meeting: "\ud83d\udcc5",
  project: "\ud83d\udcc1",
  music: "\ud83c\udfb5",
  art: "\ud83c\udfa8",
  book: "\ud83d\udcda",
  study: "\ud83d\udcd6",
  language: "\ud83c\udf0d",
  business: "\ud83d\udcbc",
  marketing: "\ud83d\udce2",
  design: "\ud83c\udfa8",
  writing: "\u270d\ufe0f",
  journal: "\ud83d\udcd3",
  diary: "\ud83d\udcd4",
  todo: "\u2705",
  task: "\u2705",
  idea: "\ud83d\udca1",
  brainstorm: "\ud83e\udde0",
  philosophy: "\ud83e\udd14",
  psychology: "\ud83e\udde0",
  economics: "\ud83d\udcb0",
  finance: "\ud83d\udcb0",
  health: "\ud83c\udfe5",
  medicine: "\ud83d\udc8a",
  biology: "\ud83e\uddec",
  chemistry: "\u2697\ufe0f",
  physics: "\u269b\ufe0f",
  engineering: "\u2699\ufe0f",
  default: "\ud83d\udcdd",
};

function getIconForSubject(subject: string): string {
  const lower = subject.toLowerCase();
  for (const [key, icon] of Object.entries(SUBJECT_ICONS)) {
    if (lower.includes(key)) {
      return icon;
    }
  }
  return SUBJECT_ICONS.default;
}

export function parseUserMessage(
  message: string,
  documents: DocumentInfo[] = [],
): AgentAction {
  const lower = message.toLowerCase().trim();

  // Theme commands
  if (
    lower.includes("dark mode") ||
    lower.includes("switch to dark") ||
    lower.includes("enable dark") ||
    lower.includes("turn on dark") ||
    lower === "dark"
  ) {
    return { type: "set_theme", theme: "dark" };
  }
  if (
    lower.includes("light mode") ||
    lower.includes("switch to light") ||
    lower.includes("enable light") ||
    lower.includes("turn on light") ||
    lower === "light"
  ) {
    return { type: "set_theme", theme: "light" };
  }
  if (
    lower.includes("system theme") ||
    lower.includes("auto theme") ||
    lower.includes("switch to system")
  ) {
    return { type: "set_theme", theme: "system" };
  }
  if (
    lower.includes("toggle theme") ||
    lower.includes("switch theme") ||
    lower.includes("change theme")
  ) {
    return { type: "set_theme", theme: "dark" };
  }

  // Settings commands
  if (
    lower.includes("open settings") ||
    lower.includes("show settings") ||
    lower.includes("settings") ||
    lower.includes("preferences") ||
    lower.includes("configuration")
  ) {
    return { type: "open_settings" };
  }

  // Search commands
  if (
    lower.includes("open search") ||
    lower.includes("search for") ||
    lower.includes("find document") ||
    lower.includes("find note") ||
    lower.includes("search document")
  ) {
    const searchMatch = lower.match(
      /(?:search for|find|look for|search)\s+(?:document|note|page)?\s*[:\-]?\s*(.+)/i,
    );
    if (searchMatch) {
      return { type: "search_documents", query: searchMatch[1].trim() };
    }
    return { type: "open_search" };
  }

  // Create notebook commands
  if (
    lower.includes("create a notebook") ||
    lower.includes("create notebook") ||
    lower.includes("make a notebook") ||
    lower.includes("new notebook") ||
    lower.includes("create a note about") ||
    lower.includes("create note about") ||
    lower.includes("make a note about") ||
    lower.includes("write a note about") ||
    lower.includes("create a page about") ||
    lower.includes("make a page about") ||
    lower.includes("notebook about") ||
    lower.includes("notebook on") ||
    lower.includes("create a document about") ||
    lower.includes("note about") ||
    lower.includes("page about")
  ) {
    const subjectMatch = message.match(
      /(?:about|on|for|titled|called|named)\s+(.+?)(?:\s*$|\s+with|\s+and|\s+that)/i,
    );
    const subject = subjectMatch ? subjectMatch[1].trim().replace(/['"]/g, "") : "General";
    const icon = getIconForSubject(subject);
    return {
      type: "create_notebook",
      title: capitalize(subject),
      subject: subject.toLowerCase(),
      icon,
    };
  }

  // Create document/page commands
  if (
    lower.includes("create a") ||
    lower.includes("create new") ||
    lower.includes("make a") ||
    lower.includes("new page") ||
    lower.includes("new document") ||
    lower.includes("new note") ||
    lower.includes("add a page") ||
    lower.includes("add page") ||
    lower.includes("add a note") ||
    lower.includes("add note")
  ) {
    const titleMatch = message.match(
      /(?:create|make|add|new)\s+(?:a\s+)?(?:new\s+)?(?:page|document|note)?\s*(?:called|named|titled)?\s*[:\-]?\s*['""]?(.+?)['""]?\s*$/i,
    );
    const title = titleMatch ? titleMatch[1].trim().replace(/['"]/g, "") : "Untitled";
    return { type: "create_document", title };
  }

  // List/browse documents commands
  if (
    lower.includes("list") ||
    lower.includes("show all") ||
    lower.includes("browse") ||
    lower.includes("show documents") ||
    lower.includes("show notes") ||
    lower.includes("show pages") ||
    lower.includes("my documents") ||
    lower.includes("my notes") ||
    lower.includes("my pages") ||
    lower.includes("what documents") ||
    lower.includes("what notes") ||
    lower.includes("what pages") ||
    lower.includes("workspace")
  ) {
    return { type: "list_documents" };
  }

  // Navigate to document
  if (
    lower.includes("open") ||
    lower.includes("go to") ||
    lower.includes("navigate to") ||
    lower.includes("show me")
  ) {
    const nameMatch = message.match(
      /(?:open|go to|navigate to|show me)\s+(?:the\s+)?(?:document|page|note)?\s*[:\-]?\s*['""]?(.+?)['""]?\s*$/i,
    );
    if (nameMatch) {
      const target = nameMatch[1].trim().toLowerCase();
      const found = documents.find(
        (d) =>
          d.title.toLowerCase().includes(target) ||
          target.includes(d.title.toLowerCase()),
      );
      if (found) {
        return { type: "navigate_document", documentId: found._id };
      }
      return {
        type: "reply",
        message: `I couldn't find a document matching "${nameMatch[1].trim()}". Try listing your documents first.`,
      };
    }
  }

  // Delete/archive commands
  if (
    lower.includes("delete") ||
    lower.includes("remove") ||
    lower.includes("archive") ||
    lower.includes("trash")
  ) {
    const nameMatch = message.match(
      /(?:delete|remove|archive|trash)\s+(?:the\s+)?(?:document|page|note)?\s*[:\-]?\s*['""]?(.+?)['""]?\s*$/i,
    );
    if (nameMatch) {
      const target = nameMatch[1].trim().toLowerCase();
      const found = documents.find(
        (d) =>
          d.title.toLowerCase().includes(target) ||
          target.includes(d.title.toLowerCase()),
      );
      if (found) {
        return { type: "archive_document", documentId: found._id };
      }
      return {
        type: "reply",
        message: `I couldn't find a document matching "${nameMatch[1].trim()}" to delete.`,
      };
    }
  }

  // Help command
  if (lower === "help" || lower.includes("what can you do") || lower.includes("how to use")) {
    return {
      type: "reply",
      message:
        "I can help you with your Zotion workspace! Here's what I can do:\n\n" +
        "\u2022 **Create notebooks**: \"Create a notebook about [subject]\"\n" +
        "\u2022 **Create pages**: \"Create a new page called [name]\"\n" +
        "\u2022 **Browse workspace**: \"List my documents\" or \"Browse workspace\"\n" +
        "\u2022 **Navigate**: \"Open [document name]\"\n" +
        "\u2022 **Search**: \"Search for [query]\"\n" +
        "\u2022 **Theme**: \"Switch to dark mode\" or \"Switch to light mode\"\n" +
        "\u2022 **Settings**: \"Open settings\"\n" +
        "\u2022 **Delete**: \"Delete [document name]\"\n\n" +
        "Just type what you'd like to do!",
    };
  }

  // Greeting
  if (
    lower === "hi" ||
    lower === "hello" ||
    lower === "hey" ||
    lower.includes("good morning") ||
    lower.includes("good afternoon") ||
    lower.includes("good evening")
  ) {
    return {
      type: "reply",
      message:
        "Hello! I'm your Zotion AI assistant. I can help you create notebooks, navigate your workspace, switch themes, and more. Type **help** to see all my capabilities!",
    };
  }

  // Clear chat
  if (lower === "clear" || lower === "clear chat" || lower.includes("clear history")) {
    return {
      type: "reply",
      message: "Chat cleared! How can I help you?",
    };
  }

  // Fallback
  return {
    type: "reply",
    message:
      `I'm not sure how to help with that. Here are some things I can do:\n\n` +
      `\u2022 "Create a notebook about [subject]"\n` +
      `\u2022 "List my documents"\n` +
      `\u2022 "Switch to dark/light mode"\n` +
      `\u2022 "Open settings"\n` +
      `\u2022 "Open [document name]"\n\n` +
      `Type **help** for more details!`,
  };
}

export function getNotebookContent(subject: string): string {
  const blocks = getSubjectTemplate(subject);
  return JSON.stringify(blocks, null, 2);
}
