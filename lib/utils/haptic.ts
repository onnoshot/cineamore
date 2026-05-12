"use client";

export function haptic(duration = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(duration);
  }
}

export function hapticLight() { haptic(8); }
export function hapticMedium() { haptic(20); }
export function hapticSuccess() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([10, 50, 10]);
  }
}
export function hapticError() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([20, 50, 20, 50, 20]);
  }
}
