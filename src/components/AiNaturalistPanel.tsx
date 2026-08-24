import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { askNaturalist, getChatSettings, type ChatSettings } from "../services/aiNaturalist";
import { getSettings } from "../services/cache";
import { BinocularsIcon, BrainSparkIcon, HistoryIcon } from "./icons";
import { animals } from "../data/animals";
import type { Animal } from "../types/animal";
import { marked } from "marked";
import katex from "katex";
import { toastService } from "../services/toastService";
import {
  type ChatEntry,
  type ChatSession,
  getChatSessions,
  getActiveSession,
  getActiveSessionId,
  setActiveSessionId,
  updateCurrentSessionMessages,
  deleteChatSession,
  clearAllChatSessions,
  formatSessionTime,
} from "../services/chatHistoryService";

const promptChips = [
  "Compare the African lion and cheetah as savanna predators.",
  "Which endangered species in Biblos are tied to wetlands or estuaries?",
  "Explain where the giant Pacific octopus sits in the tree of life.",
  "Which biomes in Biblos fit the bottlenose dolphin best?",
  "Show me mountain species and explain how their habitats differ.",
];

function renderMarkdownAndMath(text: string): string {
  const mathBlocks: string[] = [];
  let processed = text;

  // 1. Extract block math $$...$$
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
      });
      const placeholder = `__MATH_BLOCK_${mathBlocks.length}__`;
      mathBlocks.push(rendered);
      return placeholder;
    } catch (err) {
      return _;
    }
  });

  // 2. Extract inline math $...$
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
      });
      const placeholder = `__MATH_BLOCK_${mathBlocks.length}__`;
      mathBlocks.push(rendered);
      return placeholder;
    } catch (err) {
      return _;
    }
  });

  // 3. Parse markdown with custom image rendering to prevent broken image urls
  const renderer = new marked.Renderer();
  renderer.image = (hrefOrObj: any, title?: any, text?: any) => {
    let href = "";
    let altText = "";
    let imgTitle = "";
    
    if (typeof hrefOrObj === "object" && hrefOrObj !== null) {
      href = hrefOrObj.href || "";
      altText = hrefOrObj.text || "";
      imgTitle = hrefOrObj.title || "";
    } else {
      href = hrefOrObj || "";
      altText = text || "";
      imgTitle = title || "";
    }

    if (!href || href.includes("undefined") || href.includes("null") || (!href.startsWith("http") && !href.startsWith("/"))) {
      return "";
    }
    return `<img src="${href}" alt="${altText}" title="${imgTitle}" class="rounded-xl border border-white/10 my-3 max-h-72 w-auto max-w-full object-contain shadow-md" onerror="this.style.display='none'" />`;
  };

  let html = marked.parse(processed, { renderer, async: false }) as string;

  // 4. Restore math HTML
  mathBlocks.forEach((mathHtml, index) => {
    html = html.replace(`__MATH_BLOCK_${index}__`, mathHtml);
  });

  return html;
}

function parseResponseAndFollowups(text: string): { content: string; followups: string[] } {
  const parts = text.split(/\[FOLLOWUP\]/i);
  const content = parts[0].trim();
  const followups: string[] = [];

  if (parts.length > 1) {
    const lines = parts[1].split("\n");
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match) {
        followups.push(match[1].trim());
      }
    }
  }

  return { content, followups: followups.slice(0, 3) };
}

