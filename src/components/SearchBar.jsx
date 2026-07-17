import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchTracks, hasApiKey } from "../services/youtube.js";
import { usePlayback } from "../context/PlaybackContext.jsx";

export default function SearchBar() {
  const { playTrack } = usePlayback();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState(hasApiKey() ? "youtube" : "mock");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!open) return;
      setLoading(true);
      const { results: r, source: s } = await searchTracks(query);
      setResults(r);
      setSource(s);
      setLoading(false);
    }, 320);
    return () => clearTimeout(handle);
  }, [query, open]);

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-full border border-void-line bg-void-raised px-4 py-2.5 focus-within:border-neon-green">
        {loading ? (
          <Loader2 size={16} className="animate-spin text-neon-green" />
        ) : (
          <Search size={16} className="text-ink-mid" />
        )}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search songs, artists, albums…"
          className="w-full bg-transparent text-sm text-ink-hi placeholder:text-ink-low focus:outline-none"
        />
        {!hasApiKey() && (
          <span className="hidden shrink-0 rounded-full bg-pulse-amber/15 px-2 py-0.5 text-[10px] font-mono text-pulse-amber sm:inline">
            local catalog
          </span>
        )}
      </div>

      {open && (
        <div className="absolute z-40 mt-2 max-h-96 w-full overflow-y-auto rounded-xl2 border border-void-line bg-void-panel/95 p-2 shadow-glow-soft backdrop-blur">
          <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wide text-ink-low">
            <span>{query ? `Results for "${query}"` : "Suggested"}</span>
            <span>{source === "youtube" ? "YouTube Data API" : "Local fallback"}</span>
          </div>
          {results.length === 0 && !loading && (
            <p className="px-2 py-3 text-sm text-ink-mid">No matches. Try a different search.</p>
          )}
          <ul className="flex flex-col gap-1">
            {results.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    playTrack(t);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-void-raised"
                >
                  <img src={t.thumbnail} alt="" className="h-9 w-9 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink-hi">{t.title}</p>
                    <p className="truncate text-[11px] text-ink-mid">{t.artist}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
