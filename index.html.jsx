import { useState, useEffect, useRef } from "react";

const GENRES = [
  { id: "fantasy", label: "Fantasy", emoji: "🧙", color: "#7c3aed", bg: "#1e1033" },
  { id: "scifi", label: "Sci-Fi", emoji: "🚀", color: "#0ea5e9", bg: "#0c1a2e" },
  { id: "mystery", label: "Mystery", emoji: "🕵️", color: "#f59e0b", bg: "#1c1608" },
  { id: "romance", label: "Romance", emoji: "🌹", color: "#f43f5e", bg: "#1f0a10" },
];

const MODES = [
  { id: "story", label: "Story Builder", icon: "📖", desc: "Build a story with AI" },
  { id: "fix", label: "Fix My Sentence", icon: "✍️", desc: "Write & get corrected" },
  { id: "challenge", label: "Daily Challenge", icon: "🔥", desc: "Fill the missing words" },
];

const DAILY_CHALLENGE = {
  story: `The old lighthouse stood at the edge of the ___1___ cliff. Every night, the keeper would ___2___ the ancient lamp, casting golden light across the ___3___ sea. Sailors had trusted this beacon for ___4___ years, navigating through the darkest ___5___ storms.`,
  answers: ["jagged", "ignite", "restless", "hundreds", "winter"],
  hints: ["adj: sharp/rough", "verb: light up", "adj: uneasy/moving", "number word", "season"],
};

const buildStoryPrompt = (genre, userSentence, history) => `
You are a creative writing teacher and English tutor combined. The user is learning English through collaborative storytelling.

Genre: ${genre}
Story so far:
${history.map(h => `${h.role === "user" ? "User" : "AI"}: ${h.content}`).join("\n")}
User's new sentence: "${userSentence}"

Your response must be a JSON object ONLY, no markdown, no extra text:
{
  "continuation": "2-3 sentences continuing the story naturally, building on exactly what the user wrote",
  "correction": "If the user made grammar/spelling mistakes, rewrite their sentence correctly. If correct, return null",
  "correction_explanation": "Brief explanation of what was wrong in simple terms, or null",
  "new_word": "One interesting vocabulary word from your continuation",
  "new_word_meaning": "Simple definition of that word",
  "encouragement": "One short motivating line (max 8 words)"
}
`;

const buildFixPrompt = (sentence) => `
You are an English grammar teacher. The user wrote this sentence: "${sentence}"

Respond ONLY with a JSON object, no markdown:
{
  "is_correct": true or false,
  "corrected": "The corrected sentence, or same if already correct",
  "errors": ["list of specific errors found, or empty array"],
  "explanation": "Clear explanation of why it's wrong or why it's correct (2-3 sentences)",
  "alternatives": ["2 alternative ways to say the same thing better"],
  "level": "Beginner/Intermediate/Advanced based on complexity"
}
`;

