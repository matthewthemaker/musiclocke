import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPinned, X } from "lucide-react";
import { usePlayback } from "../context/PlaybackContext.jsx";
import { guessDeviceLabel } from "../services/deviceId.js";

export default function DeviceNamePrompt() {
  const { needsDeviceName, registerThisDevice, dismissDeviceNamePrompt } = usePlayback();
  const [name, setName] = useState(() => guessDeviceLabel());
  const [saving, setSaving] = useState(false);

  if (!needsDeviceName) return null;

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    await registerThisDevice(trimmed);
    setSaving(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          className="w-full max-w-sm rounded-xl2 border border-void-line bg-void-panel p-5 shadow-glow-soft"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neon-green/10 text-neon-green">
                <MapPinned size={16} />
              </span>
              <div>
                <h2 className="font-display text-base font-semibold text-ink-hi">Name this device</h2>
                <p className="text-xs text-ink-mid">You&rsquo;re signed in on a new device.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissDeviceNamePrompt}
              className="text-ink-mid hover:text-ink-hi"
              aria-label="Skip for now"
            >
              <X size={16} />
            </button>
          </div>

          <p className="mb-3 text-xs leading-relaxed text-ink-mid">
            Give the device you&rsquo;re on right now a name and it&rsquo;ll show up on your SoundMap. Every
            device you sign in on plays the same music in sync, so you can control volume per room and keep
            them all listening together.
          </p>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="e.g. Kitchen speaker, My phone"
            autoFocus
            className="mb-3 w-full rounded-lg border border-void-line bg-void-raised px-3 py-2 text-sm text-ink-hi placeholder:text-ink-low focus:border-neon-green focus:outline-none"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={dismissDeviceNamePrompt}
              className="rounded-full px-3 py-1.5 text-xs text-ink-mid hover:text-ink-hi"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="rounded-full bg-neon-green px-4 py-1.5 text-xs font-medium text-void shadow-glow-green hover:scale-[1.02] transition-transform disabled:opacity-60"
            >
              {saving ? "Adding…" : "Add to SoundMap"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
