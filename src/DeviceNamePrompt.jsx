import { Play, Pause, SkipBack, SkipForward, Volume2, Rows3, MapPinned } from "lucide-react";
import { usePlayback } from "../context/PlaybackContext.jsx";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function PlayerBar({ onOpenSoundMap, onOpenMultiListen }) {
  const { track, isPlaying, togglePlay, progress, seekTo, masterVolume, updateMasterVolume, setLinerNotesOpen } =
    usePlayback();

  if (!track) return null;

  const pct = track.duration ? (progress / track.duration) * 100 : 0;

  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-void-line bg-void-panel/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <img
            src={track.thumbnail}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg object-cover shadow-glow-purple"
          />
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setLinerNotesOpen(true)}
              className="truncate text-left text-sm font-medium text-ink-hi hover:text-neon-green"
              title="Open Liner Notes"
            >
              {track.title}
            </button>
            <p className="truncate text-xs text-ink-mid">{track.artist}</p>
          </div>
        </div>

        <div className="flex flex-[2] flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <button type="button" className="text-ink-mid hover:text-ink-hi" aria-label="Previous track">
              <SkipBack size={18} />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neon-green text-void shadow-glow-green hover:scale-105 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>
            <button type="button" className="text-ink-mid hover:text-ink-hi" aria-label="Next track">
              <SkipForward size={18} />
            </button>
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <span className="w-9 text-right text-[10px] font-mono text-ink-low">{formatTime(progress)}</span>
            <input
              type="range"
              min={0}
              max={track.duration || 0}
              value={progress}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full"
              aria-label="Seek"
            />
            <span className="w-9 text-[10px] font-mono text-ink-low">{formatTime(track.duration || 0)}</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="hidden items-center gap-1.5 sm:flex">
            <Volume2 size={15} className="text-ink-mid" />
            <input
              type="range"
              min={0}
              max={100}
              value={masterVolume}
              onChange={(e) => updateMasterVolume(Number(e.target.value))}
              className="w-20"
              aria-label="Master volume"
            />
          </div>
          <button
            type="button"
            onClick={onOpenSoundMap}
            className="flex items-center gap-1.5 rounded-full border border-void-line px-2.5 py-1.5 text-xs text-ink-mid hover:border-neon-green hover:text-neon-green"
            title="Open SoundMap"
          >
            <MapPinned size={13} />
            <span className="hidden md:inline">SoundMap</span>
          </button>
          <button
            type="button"
            onClick={onOpenMultiListen}
            className="flex items-center gap-1.5 rounded-full border border-void-line px-2.5 py-1.5 text-xs text-ink-mid hover:border-electric-purple hover:text-electric-purple"
            title="Open MultiListen"
          >
            <Rows3 size={13} />
            <span className="hidden md:inline">MultiListen</span>
          </button>
        </div>
      </div>
      <div className="h-0.5 bg-void-line">
        <div className="h-full bg-neon-green shadow-glow-green" style={{ width: `${pct}%` }} />
      </div>
    </footer>
  );
}
