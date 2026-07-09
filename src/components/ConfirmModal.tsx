import { useEffect, useState } from "react";
import { confirmService, type ConfirmOptions } from "../services/confirmService";

export function ConfirmModal() {
  const [request, setRequest] = useState<ConfirmOptions | null>(null);

  useEffect(() => {
    return confirmService.subscribe(setRequest);
  }, []);

  useEffect(() => {
    if (!request) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        request.onCancel?.();
        confirmService.hide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [request]);

  if (!request) return null;

  const handleConfirm = () => {
    request.onConfirm();
    confirmService.hide();
  };

  const handleCancel = () => {
    request.onCancel?.();
    confirmService.hide();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-[6px] p-4 animate-fade-in"
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(25,30,27,0.98),rgba(10,13,11,0.98))] p-6 shadow-2xl animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white tracking-wide">
          {request.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-app-muted">
          {request.message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="ghost-button px-4 py-2 text-xs rounded-xl min-h-0 cursor-pointer"
            onClick={handleCancel}
          >
            {request.cancelText || "Cancel"}
          </button>
          <button
            type="button"
            className="primary-button px-5 py-2 text-xs rounded-xl min-h-0 cursor-pointer"
            onClick={handleConfirm}
          >
            {request.confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
