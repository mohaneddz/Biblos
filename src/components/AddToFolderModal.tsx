import { useState, useEffect } from "react";
import type { Animal, Folder } from "../types/animal";
import { getFolders, toggleAnimalInFolder, createFolder } from "../services/cache";
import { toastService } from "../services/toastService";
import { FolderIcon } from "./icons";
import { SpeciesImage } from "./SpeciesImage";
import { FOLDER_ICON_OPTIONS, FolderIconDisplay } from "./FolderIconDisplay";

type AddToFolderModalProps = {
  animal: Animal | null;
  isOpen: boolean;
  onClose: () => void;
};

export function AddToFolderModal({ animal, isOpen, onClose }: AddToFolderModalProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("folder");

  useEffect(() => {
    if (isOpen) {
      setFolders(getFolders());
      const handleCacheUpdated = () => setFolders(getFolders());
      window.addEventListener("biblos-cache-updated", handleCacheUpdated);
      return () => window.removeEventListener("biblos-cache-updated", handleCacheUpdated);
    }
  }, [isOpen]);

  if (!isOpen || !animal) return null;

  const handleToggle = (folder: Folder) => {
    const isMember = folder.animalIds.includes(animal.id);
    toggleAnimalInFolder(folder.id, animal.id);
    toastService.success(
      isMember
        ? `Removed "${animal.commonName}" from ${folder.name}`
        : `Added "${animal.commonName}" to ${folder.name}`
    );
  };

  const handleCreateInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newFolder = createFolder(newFolderName.trim(), "", newFolderIcon);
    toggleAnimalInFolder(newFolder.id, animal.id);
    toastService.success(`Created folder "${newFolder.name}" and added "${animal.commonName}"`);
    setNewFolderName("");
    setIsCreatingInline(false);
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
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-xl border border-white/10 shrink-0">
              <SpeciesImage animal={animal} className="h-full w-full object-cover" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide">Add to Collection</h2>
              <p className="text-xs italic text-app-muted">{animal.commonName}</p>
            </div>
          </div>
          <button
            type="button"
            className="text-app-soft hover:text-white transition p-1 cursor-pointer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="mt-4 max-h-64 overflow-y-auto space-y-2 pr-1">
          {folders.length > 0 ? (
            folders.map((folder) => {
              const isMember = folder.animalIds.includes(animal.id);
              return (
                <div
                  key={folder.id}
                  onClick={() => handleToggle(folder)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                    isMember
                      ? "border-app-accent/40 bg-app-accent/10 text-white"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/5 text-app-muted hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-app-accent shrink-0">
                      <FolderIconDisplay iconKey={folder.icon} className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium leading-tight">{folder.name}</p>
                      <p className="text-[11px] text-app-soft">
                        {folder.animalIds.length} {folder.animalIds.length === 1 ? "species" : "species"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-md border flex items-center justify-center transition ${
                      isMember ? "border-app-accent bg-app-accent text-white" : "border-white/20 bg-white/5"
                    }`}
                  >
                    {isMember && <span className="text-xs font-bold">✓</span>}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-app-muted bg-white/[0.02] rounded-xl border border-white/5">
              No custom folders created yet.
            </div>
          )}
        </div>

        {/* Quick Inline Create Folder */}
        {isCreatingInline ? (
          <form onSubmit={handleCreateInline} className="mt-4 p-3 rounded-xl border border-white/10 bg-white/5 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                autoFocus
                className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder-app-muted/40 focus:outline-none"
              />
              <select
                value={newFolderIcon}
                onChange={(e) => setNewFolderIcon(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                {FOLDER_ICON_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="ghost-button px-3 py-1 text-[11px] min-h-0 cursor-pointer"
                onClick={() => setIsCreatingInline(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button px-3 py-1 text-[11px] min-h-0 cursor-pointer"
              >
                Add Folder
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <button
              type="button"
              className="flex items-center gap-2 text-xs font-medium text-app-accent hover:underline cursor-pointer"
              onClick={() => setIsCreatingInline(true)}
            >
              <FolderIcon className="h-4 w-4" />
              <span>+ Create new folder</span>
            </button>
            <button
              type="button"
              className="primary-button px-4 py-1.5 text-xs rounded-xl min-h-0 cursor-pointer"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
