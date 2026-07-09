import { getSettings } from "./cache";
import { toastService } from "./toastService";

export function reportError(message: string, error?: any) {
  const settings = getSettings();

  // 1. Console logs (defaults to true if undefined or not explicitly false)
  if (settings.enableErrorConsoleLogs !== false) {
    if (error !== undefined) {
      console.error(`[Biblos Error] ${message}`, error);
    } else {
      console.error(`[Biblos Error] ${message}`);
    }
  }

  // 2. Toast notifications (defaults to true if undefined or not explicitly false)
  if (settings.enableErrorToasts !== false) {
    toastService.error(message);
  }
}
