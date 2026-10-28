// Small values kept on this device only (appearance, last tree stage seen), readable from React
// with useSyncExternalStore. Storage can be blocked, so every access is wrapped.

const EVENT = "device-store";

export function readDevice(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeDevice(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeDevice(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** Applies the Appearance choice to <html data-theme> (DEC-031). */
export function applyTheme(choice: "system" | "light" | "dark") {
  writeDevice("theme", choice === "system" ? null : choice);
  if (choice === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = choice;
}
