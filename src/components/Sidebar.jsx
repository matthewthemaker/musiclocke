import { Home, MapPinned, Users2, Library, Waves } from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "soundmap", label: "SoundMap", icon: MapPinned },
  { id: "multilisten", label: "MultiListen", icon: Users2 },
  { id: "library", label: "Library", icon: Library },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-6 border-r border-void-line bg-void-panel/60 px-4 py-6 lg:flex">
      <div className="flex items-center gap-2 px-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric-purple/20 text-electric-purple shadow-glow-purple">
          <Waves size={16} />
        </span>
        <span className="font-display text-lg font-semibold tracking-tight text-ink-hi">MusicLocke</span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active === id
                ? "bg-electric-purple/15 text-electric-purple shadow-glow-purple"
                : "text-ink-mid hover:bg-void-raised hover:text-ink-hi"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-xl2 border border-void-line bg-void-raised p-3">
        <p className="text-[11px] leading-relaxed text-ink-mid">
          Search and playback hit real YouTube when an API key is set, otherwise the local catalog. Sign in
          to sync your SoundMap devices across every session on your account.
        </p>
      </div>
    </aside>
  );
}
