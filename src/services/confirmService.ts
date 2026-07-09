export type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

type Listener = (options: ConfirmOptions | null) => void;

let currentRequest: ConfirmOptions | null = null;
const listeners = new Set<Listener>();

export const confirmService = {
  show(options: ConfirmOptions) {
    currentRequest = options;
    listeners.forEach((listener) => listener(currentRequest));
  },
  hide() {
    currentRequest = null;
    listeners.forEach((listener) => listener(currentRequest));
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(currentRequest);
    return () => {
      listeners.delete(listener);
    };
  },
};