export default function LinguaStory() {
  const [screen, setScreen] = useState("home"); // home | mode | story | fix | challenge
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [storyHistory, setStoryHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [fixResult, setFixResult] = useState(null);
  const [challengeAnswers, setChallengeAnswers] = useState(["", "", "", "", ""]);
  const [challengeResult, setChallengeResult] = useState(null);
  const [streak, setStreak] = useState(7);
  const [xp, setXp] = useState(1240);
  const storyEndRef = useRef(null);

  const genre = GENRES.find(g => g.id === selectedGenre) || GENRES[0];

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [storyHistory, aiResponse]);

  const callClaude = async (prompt) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content?.map(i => i.text || "").join("") || "";
    try {
      return JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      return null;
    }
  };

  const handleStorySend = async () => {
    if (!userInput.trim() || loading) return;
    const sentence = userInput.trim();
    setUserInput("");
    setLoading(true);
    setAiResponse(null);

    const newHistory = [...storyHistory, { role: "user", content: sentence }];
    setStoryHistory(newHistory);

    const result = await callClaude(buildStoryPrompt(selectedGenre, sentence, storyHistory));
    if (result) {
      setAiResponse(result);
      setStoryHistory([...newHistory, { role: "ai", content: result.continuation }]);
      setXp(x => x + 15);
    }
    setLoading(false);
  };

  const handleFix = async () => {
    if (!userInput.trim() || loading) return;
    setLoading(true);
    setFixResult(null);
    const result = await callClaude(buildFixPrompt(userInput.trim()));
    setFixResult(result);
    setXp(x => x + 10);
    setLoading(false);
  };

  const checkChallenge = () => {
    const results = challengeAnswers.map((ans, i) =>
      ans.toLowerCase().trim() === DAILY_CHALLENGE.answers[i]
    );
    const score = results.filter(Boolean).length;
    setChallengeResult({ results, score });
    setXp(x => x + score * 20);
  };

  const currentGenreStyle = {
    "--accent": genre.color,
    "--genre-bg": genre.bg,
  };

  // ── HOME ──
  if (screen === "home") return (
    <div style={{ minHeight: "100vh", background: "#080b14", fontFamily: "'Crimson Pro', Georgia, serif", color: "#e8dcc8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet" />

      {/* BG stars */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0 }}>
        {[...Array(60)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: Math.random() * 2 + 1 + "px",
            height: Math.random() * 2 + 1 + "px",
            background: "white",
            borderRadius: "50%",
            left: Math.random() * 100 + "%",
            top: Math.random() * 100 + "%",
            opacity: Math.random() * 0.6 + 0.1,
            animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: Math.random() * 3 + "s",
          }} />
        ))}
      </div>

      <style>{`
        @keyframes twinkle { 0%,100%{opacity:0.1} 50%{opacity:0.8} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 20px currentColor} 50%{box-shadow:0 0 40px currentColor, 0 0 60px currentColor} }
        .genre-card:hover { transform: scale(1.05) translateY(-4px) !important; }
        .mode-card:hover { transform: translateX(6px) !important; border-color: var(--hover-color) !important; }
        .btn-main:hover { transform: scale(1.03) !important; filter: brightness(1.15) !important; }
        .send-btn:hover { transform: scale(1.08) !important; }
      `}</style>

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "640px", width: "100%", animation: "fadeUp 0.8s ease" }}>
        <div style={{ fontSize: "4rem", animation: "float 4s ease-in-out infinite", marginBottom: "1rem" }}>📚</div>
        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, margin: 0, background: "linear-gradient(135deg, #f8e9c4, #e8a44a, #f8e9c4)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 4s linear infinite" }}>
          LinguaStory
        </h1>
        <p style={{ fontSize: "1.15rem", color: "#a89878", fontStyle: "italic", margin: "0.5rem 0 2.5rem", letterSpacing: "0.04em" }}>
          Learn English through the stories you create
        </p>

        {/* Stats bar */}
        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "2.5rem" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f59e0b" }}>🔥 {streak}</div>
            <div style={{ fontSize: "0.75rem", color: "#6b5d45" }}>day streak</div>
          </div>
          <div style={{ width: "1px", background: "#2a2010" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8a44a" }}>⚡ {xp}</div>
            <div style={{ fontSize: "0.75rem", color: "#6b5d45" }}>total XP</div>
          </div>
        </div>

        <button className="btn-main" onClick={() => setScreen("mode")} style={{ background: "linear-gradient(135deg, #c97d20, #e8a44a)", border: "none", color: "#1a0f00", padding: "1rem 3rem", borderRadius: "100px", fontSize: "1.1rem", fontFamily: "'Montserrat',sans-serif", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.05em" }}>
          BEGIN YOUR STORY →
        </button>

        <p style={{ marginTop: "2rem", fontSize: "0.8rem", color: "#3d3020", fontFamily: "'Montserrat',sans-serif" }}>
          Made by <span style={{ color: "#e8a44a" }}>Omar Ahmed</span>
        </p>
      </div>
    </div>
  );

  // ── MODE SELECT ──
  if (screen === "mode") return (
    <div style={{ minHeight: "100vh", background: "#080b14", fontFamily: "'Crimson Pro', Georgia, serif", color: "#e8dcc8", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet" />
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} .mode-card:hover{background:rgba(255,255,255,0.06)!important;} .genre-card:hover{transform:scale(1.06)!important;} .btn-main:hover{filter:brightness(1.2)!important;}`}</style>

      <div style={{ width: "100%", maxWidth: "600px", animation: "fadeUp 0.5s ease" }}>
        <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#6b5d45", cursor: "pointer", fontSize: "0.9rem", marginBottom: "2rem", fontFamily: "'Montserrat',sans-serif" }}>← Back</button>

        <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "1.8rem", fontWeight: 900, color: "#e8a44a", marginBottom: "0.3rem" }}>Choose Your Mode</h2>
        <p style={{ color: "#6b5d45", fontStyle: "italic", marginBottom: "2rem" }}>How do you want to learn today?</p>

        {MODES.map((mode, i) => (
          <div key={mode.id} className="mode-card" onClick={() => { setSelectedMode(mode.id); setScreen(mode.id === "story" ? "genre" : mode.id); }}
            style={{ display: "flex", alignItems: "center", gap: "1.2rem", padding: "1.2rem 1.5rem", marginBottom: "1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", cursor: "pointer", transition: "all 0.2s", animation: `fadeUp ${0.3 + i * 0.1}s ease` }}>
            <span style={{ fontSize: "2rem" }}>{mode.icon}</span>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, color: "#e8dcc8", fontSize: "1rem" }}>{mode.label}</div>
              <div style={{ color: "#6b5d45", fontSize: "0.9rem" }}>{mode.desc}</div>
            </div>
            <div style={{ marginLeft: "auto", color: "#3d3020", fontSize: "1.2rem" }}>›</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── GENRE SELECT ──
  if (screen === "genre") return (
    <div style={{ minHeight: "100vh", background: "#080b14", fontFamily: "'Crimson Pro', Georgia, serif", color: "#e8dcc8", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet" />
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} .genre-card:hover{transform:scale(1.06) translateY(-4px)!important;}`}</style>

      <div style={{ width: "100%", maxWidth: "600px" }}>
        <button onClick={() => setScreen("mode")} style={{ background: "none", border: "none", color: "#6b5d45", cursor: "pointer", fontSize: "0.9rem", marginBottom: "2rem", fontFamily: "'Montserrat',sans-serif" }}>← Back</button>
        <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "1.8rem", fontWeight: 900, color: "#e8a44a", marginBottom: "0.3rem" }}>Choose Your World</h2>
        <p style={{ color: "#6b5d45", fontStyle: "italic", marginBottom: "2rem" }}>Your story genre shapes everything</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {GENRES.map((g, i) => (
            <div key={g.id} className="genre-card" onClick={() => { setSelectedGenre(g.id); setStoryHistory([]); setAiResponse(null); setScreen("story"); }}
              style={{ background: g.bg, border: `2px solid ${g.color}33`, borderRadius: "20px", padding: "2rem 1.5rem", textAlign: "center", cursor: "pointer", transition: "all 0.25s", animation: `fadeUp ${0.2 + i * 0.1}s ease` }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{g.emoji}</div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, color: g.color, fontSize: "1.1rem" }}>{g.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── STORY MODE ──
  if (screen === "story") return (
    <div style={{ minHeight: "100vh", background: genre.bg, fontFamily: "'Crimson Pro', Georgia, serif", color: "#e8dcc8", display: "flex", flexDirection: "column", ...currentGenreStyle }}>
      <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .send-btn:hover{transform:scale(1.1)!important;}
        .send-btn:disabled{opacity:0.4!important;}
        textarea:focus{outline:none;border-color:var(--accent)!important;}
      `}</style>

      {/* Header */}
      <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${genre.color}22`, display: "flex", alignItems: "center", gap: "1rem", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => setScreen("genre")} style={{ background: "none", border: "none", color: "#6b5d45", cursor: "pointer", fontFamily: "'Montserrat',sans-serif", fontSize: "0.85rem" }}>← Back</button>
        <span style={{ fontSize: "1.3rem" }}>{genre.emoji}</span>
        <span style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, color: genre.color, fontSize: "0.95rem" }}>{genre.label} Story</span>
        <div style={{ marginLeft: "auto", background: `${genre.color}22`, border: `1px solid ${genre.color}44`, borderRadius: "100px", padding: "0.25rem 0.75rem", fontSize: "0.8rem", fontFamily: "'Montserrat',sans-serif", color: genre.color }}>+15 XP per line</div>
      </div>

      {/* Story area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "2rem 1.5rem", maxWidth: "700px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {storyHistory.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "#4a3d2a", fontStyle: "italic", fontSize: "1.1rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✨</div>
            Write your first sentence to begin the story...
          </div>
        )}

        {storyHistory.map((entry, i) => (
          <div key={i} style={{ marginBottom: "1rem", animation: "fadeUp 0.4s ease" }}>
            {entry.role === "user" ? (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ background: `${genre.color}22`, border: `1px solid ${genre.color}44`, borderRadius: "16px 16px 4px 16px", padding: "0.8rem 1.2rem", maxWidth: "80%", fontSize: "1.05rem", lineHeight: 1.6, color: "#e8dcc8" }}>
                  {entry.content}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem", flexShrink: 0, marginTop: "0.2rem" }}>📖</span>
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px 16px 16px 16px", padding: "0.8rem 1.2rem", fontSize: "1.1rem", lineHeight: 1.7, fontStyle: "italic", color: "#d4c4a0" }}>
                  {entry.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: "0.75rem", animation: "fadeUp 0.3s ease" }}>
            <span style={{ fontSize: "1.5rem" }}>📖</span>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px 16px 16px 16px", padding: "0.8rem 1.2rem" }}>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {[0, 1, 2].map(j => <div key={j} style={{ width: "7px", height: "7px", borderRadius: "50%", background: genre.color, animation: `pulse 1.2s ease-in-out ${j * 0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}

        {/* AI feedback card */}
        {aiResponse && !loading && (
          <div style={{ marginTop: "1rem", background: "rgba(0,0,0,0.3)", border: `1px solid ${genre.color}33`, borderRadius: "16px", padding: "1.2rem", animation: "fadeUp 0.4s ease" }}>
            {aiResponse.correction && (
              <div style={{ marginBottom: "0.8rem", padding: "0.8rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px" }}>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.75rem", color: "#ef4444", fontWeight: 700, marginBottom: "0.3rem" }}>✏️ CORRECTION</div>
                <div style={{ color: "#e8dcc8", fontStyle: "italic" }}>"{aiResponse.correction}"</div>
                {aiResponse.correction_explanation && <div style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "0.3rem" }}>{aiResponse.correction_explanation}</div>}
              </div>
            )}
            {aiResponse.new_word && (
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ background: `${genre.color}22`, border: `1px solid ${genre.color}44`, borderRadius: "8px", padding: "0.4rem 0.8rem" }}>
                  <span style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, color: genre.color, fontSize: "0.9rem" }}>{aiResponse.new_word}</span>
                  <span style={{ color: "#6b5d45", fontSize: "0.8rem" }}> — {aiResponse.new_word_meaning}</span>
                </div>
                {aiResponse.encouragement && <div style={{ color: "#e8a44a", fontStyle: "italic", fontSize: "0.9rem" }}>"{aiResponse.encouragement}"</div>}
              </div>
            )}
          </div>
        )}
        <div ref={storyEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "1rem 1.5rem", borderTop: `1px solid ${genre.color}22`, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", gap: "0.75rem" }}>
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleStorySend(); } }}
            placeholder="Continue the story in English..."
            rows={2}
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${genre.color}33`, borderRadius: "12px", padding: "0.8rem 1rem", color: "#e8dcc8", fontFamily: "'Crimson Pro', Georgia, serif", fontSize: "1rem", resize: "none", lineHeight: 1.5 }}
          />
          <button className="send-btn" onClick={handleStorySend} disabled={loading || !userInput.trim()}
            style={{ background: `linear-gradient(135deg, ${genre.color}, ${genre.color}99)`, border: "none", borderRadius: "12px", width: "50px", cursor: "pointer", fontSize: "1.3rem", transition: "all 0.2s", flexShrink: 0 }}>
            {loading ? <div style={{ width: "18px", height: "18px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "auto" }} /> : "→"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── FIX MY SENTENCE ──
  if (screen === "fix") return (
    <div style={{ minHeight: "100vh", background: "#080b14", fontFamily: "'Crimson Pro', Georgia, serif", color: "#e8dcc8", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet" />
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}} textarea:focus{outline:none;border-color:#e8a44a!important;} .btn-main:hover{filter:brightness(1.2)!important;}`}</style>

      <div style={{ width: "100%", maxWidth: "620px" }}>
        <button onClick={() => setScreen("mode")} style={{ background: "none", border: "none", color: "#6b5d45", cursor: "pointer", fontSize: "0.9rem", marginBottom: "2rem", fontFamily: "'Montserrat',sans-serif" }}>← Back</button>
        <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "1.8rem", fontWeight: 900, color: "#e8a44a", marginBottom: "0.3rem" }}>✍️ Fix My Sentence</h2>
        <p style={{ color: "#6b5d45", fontStyle: "italic", marginBottom: "2rem" }}>Write anything in English — AI will analyze it</p>

        <textarea
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          placeholder="Type your English sentence here..."
          rows={4}
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "1.2rem", color: "#e8dcc8", fontFamily: "'Crimson Pro', Georgia, serif", fontSize: "1.1rem", resize: "none", boxSizing: "border-box", lineHeight: 1.6 }}
        />

        <button className="btn-main" onClick={handleFix} disabled={loading || !userInput.trim()}
          style={{ marginTop: "1rem", width: "100%", background: "linear-gradient(135deg, #c97d20, #e8a44a)", border: "none", borderRadius: "12px", padding: "1rem", color: "#1a0f00", fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: "1rem", cursor: "pointer", transition: "all 0.2s", opacity: (loading || !userInput.trim()) ? 0.5 : 1 }}>
          {loading ? <div style={{ width: "20px", height: "20px", border: "2px solid #1a0f00", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "auto" }} /> : "Analyze My Sentence →"}
        </button>

        {fixResult && (
          <div style={{ marginTop: "1.5rem", animation: "fadeUp 0.5s ease" }}>
            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.5rem", borderRadius: "12px", marginBottom: "1rem", background: fixResult.is_correct ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${fixResult.is_correct ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              <span style={{ fontSize: "1.5rem" }}>{fixResult.is_correct ? "✅" : "❌"}</span>
              <div>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, color: fixResult.is_correct ? "#22c55e" : "#ef4444" }}>{fixResult.is_correct ? "Correct!" : "Needs fixing"}</div>
                <div style={{ fontSize: "0.8rem", color: "#6b5d45" }}>Level: {fixResult.level}</div>
              </div>
            </div>

            {/* Corrected */}
            <div style={{ padding: "1.2rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", marginBottom: "1rem" }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.75rem", color: "#e8a44a", fontWeight: 700, marginBottom: "0.5rem" }}>CORRECTED VERSION</div>
              <div style={{ fontSize: "1.1rem", fontStyle: "italic", color: "#e8dcc8" }}>"{fixResult.corrected}"</div>
            </div>

            {/* Explanation */}
            <div style={{ padding: "1.2rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", marginBottom: "1rem" }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.75rem", color: "#e8a44a", fontWeight: 700, marginBottom: "0.5rem" }}>EXPLANATION</div>
              <div style={{ lineHeight: 1.6, color: "#a89878" }}>{fixResult.explanation}</div>
            </div>

            {/* Alternatives */}
            {fixResult.alternatives?.length > 0 && (
              <div style={{ padding: "1.2rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.75rem", color: "#e8a44a", fontWeight: 700, marginBottom: "0.75rem" }}>BETTER WAYS TO SAY IT</div>
                {fixResult.alternatives.map((alt, i) => (
                  <div key={i} style={{ padding: "0.6rem 0.8rem", background: "rgba(232,164,74,0.08)", border: "1px solid rgba(232,164,74,0.2)", borderRadius: "8px", marginBottom: "0.5rem", fontStyle: "italic", color: "#e8dcc8" }}>
                    "{alt}"
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── DAILY CHALLENGE ──
  if (screen === "challenge") return (
    <div style={{ minHeight: "100vh", background: "#080b14", fontFamily: "'Crimson Pro', Georgia, serif", color: "#e8dcc8", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet" />
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} input:focus{outline:none;border-color:#f59e0b!important;} .btn-main:hover{filter:brightness(1.2)!important;}`}</style>

      <div style={{ width: "100%", maxWidth: "620px" }}>
        <button onClick={() => setScreen("mode")} style={{ background: "none", border: "none", color: "#6b5d45", cursor: "pointer", fontSize: "0.9rem", marginBottom: "2rem", fontFamily: "'Montserrat',sans-serif" }}>← Back</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "1.8rem", fontWeight: 900, color: "#f59e0b", margin: 0 }}>🔥 Daily Challenge</h2>
            <p style={{ color: "#6b5d45", fontStyle: "italic", marginTop: "0.3rem" }}>Fill in the 5 missing words</p>
          </div>
          <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "12px", padding: "0.5rem 1rem", textAlign: "center" }}>
            <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, color: "#f59e0b", fontSize: "1.2rem" }}>+{5 * 20}</div>
            <div style={{ fontSize: "0.7rem", color: "#6b5d45" }}>max XP</div>
          </div>
        </div>

        {/* Story with inputs */}
        <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", marginBottom: "1.5rem", fontSize: "1.15rem", lineHeight: 2 }}>
          {DAILY_CHALLENGE.story.split(/___(\d+)___/).map((part, i) => {
            if (/^\d+$/.test(part)) {
              const idx = parseInt(part) - 1;
              const answered = challengeResult;
              const correct = answered && challengeResult.results[idx];
              return (
                <input key={i} value={challengeAnswers[idx]}
                  onChange={e => { const a = [...challengeAnswers]; a[idx] = e.target.value; setChallengeAnswers(a); }}
                  disabled={!!challengeResult}
                  style={{ width: "110px", background: challengeResult ? (correct ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)") : "rgba(245,158,11,0.1)", border: `1px solid ${challengeResult ? (correct ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)") : "rgba(245,158,11,0.4)"}`, borderRadius: "6px", padding: "0.2rem 0.5rem", color: "#e8dcc8", fontFamily: "'Crimson Pro', Georgia, serif", fontSize: "1rem", textAlign: "center", margin: "0 4px" }}
                />
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>

        {/* Hints */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {DAILY_CHALLENGE.hints.map((hint, i) => (
            <div key={i} style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "100px", padding: "0.25rem 0.75rem", fontSize: "0.8rem", color: "#a89878" }}>
              {i + 1}. {hint}
            </div>
          ))}
        </div>

        {!challengeResult ? (
          <button className="btn-main" onClick={checkChallenge}
            style={{ width: "100%", background: "linear-gradient(135deg, #b45309, #f59e0b)", border: "none", borderRadius: "12px", padding: "1rem", color: "#1a0f00", fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: "1rem", cursor: "pointer", transition: "all 0.2s" }}>
            Check My Answers →
          </button>
        ) : (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            <div style={{ padding: "1.5rem", background: challengeResult.score === 5 ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", border: `1px solid ${challengeResult.score === 5 ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`, borderRadius: "16px", textAlign: "center", marginBottom: "1rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{challengeResult.score === 5 ? "🎉" : "📚"}</div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "2rem", color: "#f59e0b" }}>{challengeResult.score}/5</div>
              <div style={{ color: "#a89878", marginTop: "0.3rem" }}>+{challengeResult.score * 20} XP earned</div>
              <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#6b5d45" }}>
                Correct answers: {DAILY_CHALLENGE.answers.join(", ")}
              </div>
            </div>
            <button className="btn-main" onClick={() => { setChallengeResult(null); setChallengeAnswers(["","","","",""]); setScreen("mode"); }}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "1rem", color: "#e8dcc8", fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}>
              Try Another Mode →
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return null;
}
