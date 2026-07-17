import { useState } from "react";
import { Plus, Bluetooth, Keyboard, X, Loader2 } from "lucide-react";
import { usePlayback } from "../context/PlaybackContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const bluetoothSupported = typeof navigator !== "undefined" && "bluetooth" in navigator;

export default function AddDeviceMenu() {
  const { addDevice } = usePlayback();
  const { isSignedIn, firebaseConfigured } = useAuth();
  const [open, setOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [pairing, setPairing] = useState(false);
  const [error, setError] = useState(null);

  const close = () => {
    setOpen(false);
    setError(null);
    setManualName("");
  };

  const handleBluetoothPair = async () => {
    setError(null);
    if (!bluetoothSupported) {
      setError("Web Bluetooth isn't supported in this browser (works in Chrome/Edge on desktop or Android).");
      return;
    }
    setPairing(true);
    try {
      const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
      await addDevice({ label: device.name || "Bluetooth device", kind: "bluetooth" });
      close();
    } catch (err) {
      // User cancelling the picker also lands here — only surface real errors.
      if (err?.name !== "NotFoundError") {
        setError(err?.message ?? "Couldn't pair that device.");
      }
    } finally {
      setPairing(false);
    }
  };

  const handleManualAdd = async () => {
    const trimmed = manualName.trim();
    if (!trimmed) return;
    await addDevice({ label: trimmed, kind: "manual" });
    close();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-void-line bg-void-raised px-3 py-1.5 text-xs text-ink-mid hover:border-neon-green hover:text-neon-green"
      >
        <Plus size={14} />
        Add device
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl2 border border-void-line bg-void-panel/95 p-3 shadow-glow-soft backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-hi">Add a device</span>
            <button type="button" onClick={close} className="text-ink-mid hover:text-ink-hi">
              <X size={14} />
            </button>
          </div>

          {firebaseConfigured && !isSignedIn && (
            <p className="mb-2 rounded-lg bg-void-raised px-2 py-1.5 text-[11px] text-ink-mid">
              Sign in to have devices sync across every session on your account.
            </p>
          )}

          <button
            type="button"
            onClick={handleBluetoothPair}
            disabled={pairing}
            className="mb-2 flex w-full items-center gap-2 rounded-lg border border-void-line px-3 py-2 text-sm text-ink-hi hover:border-electric-purple hover:text-electric-purple disabled:opacity-60"
          >
            {pairing ? <Loader2 size={15} className="animate-spin" /> : <Bluetooth size={15} />}
            {pairing ? "Waiting for device…" : "Pair Bluetooth device"}
          </button>

          <div className="mb-2 flex items-center gap-2">
            <input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
              placeholder="Or name a device manually"
              className="w-full rounded-lg border border-void-line bg-void-raised px-2 py-1.5 text-sm text-ink-hi placeholder:text-ink-low focus:border-neon-green focus:outline-none"
            />
            <button
              type="button"
              onClick={handleManualAdd}
              className="shrink-0 rounded-lg border border-void-line p-1.5 text-ink-mid hover:border-neon-green hover:text-neon-green"
              aria-label="Add named device"
            >
              <Keyboard size={15} />
            </button>
          </div>

          {error && <p className="text-[11px] text-pulse-pink">{error}</p>}

          <p className="mt-1 text-[10px] leading-relaxed text-ink-low">
            Bluetooth pairing confirms the device and adds it to your SoundMap. Browsers can&apos;t route
            audio output to it directly &mdash; that&apos;s controlled by your OS&apos;s system audio
            settings.
          </p>
        </div>
      )}
    </div>
  );
}
