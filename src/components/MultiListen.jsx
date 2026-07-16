import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, LogOut, Radio, Shuffle } from "lucide-react";
import { usePlayback } from "../context/PlaybackContext.jsx";
import { MOCK_TRACKS } from "../data/mockTracks.js";

// A lightweight "taste merge" simulation: interleave two listeners' top
// picks, weighting by a simple affinity score, to demonstrate what an
// algorithmic Vibe Queue could look like.
function buildVibeQueue() {
  const you = [MOCK_TRACKS[0], MOCK_TRACKS[2], MOCK_TRACKS[4]];
  const friend = [MOCK_TRACKS[1], MOCK_TRACKS[3], MOCK_TRACKS[5]];
  const merged = [];
  const max = Math.max(you.length, friend.length);
  for (let i = 0; i < max; i += 1) {
    if (you[i]) merged.push({ ...you[i], from: "you", affinity: 92 - i * 6 });
    if (friend[i]) merged.push({ ...friend[i], from: "friend", affinity: 88 - i * 7 });
  }
  return merged;
}

export default function MultiListen() {
  const { rooms, activeRoomId, joinRoom, leaveRoom, multiListenActive, playTrack } = usePlayback();
  const vibeQueue = useMemo(() => buildVibeQueue(), []);

  return (
    <section className="flex h-full flex-col gap-4 rounded-xl2 border border-void-line bg-panel-gradient p-5 shadow-inset-line">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-hi">MultiListen</h2>
          <p className="text-xs text-ink-mid">Drop into a friend&rsquo;s room or ride the shared Vibe Queue.</p>
        </div>
        {multiListenActive && (
          <button
            type="button"
            onClick={leaveRoom}
            className="flex items-center gap-1 rounded-full border border-pulse-pink/50 px-2.5 py-1 text-xs text-pulse-pink hover:shadow-glow-pink"
          >
            <LogOut size={12} />
            Leave
          </button>
        )}
      </header>

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-low">
        <Users size={13} />
        Active Rooms
      </div>
      <ul className="flex flex-col gap-2">
        {rooms.map((room) => {
          const active = room.id === activeRoomId;
          return (
            <li key={room.id}>
              <button
                type="button"
                onClick={() => joinRoom(room.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "border-neon-green/60 bg-neon-green/10 shadow-glow-green"
                    : "border-void-line bg-void-raised hover:border-electric-purple/40"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-ink-hi">{room.name}</p>
                  <p className="text-[11px] text-ink-mid">{room.listeners} listening</p>
                </div>
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono ${
                    room.live ? "bg-neon-green/15 text-neon-green" : "bg-void-line text-ink-low"
                  }`}
                >
                  <Radio size={10} />
                  {room.live ? "LIVE" : "OFFLINE"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-low">
        <Shuffle size={13} />
        Vibe Queue
      </div>
      <p className="-mt-2 text-[11px] text-ink-mid">
        An algorithmic merge of your taste and your room&rsquo;s — alternating by affinity score.
      </p>

      <ul className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {vibeQueue.map((t, i) => (
          <motion.li
            key={`${t.id}-${i}`}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <button
              type="button"
              onClick={() => playTrack(t)}
              className="flex w-full items-center gap-3 rounded-lg border border-void-line bg-void-raised px-3 py-2 text-left hover:border-electric-purple/50"
            >
              <img src={t.thumbnail} alt="" className="h-9 w-9 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-hi">{t.title}</p>
                <p className="truncate text-[11px] text-ink-mid">{t.artist}</p>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`text-[10px] font-mono ${
                    t.from === "you" ? "text-neon-green" : "text-electric-purple"
                  }`}
                >
                  {t.from === "you" ? "YOU" : "THEM"}
                </span>
                <span className="text-[10px] text-ink-low">{t.affinity}% match</span>
              </div>
            </button>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
