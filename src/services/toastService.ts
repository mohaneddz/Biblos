import { getSettings } from "./cache";

type ToastType = "info" | "success" | "warning" | "error";

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();

export const toastService = {
  show(message: string, type: ToastType = "info", duration = 4000) {
    const settings = getSettings();
    if (type === "error" && settings.enableErrorToasts === false) {
      return;
    }
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, message, type, duration };
    toasts = [...toasts, toast];
    listeners.forEach((listener) => listener(toasts));

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  },
  error(message: string, duration = 5000) {
    this.show(message, "error", duration);
  },
  success(message: string, duration = 3000) {
    this.show(message, "success", duration);
  },
  warning(message: string, duration = 4000) {
    this.show(message, "warning", duration);
  },
  info(message: string, duration = 3000) {
    this.show(message, "info", duration);
  },
  dismiss(id: string) {
    toasts = toasts.filter((t) => t.id !== id);
    listeners.forEach((listener) => listener(toasts));
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(toasts);
    return () => {
      listeners.delete(listener);
    };
  },
};
