import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  LogOut,
  Radio,
  Shuffle,
  UserPlus,
  Check,
  X,
  Trash2,
  Loader2,
} from "lucide-react";
import { usePlayback } from "../context/PlaybackContext.jsx";
import { useFriends } from "../context/FriendsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
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

function AddFriendForm() {
  const { sendFriendRequest, error, clearError } = useFriends();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    clearError();
    setSending(true);
    setSent(false);
    await sendFriendRequest(trimmed);
    setSending(false);
    setSent(true);
    setEmail("");
    setTimeout(() => setSent(false), 2500);
  };

  return (
    <div className="mb-1">
      <div className="flex items-center gap-2">
        <input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) clearError();
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Friend's account email"
          type="email"
          className="w-full rounded-lg border border-void-line bg-void-raised px-2 py-1.5 text-sm text-ink-hi placeholder:text-ink-low focus:border-neon-green focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={sending || !email.trim()}
          className="shrink-0 rounded-lg border border-void-line p-1.5 text-ink-mid hover:border-neon-green hover:text-neon-green disabled:opacity-60"
          aria-label="Send friend request"
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
        </button>
      </div>
      {error && <p className="mt-1 text-[11px] text-pulse-pink">{error}</p>}
      {sent && !error && <p className="mt-1 text-[11px] text-neon-green">Friend request sent.</p>}
    </div>
  );
}

function FriendRow({ friend }) {
  const { friendSessions, removeFriend } = useFriends();
  const { listenAlongFriendId, listenAlong, stopListenAlong } = usePlayback();
  const session = friendSessions[friend.id];
  const isLive = Boolean(session?.isPlaying && session?.track);
  const isListening = listenAlongFriendId === friend.id;

  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-void-line bg-void-raised px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        {friend.photoURL ? (
          <img src={friend.photoURL} alt="" className="h-7 w-7 shrink-0 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-void-line text-[11px] text-ink-mid">
            {(friend.displayName || "?").charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-hi">{friend.displayName}</p>
          <p className="truncate text-[11px] text-ink-mid">
            {isLive ? `Playing: ${session.track.title}` : "Not listening"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {isLive && (
          <button
            type="button"
            onClick={() => (isListening ? stopListenAlong() : listenAlong(friend.id, friend.displayName))}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono ${
              isListening
                ? "bg-pulse-pink/15 text-pulse-pink"
                : "bg-neon-green/15 text-neon-green hover:shadow-glow-green"
            }`}
          >
            <Radio size={10} />
            {isListening ? "Leave" : "Listen"}
          </button>
        )}
        <button
          type="button"
          onClick={() => removeFriend(friend.id)}
          className="text-ink-low hover:text-pulse-pink"
          aria-label={`Remove ${friend.displayName}`}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </li>
  );
}

function FriendsPanel() {
  const { isSignedIn, firebaseConfigured } = useAuth();
  const { friends, incomingRequests, acceptRequest, declineRequest } = useFriends();
  const { listenAlongFriendId, listenAlongFriendName, stopListenAlong } = usePlayback();

  if (!firebaseConfigured) {
    return (
      <p className="rounded-lg bg-void-raised px-2.5 py-2 text-[11px] text-ink-mid">
        Add your Firebase project keys to .env to enable accounts and friends.
      </p>
    );
  }

  if (!isSignedIn) {
    return (
      <p className="rounded-lg bg-void-raised px-2.5 py-2 text-[11px] text-ink-mid">
        Sign in to add friends and listen along with them.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {listenAlongFriendId && (
        <div className="flex items-center justify-between rounded-lg border border-neon-green/40 bg-neon-green/10 px-3 py-2">
          <span className="text-xs text-neon-green">Listening along with {listenAlongFriendName ?? "a friend"}</span>
          <button
            type="button"
            onClick={stopListenAlong}
            className="flex items-center gap-1 rounded-full border border-pulse-pink/50 px-2 py-0.5 text-[10px] text-pulse-pink hover:shadow-glow-pink"
          >
            <LogOut size={11} />
            Leave
          </button>
        </div>
      )}

      <AddFriendForm />

      {incomingRequests.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-low">
            Friend requests
          </p>
          <ul className="flex flex-col gap-1.5">
            {incomingRequests.map((req) => (
              <li
                key={req.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-void-line bg-void-raised px-3 py-2"
              >
                <span className="truncate text-sm text-ink-hi">{req.displayName}</span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => acceptRequest(req.id)}
                    className="rounded-full bg-neon-green/15 p-1 text-neon-green hover:shadow-glow-green"
                    aria-label={`Accept ${req.displayName}`}
                  >
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => declineRequest(req.id)}
                    className="rounded-full bg-pulse-pink/15 p-1 text-pulse-pink"
                    aria-label={`Decline ${req.displayName}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-low">
          Friends {friends.length > 0 && `(${friends.length})`}
        </p>
        {friends.length === 0 ? (
          <p className="rounded-lg bg-void-raised px-2.5 py-2 text-[11px] text-ink-mid">
            No friends yet — add one above by email.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {friends.map((friend) => (
              <FriendRow key={friend.id} friend={friend} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function MultiListen() {
  const { playTrack } = usePlayback();
  const vibeQueue = useMemo(() => buildVibeQueue(), []);

  return (
    <section className="flex h-full flex-col gap-4 rounded-xl2 border border-void-line bg-panel-gradient p-5 shadow-inset-line">
      <header>
        <h2 className="font-display text-lg font-semibold text-ink-hi">MultiListen</h2>
        <p className="text-xs text-ink-mid">Friend real accounts and listen along, or ride the shared Vibe Queue.</p>
      </header>

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-low">
        <Users size={13} />
        Friends
      </div>
      <FriendsPanel />

      <div className="mt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-low">
        <Shuffle size={13} />
        Vibe Queue
      </div>
      <p className="-mt-2 text-[11px] text-ink-mid">
        An algorithmic merge of your taste and a friend&rsquo;s — alternating by affinity score.
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
