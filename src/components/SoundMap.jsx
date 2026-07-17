import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Radio, Sliders, Trash2, Bluetooth, Smartphone, Pencil, Check } from "lucide-react";
import { usePlayback } from "../context/PlaybackContext.jsx";
import AddDeviceMenu from "./AddDeviceMenu.jsx";

const ZONE_ACCENT = {
  bedroom: { ring: "shadow-glow-purple", dot: "bg-electric-purple", text: "text-electric-purple" },
  "living-room": { ring: "shadow-glow-green", dot: "bg-neon-green", text: "text-neon-green" },
  kitchen: { ring: "shadow-glow-pink", dot: "bg-pulse-pink", text: "text-pulse-pink" },
  patio: { ring: "shadow-glow-green", dot: "bg-neon-green", text: "text-neon-green" },
};

function DeviceBubble({ zone, canvasRef }) {
  const {
    setZoneVolume,
    toggleZoneMute,
    moveZone,
    removeDevice,
    renameZone,
    effectiveZoneVolume,
    isPlaying,
    thisDeviceId,
  } = usePlayback();
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(zone.label);
  const accent = ZONE_ACCENT[zone.id] ?? ZONE_ACCENT.bedroom;
  const level = effectiveZoneVolume(zone);
  const active = isPlaying && level > 0;
  const isThisDevice = Boolean(zone.deviceId && zone.deviceId === thisDeviceId);

  const commitRename = () => {
    if (nameDraft.trim() && nameDraft.trim() !== zone.label) {
      renameZone(zone.id, nameDraft.trim());
    }
    setEditingName(false);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.12}
      whileDrag={{ scale: 1.06, zIndex: 30 }}
      onDragEnd={(_, info) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const xPct = Math.min(96, Math.max(4, ((info.point.x - rect.left) / rect.width) * 100));
        const yPct = Math.min(92, Math.max(8, ((info.point.y - rect.top) / rect.height) * 100));
        moveZone(zone.id, xPct, yPct);
      }}
      style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
      className="absolute -translate-x-1/2 -translate-y-1/2 touch-none select-none cursor-grab active:cursor-grabbing z-10"
    >
      <div className="relative flex flex-col items-center">
        {active && (
          <span
            className={`absolute inline-flex h-16 w-16 rounded-full ${accent.dot} opacity-30 animate-pulse-ring`}
            aria-hidden="true"
          />
        )}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={`relative flex h-16 w-16 flex-col items-center justify-center rounded-full border ${
            isThisDevice ? "border-neon-green" : "border-void-line"
          } bg-void-panel ${accent.ring} transition-transform hover:scale-105`}
          aria-expanded={expanded}
          aria-label={`${zone.label} device, ${zone.muted ? "muted" : `${level}% volume`}${
            isThisDevice ? ", this device" : ""
          }`}
        >
          {isThisDevice ? (
            <Smartphone size={18} className="text-neon-green" />
          ) : zone.kind === "bluetooth" ? (
            <Bluetooth size={18} className={accent.text} />
          ) : (
            <Radio size={18} className={accent.text} />
          )}
          <span className="mt-0.5 text-[10px] font-mono text-ink-mid">{zone.muted ? "--" : `${level}%`}</span>
        </button>
        <span className="mt-2 flex flex-col items-center gap-0.5 rounded-full bg-void-raised/80 px-2.5 py-0.5 text-xs font-medium text-ink-mid backdrop-blur">
          <span>{zone.label}</span>
          {isThisDevice && <span className="text-[9px] font-semibold uppercase leading-none text-neon-green">this device</span>}
        </span>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-20 z-40 w-48 rounded-xl2 border border-void-line bg-void-panel/95 p-3 shadow-glow-soft backdrop-blur"
          >
            <div className="mb-2 flex items-center justify-between gap-1">
              {editingName ? (
                <div className="flex min-w-0 flex-1 items-center gap-1">
                  <input
                    autoFocus
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && commitRename()}
                    className="w-full min-w-0 rounded-md border border-void-line bg-void-raised px-1.5 py-0.5 text-xs text-ink-hi focus:border-neon-green focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={commitRename}
                    className="shrink-0 text-neon-green"
                    aria-label="Save name"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setNameDraft(zone.label);
                    setEditingName(true);
                  }}
                  className="flex min-w-0 items-center gap-1 truncate text-xs font-semibold text-ink-hi hover:text-neon-green"
                  title="Rename device"
                >
                  <span className="truncate">{zone.label}</span>
                  <Pencil size={11} className="shrink-0 text-ink-low" />
                </button>
              )}
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleZoneMute(zone.id)}
                  className="text-ink-mid hover:text-neon-green"
                  aria-label={zone.muted ? "Unmute zone" : "Mute zone"}
                >
                  {zone.muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                {zone.kind && zone.kind !== "default" && (
                  <button
                    type="button"
                    onClick={() => removeDevice(zone.id)}
                    className="text-ink-mid hover:text-pulse-pink"
                    aria-label="Remove device"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={zone.volume}
              onChange={(e) => setZoneVolume(zone.id, Number(e.target.value))}
              className="w-full"
              aria-label={`${zone.label} local volume`}
            />
            <div className="mt-1 flex justify-between text-[10px] font-mono text-ink-low">
              <span>0</span>
              <span>{zone.volume}</span>
              <span>100</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function SoundMap() {
  const { zones, masterVolume, updateMasterVolume } = usePlayback();
  const canvasRef = useRef(null);

  return (
    <section className="flex h-full flex-col rounded-xl2 border border-void-line bg-panel-gradient p-5 shadow-inset-line">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-hi">SoundMap</h2>
          <p className="text-xs text-ink-mid">
            Drag devices to regroup zones. Tap a bubble for local volume &mdash; every device signed into
            your account plays the same track together.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-void-line bg-void-raised px-3 py-1.5">
            <Sliders size={14} className="text-neon-green" />
            <span className="text-[11px] font-mono text-ink-mid">MASTER</span>
            <input
              type="range"
              min={0}
              max={100}
              value={masterVolume}
              onChange={(e) => updateMasterVolume(Number(e.target.value))}
              className="w-28"
              aria-label="Master volume, scales all zones proportionally"
            />
            <span className="w-8 text-right text-[11px] font-mono text-neon-green">{masterVolume}%</span>
          </div>
          <AddDeviceMenu />
        </div>
      </header>

      <div
        ref={canvasRef}
        className="relative flex-1 overflow-hidden rounded-xl border border-void-line/70 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:22px_22px]"
      >
        {/* Room outlines for spatial context */}
        <div className="pointer-events-none absolute inset-4 grid grid-cols-2 grid-rows-2 gap-3">
          <div className="rounded-lg border border-dashed border-electric-violet/25" />
          <div className="rounded-lg border border-dashed border-neon-greendim/30" />
          <div className="rounded-lg border border-dashed border-pulse-pink/20" />
          <div className="rounded-lg border border-dashed border-neon-greendim/30" />
        </div>

        {zones.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center">
            <p className="text-xs text-ink-low">
              No devices yet. Use &ldquo;Add device&rdquo; to pair Bluetooth speakers or name a device by hand
              &mdash; every real device you sign into shows up here automatically.
            </p>
          </div>
        )}
        {zones.map((zone) => (
          <DeviceBubble key={zone.id} zone={zone} canvasRef={canvasRef} />
        ))}
      </div>
    </section>
  );
}