export function AiNaturalistPanel({
  initialPrompt = "",
  speciesName = "",
}: {
  initialPrompt?: string;
  speciesName?: string;
}) {
  const settings = useMemo(() => getSettings(), []);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [history, setHistory] = useState<ChatEntry[]>(() => {
    const active = getActiveSession();
    return active ? active.messages : [];
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => getChatSessions());
  const [historyFilter, setHistoryFilter] = useState("");
  const [chatSettings, setChatSettings] = useState<ChatSettings>(() => getChatSettings());
  const [activeFollowups, setActiveFollowups] = useState<string[]>(() => {
    const active = getActiveSession();
    if (active && active.messages.length > 0) {
      const lastAssistant = active.messages.filter((m) => m.role === "assistant").pop();
      return lastAssistant?.followups || [];
    }
    return [];
  });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleHistoryUpdate = () => {
      setChatSessions(getChatSessions());
    };
    window.addEventListener("biblos-chat-history-updated", handleHistoryUpdate);
    return () => window.removeEventListener("biblos-chat-history-updated", handleHistoryUpdate);
  }, []);

  const saveSettings = (updated: Partial<ChatSettings>) => {
    const next = { ...chatSettings, ...updated };
    setChatSettings(next);
    window.localStorage.setItem("biblos.chat-settings", JSON.stringify(next));
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, busy]);

  const matchedAnimal = useMemo(() => {
    if (!speciesName) return null;
    const cleanName = speciesName.trim().toLowerCase();
    
    // Check local animals first
    const local = animals.find(
      (a) =>
        a.commonName.toLowerCase() === cleanName ||
        a.id.toLowerCase() === cleanName ||
        a.scientificName.toLowerCase() === cleanName
    );
    if (local) return local;

    // Check localStorage cache
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith("biblos.species.")) {
          try {
            const cached = JSON.parse(window.localStorage.getItem(key) || "") as Animal;
            if (
              cached &&
              (cached.commonName.toLowerCase() === cleanName ||
                cached.id.toLowerCase() === cleanName ||
                cached.scientificName.toLowerCase() === cleanName)
            ) {
              return cached;
            }
          } catch {
            // ignore
          }
        }
      }
    }
    return null;
  }, [speciesName]);

  const matchedAnimalContext = useMemo(() => {
    if (!matchedAnimal) return "";
    const imagesList = [
      ...(matchedAnimal.heroImage ? [matchedAnimal.heroImage] : []),
      ...matchedAnimal.images,
    ].filter(Boolean);
    return [
      `[SPECIES] Species: ${matchedAnimal.commonName} (${matchedAnimal.scientificName})`,
      `Taxonomy: ${matchedAnimal.classification.kingdom} > ${matchedAnimal.classification.phylum} > ${matchedAnimal.classification.className} > ${matchedAnimal.classification.order} > ${matchedAnimal.classification.family} > ${matchedAnimal.classification.genus} > ${matchedAnimal.classification.species}`,
      `Summary: ${matchedAnimal.shortDescription}`,
      `Detail: ${matchedAnimal.detailedDescription}`,
      `Habitats: ${matchedAnimal.habitat.join(", ")}`,
      `Diet: ${matchedAnimal.diet}`,
      `Activity: ${matchedAnimal.activityPattern}`,
      `Continents: ${matchedAnimal.continents.join(", ")}`,
      `Conservation: ${matchedAnimal.conservationStatus}`,
      `Facts: ${matchedAnimal.coolFacts.join(" ")}`,
      imagesList.length > 0 ? `Images: ${imagesList.join(", ")}` : "",
    ].filter(Boolean).join("\n");
  }, [matchedAnimal]);

  function handleNewChat() {
    setActiveSessionId(null);
    setHistory([]);
    setPrompt("");
    setError("");
    setActiveFollowups([]);
    setShowHistory(false);
    toastService.success("Started a new chat session.");
  }

  function handleSelectSession(session: ChatSession) {
    setActiveSessionId(session.id);
    setHistory(session.messages);
    setPrompt("");
    setError("");
    const lastAssistant = session.messages.filter((m) => m.role === "assistant").pop();
    setActiveFollowups(lastAssistant?.followups || []);
    setShowHistory(false);
    toastService.success(`Loaded chat: "${session.title}"`);
  }

  function handleDeleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    deleteChatSession(id);
    if (getActiveSessionId() === id) {
      handleNewChat();
    } else {
      toastService.info("Chat deleted.");
    }
  }

  function handleClearAllSessions() {
    clearAllChatSessions();
    handleNewChat();
    toastService.info("Cleared all chat history.");
  }

  async function submit(nextPrompt: string) {
    const clean = nextPrompt.trim();
    if (!clean || busy) {
      return;
    }

    const previousPrompt = prompt;
    setBusy(true);
    setError("");
    setPrompt("");
    setActiveFollowups([]);

    const userEntry: ChatEntry = { role: "user", content: clean };
    const updatedWithUser = [...history, userEntry];
    setHistory(updatedWithUser);
    updateCurrentSessionMessages(updatedWithUser, speciesName);

    try {
      const response = await askNaturalist({
        question: clean,
        history: history.map(({ role, content }) => ({ role, content })),
        apiKey: settings.groqApiKey,
        model: settings.aiModel,
        extraContext: matchedAnimalContext,
      });

      const parsed = parseResponseAndFollowups(response.answer);
      const assistantEntry: ChatEntry = {
        role: "assistant",
        content: parsed.content,
        refs: response.contextHits.map((hit) => ({
          id: hit.id,
          title: hit.title,
          kind: hit.kind,
          excerpt: hit.excerpt,
        })),
        followups: parsed.followups,
      };

      const updatedFull = [...updatedWithUser, assistantEntry];
      setHistory(updatedFull);
      setActiveFollowups(parsed.followups);
      updateCurrentSessionMessages(updatedFull, speciesName);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to reach AI Naturalist.");
      setPrompt(previousPrompt);
      setHistory(history);
      updateCurrentSessionMessages(history, speciesName);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!initialPrompt) {
      return;
    }
    if (history.length > 0) {
      return;
    }
    void submit(initialPrompt);
  }, [history.length, initialPrompt]);

  return (
    <section
      className={[
        isFullscreen
          ? "fixed inset-0 z-[150] h-screen w-screen bg-[#070a08] p-6 md:p-8 flex flex-col rounded-none border-none"
          : "flex-1 min-h-0 flex flex-col w-full px-1 py-2",
      ].join(" ")}
    >
      {/* Session Toolbar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <BrainSparkIcon className="h-4 w-4 text-app-accent" />
          <span className="text-xs uppercase tracking-[0.2em] text-app-soft font-semibold">
            {isFullscreen ? "AI Naturalist • Fullscreen Session" : "Naturalist Session"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleNewChat}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-app-soft hover:bg-white/[0.06] hover:text-white transition cursor-pointer"
            title="New Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>

          {/* History Button */}
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-app-soft hover:bg-white/[0.06] hover:text-white transition cursor-pointer"
            title="Chat History"
          >
            <HistoryIcon className="h-4 w-4" />
            {chatSessions.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-app-accent px-1 text-[9px] font-bold text-black shadow-sm">
                {chatSessions.length > 99 ? "99+" : chatSessions.length}
              </span>
            )}
          </button>

          {history.length > 0 && (
            /* Copy Transcript Button */
            <button
              type="button"
              onClick={() => {
                const text = history
                  .map((entry) => `${entry.role === "user" ? "You" : "AI Naturalist"}:\n${entry.content}`)
                  .join("\n\n");
                void navigator.clipboard.writeText(text);
                toastService.success("Transcript copied to clipboard!");
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-app-soft hover:bg-white/[0.06] hover:text-white transition cursor-pointer"
              title="Copy Transcript"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          )}

          {/* Chat Settings Button */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-app-soft hover:bg-white/[0.06] hover:text-white transition cursor-pointer"
            title="Chat Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-app-soft hover:bg-white/[0.06] hover:text-white transition cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            )}
          </button>
        </div>
      </div>

      <div className={[
        "flex-1 min-h-0",
        matchedAnimal ? "grid gap-5 xl:grid-cols-[1fr_20rem]" : "flex flex-col"
      ].join(" ")}>
        <div className="flex flex-col h-full justify-between flex-1 min-h-0">
          {/* Welcoming state or prompt suggestions */}
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center max-w-2xl mx-auto flex-1 justify-center">
              <div className="h-12 w-12 rounded-2xl bg-app-accent/10 flex items-center justify-center border border-app-accent/20 mb-4 animate-pulse">
                <BrainSparkIcon className="h-6 w-6 text-app-accent" />
              </div>
              <h2 className="text-2xl font-semibold text-white tracking-wide">
                Welcome to AI Naturalist
              </h2>
              <p className="mt-3 text-sm leading-6 text-app-muted">
                A natural history assistant grounded directly in your local Biblos directory. Ask questions about species taxonomy, behaviors, or compare characteristics.
              </p>
              
              <div className="mt-8 w-full text-left">
                <span className="text-xs uppercase tracking-[0.2em] text-app-soft font-semibold block mb-3">Suggested Topics</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {promptChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className="interactive-card rounded-xl border border-white/6 bg-white/[0.02] p-4 text-left text-xs leading-5 text-app-text hover:text-white hover:bg-white/[0.05] hover:border-white/10 transition cursor-pointer"
                      onClick={() => void submit(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Scrollable chat messages area */
            <div className="flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-thin border-b border-white/5 pb-4 flex-1 min-h-0">
              {history.map((entry, index) => (
                <div
                  key={`${entry.role}-${index}`}
                  className={`flex flex-col ${entry.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={[
                      "max-w-[85%] rounded-[1.3rem] p-4 text-sm leading-6 relative group/msg",
                      entry.role === "user"
                        ? "border border-white/8 bg-white/[0.03] text-app-text rounded-tr-none"
                        : "border border-app-accent/15 bg-app-accent/8 text-app-text rounded-tl-none",
                    ].join(" ")}
                  >
                    <span className="text-[10px] uppercase tracking-[0.18em] text-app-soft block mb-1">
                      {entry.role === "assistant" ? "AI Naturalist" : "You"}
                    </span>
                    <div className="relative group/text pr-7 pb-1">
                      <div
                        className={[
                          "text-app-text prose prose-invert max-w-none [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:my-1 [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_pre]:bg-black/35 [&_pre]:p-3 [&_pre]:rounded-lg [&_code]:text-app-accent-strong [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:tracking-tight [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-5 [&_h2]:mb-2.5 [&_h2]:tracking-wide [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-2 [&_hr]:border-white/10 [&_hr]:my-5",
                          chatSettings.fontSize === "sm" ? "text-xs leading-5" :
                          chatSettings.fontSize === "lg" ? "text-base leading-7" :
                          chatSettings.fontSize === "xl" ? "text-lg leading-8" :
                          "text-sm leading-6"
                        ].join(" ")}
                        dangerouslySetInnerHTML={{ __html: renderMarkdownAndMath(entry.content) }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(entry.content);
                          toastService.success("Text copied to clipboard!");
                        }}
                        className="absolute bottom-0 right-0 opacity-30 group-hover/text:opacity-100 transition-opacity duration-150 p-1 text-app-soft hover:text-white rounded cursor-pointer"
                        title="Copy text"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      </button>
                    </div>
                    
                    {/* References */}
                    {entry.refs && entry.refs.length > 0 ? (
                      <div className="mt-3 pt-3 border-t border-white/5 w-full">
                        <span className="text-[9px] uppercase tracking-[0.18em] text-app-soft font-semibold block mb-2">
                          Grounding References:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 w-full">
                          {entry.refs.map((ref) => {
                            const linkTo =
                              ref.kind === "species"
                                ? `/species/${ref.id}`
                                : ref.kind === "biome"
                                ? `/explorer?ecosystem=${ref.id}`
                                : null;

                            const content = (
                              <div
                                className="rounded-lg border border-white/5 bg-black/35 hover:bg-black/50 p-2 text-left transition select-none flex flex-col justify-between h-full min-h-[3rem]"
                                title={`${ref.kind.toUpperCase()}: ${ref.title}`}
                              >
                                <span className="text-[8px] uppercase tracking-wider text-app-accent/80 block truncate">
                                  {ref.kind}
                                </span>
                                <span className="text-[11px] font-medium text-white truncate block mt-0.5">
                                  {ref.title}
                                </span>
                              </div>
                            );

                            return linkTo ? (
                              <Link key={ref.id} to={linkTo} className="hover:no-underline block">
                                {content}
                              </Link>
                            ) : (
                              <div key={ref.id}>{content}</div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex flex-col items-start animate-fade-in">
                  <div className="max-w-[85%] rounded-[1.3rem] p-4 text-sm leading-6 border border-app-accent/15 bg-app-accent/8 text-app-text rounded-tl-none">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-app-soft block mb-1.5 select-none">
                      AI Naturalist
                    </span>
                    <div className="flex items-center gap-1.5 py-2 px-1">
                      <span className="h-2 w-2 rounded-full bg-app-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-app-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-app-accent animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Follow-up Questions */}
          {!busy && activeFollowups.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 animate-fade-in px-1 shrink-0">
              {activeFollowups.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveFollowups([]);
                    void submit(q);
                  }}
                  className="interactive-card rounded-full border border-app-accent/25 bg-app-accent/5 hover:bg-app-accent/12 hover:border-app-accent/50 px-3.5 py-1.5 text-xs text-app-accent-strong cursor-pointer transition duration-150 select-none text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <div className="relative mt-4 shrink-0">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (!busy) {
                    void submit(prompt);
                  }
                }
              }}
              disabled={busy}
              placeholder={busy ? "AI Naturalist is thinking..." : "Ask about an animal, a branch of the tree, a biome, or compare species..."}
              rows={1}
              className="w-full rounded-[1.25rem] border border-white/8 bg-black/20 pl-4 pr-32 py-3.5 text-sm text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent/25 transition resize-none min-h-[3rem] max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {prompt.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setPrompt("")}
                  className="text-xs text-app-soft hover:text-white px-2 py-1 transition cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                className="bg-app-accent hover:bg-app-accent-strong text-[#090d0a] font-semibold text-xs py-1.5 px-3.5 rounded-lg cursor-pointer transition duration-150 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed h-8"
                onClick={() => void submit(prompt)}
                disabled={busy || prompt.trim().length === 0}
              >
                {busy ? "Asking..." : "Send"}
              </button>
            </div>
          </div>
          {error ? (
            <p className="mt-2 text-xs text-[#f4b7a1] bg-[#f4b7a1]/5 rounded-lg border border-[#f4b7a1]/10 px-3 py-2 shrink-0">
              {error}
            </p>
          ) : null}
        </div>

        {/* Sidebar: matchedAnimal Active Focus */}
        {matchedAnimal && (
          <aside className={isFullscreen ? "overflow-y-auto pr-1" : ""}>
            <div className="rounded-[1.4rem] border border-app-accent/35 bg-app-accent/9 p-4 h-fit sticky top-4">
              <div className="flex items-center gap-3 text-app-accent">
                <BinocularsIcon className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.24em] font-semibold">Active Species Focus</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-white">{matchedAnimal.commonName}</p>
              <p className="text-sm italic text-app-muted">{matchedAnimal.scientificName}</p>
              
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-app-soft">
                <div>
                  <span className="block font-medium">Status</span>
                  <span className="text-app-text">{matchedAnimal.conservationStatus}</span>
                </div>
                <div>
                  <span className="block font-medium">Diet</span>
                  <span className="text-app-text">{matchedAnimal.diet}</span>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-app-muted line-clamp-3">
                {matchedAnimal.shortDescription}
              </p>
              <Link to={`/species/${matchedAnimal.id}`} className="mt-3 inline-flex items-center text-xs text-app-accent hover:underline">
                View full record &rarr;
              </Link>
            </div>
          </aside>
        )}
      </div>

      {/* Chat Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-[6px] p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(25,30,27,0.98),rgba(10,13,11,0.98))] p-6 shadow-2xl animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-semibold text-white tracking-wide flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-app-accent"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                <span>Chat Settings</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-app-soft hover:text-white transition cursor-pointer text-lg font-medium"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Model Dropdown */}
              <div>
                <label className="text-xs uppercase tracking-wider text-app-soft font-semibold block mb-1.5">
                  LLM Model
                </label>
                <select
                  value={chatSettings.model}
                  onChange={(e) => saveSettings({ model: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-sm text-app-text focus:outline-none focus:border-app-accent/30 transition"
                >
                  <option value="openai/gpt-oss-120b">GPT-OSS 120B (Quality)</option>
                  <option value="openai/gpt-oss-20b">GPT-OSS 20B (Fast)</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B (Large Context)</option>
                  <option value="gemma2-9b-it">Gemma 2 9B</option>
                </select>
              </div>

              {/* Font Size Selector */}
              <div>
                <label className="text-xs uppercase tracking-wider text-app-soft font-semibold block mb-1.5">
                  Font Size
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["sm", "base", "lg", "xl"] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => saveSettings({ fontSize: size })}
                      className={[
                        "py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer uppercase",
                        chatSettings.fontSize === size
                          ? "border-app-accent/40 bg-app-accent/10 text-app-accent"
                          : "border-white/10 bg-white/[0.02] text-app-soft hover:bg-white/[0.05] hover:text-white"
                      ].join(" ")}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* RAG Context Sources */}
              <div>
                <label className="text-xs uppercase tracking-wider text-app-soft font-semibold block mb-1.5">
                  RAG Retrieval Sources
                </label>
                <div className="space-y-2 bg-black/25 rounded-xl border border-white/5 p-3">
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-app-text select-none">
                    <input
                      type="checkbox"
                      checked={chatSettings.useLocal}
                      onChange={(e) => saveSettings({ useLocal: e.target.checked })}
                      className="accent-app-accent rounded"
                    />
                    <span>Local Database (Static Animals)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-app-text select-none">
                    <input
                      type="checkbox"
                      checked={chatSettings.useCached}
                      onChange={(e) => saveSettings({ useCached: e.target.checked })}
                      className="accent-app-accent rounded"
                    />
                    <span>Cached / Hydrated Species Profiles</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-app-text select-none">
                    <input
                      type="checkbox"
                      checked={chatSettings.useWebSearch}
                      onChange={(e) => saveSettings({ useWebSearch: e.target.checked })}
                      className="accent-app-accent rounded"
                    />
                    <span>Online Search Fallback (Wikipedia)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-app-text select-none">
                    <input
                      type="checkbox"
                      checked={chatSettings.useImages}
                      onChange={(e) => saveSettings({ useImages: e.target.checked })}
                      className="accent-app-accent rounded"
                    />
                    <span>Image Embedding in responses</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="bg-app-accent hover:bg-app-accent-strong text-[#090d0a] font-semibold text-xs py-1.5 px-4 rounded-xl transition cursor-pointer"
                onClick={() => setShowSettings(false)}
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat History Modal */}
      {showHistory && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-[6px] p-4 animate-fade-in"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="w-full max-w-xl max-h-[85vh] overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(20,25,22,0.98),rgba(10,13,11,0.98))] p-6 shadow-2xl animate-zoom-in flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <HistoryIcon className="h-5 w-5 text-app-accent" />
                <h2 className="text-lg font-semibold text-white tracking-wide flex items-center gap-2">
                  Chat History
                  <span className="text-xs rounded-full bg-white/10 px-2 py-0.5 text-app-soft font-normal">
                    {chatSessions.length}
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="bg-app-accent/15 hover:bg-app-accent/25 text-app-accent border border-app-accent/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  New Chat
                </button>
                {chatSessions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllSessions}
                    className="text-xs text-app-muted hover:text-red-400 transition cursor-pointer select-none"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="text-app-soft hover:text-white transition cursor-pointer text-lg font-medium ml-1 select-none"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Filter Search */}
            {chatSessions.length > 2 && (
              <div className="mt-3 shrink-0">
                <input
                  type="text"
                  placeholder="Search past conversations..."
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-app-soft focus:outline-none focus:border-app-accent/40"
                />
              </div>
            )}

            {/* Session List */}
            <div className="mt-4 overflow-y-auto space-y-2 flex-1 pr-1 scrollbar-thin">
              {chatSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-3">
                    <HistoryIcon className="h-5 w-5 text-app-soft" />
                  </div>
                  <p className="text-sm font-medium text-white">No chat history yet</p>
                  <p className="text-xs text-app-muted mt-1 max-w-xs leading-relaxed">
                    Ask AI Naturalist a question to start saving your conversations automatically.
                  </p>
                </div>
              ) : (
                chatSessions
                  .filter((s) => {
                    if (!historyFilter.trim()) return true;
                    const q = historyFilter.trim().toLowerCase();
                    return (
                      s.title.toLowerCase().includes(q) ||
                      s.messages.some((m) => m.content.toLowerCase().includes(q))
                    );
                  })
                  .map((session) => {
                    const isActive = getActiveSessionId() === session.id;
                    const lastMsg = session.messages[session.messages.length - 1]?.content || "";
                    const cleanPreview = lastMsg.replace(/[#*`]/g, "").slice(0, 90);

                    return (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className={`group relative rounded-xl border p-3.5 transition cursor-pointer flex items-center justify-between gap-3 ${
                          isActive
                            ? "border-app-accent/40 bg-app-accent/10 shadow-sm"
                            : "border-white/8 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white truncate block">
                              {session.title || "Untitled Chat"}
                            </span>
                            {isActive && (
                              <span className="text-[9px] uppercase tracking-wider font-bold bg-app-accent/20 text-app-accent px-2 py-0.5 rounded-full border border-app-accent/30 shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          {cleanPreview && (
                            <p className="text-xs text-app-muted truncate">
                              {cleanPreview}...
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-app-soft">
                            <span>{formatSessionTime(session.updatedAt)}</span>
                            <span>•</span>
                            <span>{session.messages.length} message{session.messages.length === 1 ? "" : "s"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1.5 text-app-soft hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-white/10 cursor-pointer"
                            title="Delete Chat"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs text-app-muted shrink-0">
              <span>Saved locally in Biblos</span>
              <button
                type="button"
                className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-1.5 rounded-xl transition cursor-pointer"
                onClick={() => setShowHistory(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
