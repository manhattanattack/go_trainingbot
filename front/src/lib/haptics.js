import WebApp from "@twa-dev/sdk"

function feedback() {
  try {
    return WebApp?.HapticFeedback || null
  } catch {
    return null
  }
}

export function hapticSelection() {
  try { feedback()?.selectionChanged?.() } catch { /* Unsupported client. */ }
}

export function hapticImpact(style = "light") {
  try { feedback()?.impactOccurred?.(style) } catch { /* Unsupported client. */ }
}

export function hapticNotification(type = "success") {
  try { feedback()?.notificationOccurred?.(type) } catch { /* Unsupported client. */ }
}
