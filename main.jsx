const STORAGE_KEY = "musiclocke_device_id";

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Returns a stable identifier for the physical browser/device this code is
 * running on. Persisted in localStorage so it survives reloads and lets us
 * recognize "this device" again on the next visit — that's how we know
 * whether the current session already has a named entry on the SoundMap.
 */
export function getThisDeviceId() {
  if (typeof window === "undefined" || !window.localStorage) return generateId();
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = generateId();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    // Storage disabled (private browsing, etc.) — fall back to an id that
    // lasts for this tab's lifetime only.
    return generateId();
  }
}

/** Best-effort guess at a friendly default name for this device. */
export function guessDeviceLabel() {
  if (typeof navigator === "undefined") return "This device";
  const ua = navigator.userAgent || "";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? "Android phone" : "Android tablet";
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Linux/i.test(ua)) return "Linux PC";
  return "This device";
}
