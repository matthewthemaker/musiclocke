import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, BookOpen, Mic2, Users2, Smile } from "lucide-react";
import { usePlayback } from "../context/PlaybackContext.jsx";

const EMOJI_OPTIONS = ["🔥", "😭", "🌅", "📻", "💜", "🎧"];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function Waveform({ trackDuration, progress, reactions, onSeek, onDrop }) {
  // Deterministic pseudo-waveform bars derived from index, so it looks organic
  // without needing real audio analysis for the prototype.
  const bars = useMemo(() => {
    const count = 90;
    return Array.from({ length: count }, (_, i) => {
      const wave = Math.sin(i * 0.35) * 0.5 + Math.sin(i * 0.11) * 0.3;
      return 22 + Math.abs(wave) * 30 + ((i * 7) % 9);
    });
  }, []);

  const pct = trackDuration ? (progress / trackDuration) * 100 : 0;

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPct = (e.clientX - rect.left) / rect.width;
    const time = Math.round(clickPct * trackDuration);
    onSeek(time);
  };

  const handleDoubleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPct = (e.clientX - rect.left) / rect.width;
    const time = Math.round(clickPct * trackDuration);
    onDrop(time);
  };

  return (
    <div className="relative">
      <div
        role="slider"
        aria-label="Seek within track, double-click to drop a reaction"
        aria-valuemin={0}
        aria-valuemax={trackDuration}
        aria-valuenow={progress}
        tabIndex={0}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className="relative flex h-16 cursor-pointer items-end gap-[3px] overflow-hidden rounded-lg border border-void-line bg-void-raised/60 px-3 py-2"
      >
        {bars.map((h, i) => {
          const barPct = (i / bars.length) * 100;
          const played = barPct <= pct;
          return (
            <span
              key={i}
              style={{ height: `${h}%` }}
              className={`w-[3px] rounded-full transition-colors ${
                played ? "bg-neon-green shadow-glow-green" : "bg-void-line"
              }`}
            />
          );
        })}

        <div
          className="pointer-events-none absolute top-0 h-full w-px bg-ink-hi/80"
          style={{ left: `${pct}%` }}
        />

        {/* Timestamp pins for existing reactions */}
        {reactions.map((r) => {
          const left = trackDuration ? (r.time / trackDuration) * 100 : 0;
          return (
            <span
              key={r.id}
              style={{ left: `${left}%` }}
              title={`${r.emoji} at ${formatTime(r.time)}`}
              className="pointer-events-none absolute -top-1 -translate-x-1/2 text-sm"
            >
              {r.emoji}
            </span>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[11px] font-mono text-ink-low">
        <span>{formatTime(progress)}</span>
        <span>Double-click waveform to drop a reaction</span>
        <span>{formatTime(trackDuration)}</span>
      </div>
    </div>
  );
}

function FloatingReactions({ reactions, progress }) {
  const recent = reactions.filter((r) => r.time <= progress && r.time > progress - 3);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-14 flex justify-center gap-2">
      <AnimatePresence>
        {recent.map((r) => (
          <motion.div
            key={`${r.id}-${progress}`}
            initial={{ opacity: 0, y: 10, scale: 0.7 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="animate-float-up rounded-full bg-void-panel/90 px-3 py-1 text-lg shadow-glow-soft"
          >
            {r.emoji}
            {r.text ? <span className="ml-1 text-xs text-ink-mid">{r.text}</span> : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function LinerNotesPanel({ open, onClose, track }) {
  const [tab, setTab] = useState("lyrics");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-void-line bg-void-panel p-5 shadow-glow-soft"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink-hi">Liner Notes 2.0</h3>
                <p className="text-xs text-ink-mid">
                  {track?.title} — {track?.artist}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-void-line p-1.5 text-ink-mid hover:text-neon-green"
                aria-label="Close liner notes"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-4 flex gap-1 rounded-lg border border-void-line bg-void-raised p-1">
              {[
                { id: "lyrics", label: "Lyrics", icon: Mic2 },
                { id: "diary", label: "Diary", icon: BookOpen },
                { id: "credits", label: "Credits", icon: Users2 },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    tab === id ? "bg-electric-purple text-white shadow-glow-purple" : "text-ink-mid hover:text-ink-hi"
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>

            <div className="h-[calc(100%-9rem)] overflow-y-auto pr-1">
              {tab === "lyrics" && (
                <ul className="space-y-3">
                  {(track?.lyrics ?? []).length === 0 && (
                    <p className="text-sm text-ink-mid">No lyrics available for this track yet.</p>
                  )}
                  {track?.lyrics?.map((l, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-10 shrink-0 font-mono text-xs text-neon-green">{formatTime(l.time)}</span>
                      <span className="text-ink-hi/90">{l.line}</span>
                    </li>
                  ))}
                </ul>
              )}

              {tab === "diary" && (
                <div className="rounded-lg border border-void-line bg-void-raised p-4">
                  <p className="text-sm leading-relaxed text-ink-hi/90">
                    {track?.diary || "This artist hasn't published a diary entry for this track yet."}
                  </p>
                </div>
              )}

              {tab === "credits" && (
                <ul className="space-y-2">
                  {track?.credits?.map((c, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-void-line bg-void-raised px-3 py-2 text-sm"
                    >
                      <span className="text-ink-mid">{c.role}</span>
                      <span className="font-medium text-ink-hi">{c.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default function MusicMedia() {
  const { track, progress, seekTo, reactions, addReaction, linerNotesOpen, setLinerNotesOpen } = usePlayback();
  const [pendingEmoji, setPendingEmoji] = useState("🔥");
  const [pendingTime, setPendingTime] = useState(null);
  const [comment, setComment] = useState("");

  const trackReactions = reactions.filter((r) => r.trackId === track?.id);

  const handleDrop = (time) => {
    setPendingTime(time);
  };

  const submitReaction = () => {
    if (pendingTime === null) return;
    addReaction({
      trackId: track.id,
      time: pendingTime,
      emoji: pendingEmoji,
      user: "you",
      text: comment.trim(),
    });
    setPendingTime(null);
    setComment("");
  };

  return (
    <section className="relative flex flex-col gap-4 rounded-xl2 border border-void-line bg-panel-gradient p-5 shadow-inset-line">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-hi">Now Playing — Social Layer</h2>
          <p className="text-xs text-ink-mid">Drop a timestamped reaction, or open Liner Notes for the full story.</p>
        </div>
        <button
          type="button"
          onClick={() => setLinerNotesOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-electric-purple/50 px-3 py-1.5 text-xs font-medium text-electric-purple hover:shadow-glow-purple"
        >
          <BookOpen size={14} />
          Liner Notes 2.0
        </button>
      </header>

      <Waveform
        trackDuration={track?.duration ?? 0}
        progress={progress}
        reactions={trackReactions}
        onSeek={seekTo}
        onDrop={handleDrop}
      />

      <FloatingReactions reactions={trackReactions} progress={progress} />

      {pendingTime !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-void-line bg-void-raised p-3"
        >
          <Smile size={15} className="text-pulse-pink" />
          <span className="text-xs text-ink-mid">Reacting at {formatTime(pendingTime)}:</span>
          <div className="flex gap-1">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setPendingEmoji(e)}
                className={`rounded-md px-1.5 py-0.5 text-base ${
                  pendingEmoji === e ? "bg-pulse-pink/20 ring-1 ring-pulse-pink" : "hover:bg-void-line"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)"
            className="min-w-[10rem] flex-1 rounded-md border border-void-line bg-void px-2 py-1 text-xs text-ink-hi placeholder:text-ink-low focus:border-neon-green"
          />
          <button
            type="button"
            onClick={submitReaction}
            className="rounded-md bg-neon-green px-3 py-1 text-xs font-semibold text-void hover:shadow-glow-green"
          >
            Drop
          </button>
          <button
            type="button"
            onClick={() => setPendingTime(null)}
            className="text-xs text-ink-low hover:text-ink-mid"
          >
            Cancel
          </button>
        </motion.div>
      )}

      <LinerNotesPanel open={linerNotesOpen} onClose={() => setLinerNotesOpen(false)} track={track} />
    </section>
  );
}
