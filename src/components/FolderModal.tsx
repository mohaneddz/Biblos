import { useState } from "react";
import type { Folder } from "../types/animal";
import { createFolder, updateFolder } from "../services/cache";
import { toastService } from "../services/toastService";
import { FOLDER_ICON_OPTIONS, FolderIconDisplay } from "./FolderIconDisplay";

type FolderModalProps = {
  folder?: Folder | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (folder: Folder) => void;
};

export function FolderModal({ folder, isOpen, onClose, onSaved }: FolderModalProps) {
  const [name, setName] = useState(folder?.name ?? "");
  const [description, setDescription] = useState(folder?.description ?? "");
  const [icon, setIcon] = useState(folder?.icon ?? "folder");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastService.error("Folder name is required");
      return;
    }

    if (folder) {
      const updated = updateFolder(folder.id, {
        name: name.trim(),
        description: description.trim(),
        icon,
      });
      if (updated) {
        toastService.success(`Folder "${updated.name}" updated`);
        onSaved?.(updated);
      }
    } else {
      const created = createFolder(name.trim(), description.trim(), icon);
      toastService.success(`Folder "${created.name}" created`);
      onSaved?.(created);
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-[6px] p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(25,30,27,0.98),rgba(10,13,11,0.98))] p-6 shadow-2xl animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-semibold text-white tracking-wide flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <FolderIconDisplay iconKey={icon} className="h-5 w-5 text-app-accent" />
            </span>
            <span>{folder ? "Edit Folder" : "Create New Folder"}</span>
          </h2>
          <button
            type="button"
            className="text-app-soft hover:text-white transition p-1 cursor-pointer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-app-soft mb-1.5">
              Folder Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Predators, Deep Sea Wonders"
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-app-muted/40 focus:border-app-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-app-soft mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what goes in this collection..."
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-app-muted/40 focus:border-app-accent focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-app-soft mb-1.5">
              Choose Icon
            </label>
            <div className="grid grid-cols-6 gap-2 min-h-40 overflow-y-auto p-1.5 border border-white/5 rounded-xl bg-white/[0.02]">
              {FOLDER_ICON_OPTIONS.map((opt) => {
                const isSelected = icon === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    title={opt.label}
                    onClick={() => setIcon(opt.key)}
                    className={`h-10 w-full rounded-xl flex items-center justify-center transition cursor-pointer ${isSelected
                        ? "bg-app-accent/20 border border-app-accent text-app-accent scale-105 shadow-md"
                        : "bg-white/5 hover:bg-white/10 text-app-soft hover:text-white border border-transparent"
                      }`}
                  >
                    <FolderIconDisplay iconKey={opt.key} className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              className="ghost-button px-4 py-2 text-xs rounded-xl min-h-0 cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button px-5 py-2 text-xs rounded-xl min-h-0 cursor-pointer"
            >
              {folder ? "Save Changes" : "Create Folder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
