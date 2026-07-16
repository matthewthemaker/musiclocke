import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import SearchBar from "./components/SearchBar.jsx";
import SoundMap from "./components/SoundMap.jsx";
import MusicMedia from "./components/MusicMedia.jsx";
import MultiListen from "./components/MultiListen.jsx";
import PlayerBar from "./components/PlayerBar.jsx";
import AccountPanel from "./components/AccountPanel.jsx";
import { usePlayback } from "./context/PlaybackContext.jsx";

export default function App() {
  const [activeNav, setActiveNav] = useState("home");
  const { track } = usePlayback();

  return (
    <div className="flex min-h-screen">
      <Sidebar active={activeNav} onNavigate={setActiveNav} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-void-line px-6 py-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-electric-purple">MusicLocke</p>
            <h1 className="font-display text-2xl font-semibold text-ink-hi">
              {track ? `Now spinning: ${track.title}` : "Welcome back"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <SearchBar />
            <AccountPanel />
          </div>
        </header>

        <main className="flex-1 px-6 py-6 pb-28">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <div style={{ height: 420 }}>
                <SoundMap />
              </div>
            </div>
            <div className="xl:col-span-1">
              <div style={{ height: 420 }}>
                <MultiListen />
              </div>
            </div>
            <div className="xl:col-span-3">
              <MusicMedia />
            </div>
          </div>
        </main>
      </div>

      <PlayerBar
        onOpenSoundMap={() => setActiveNav("soundmap")}
        onOpenMultiListen={() => setActiveNav("multilisten")}
      />
    </div>
  );
}
