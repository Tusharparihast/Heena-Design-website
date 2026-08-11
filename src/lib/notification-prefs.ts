const SOUND_KEY = "nd-admin-notify-sound";

export function isNotificationSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SOUND_KEY) === "1";
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  window.localStorage.setItem(SOUND_KEY, enabled ? "1" : "0");
}

export async function requestBrowserPushPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

export function browserPushPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/** A short two-tone chime — no audio file needed. */
export function playNotificationChime(): void {
  if (!isNotificationSoundEnabled()) return;
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio unavailable — silently skip.
  }
}

/** Show a desktop notification when the admin granted permission. */
export function showBrowserNotification(title: string, body: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag: "nagma-admin" });
  } catch {
    // Notification unavailable — silently skip.
  }
}
