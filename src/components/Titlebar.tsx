import { getCurrentWindow } from "@tauri-apps/api/window";
import type { ReactNode } from "react";
import { CloseIcon, MaximizeIcon, MinimizeIcon } from "./icons";

async function runWindowAction(action: "minimize" | "toggleMaximize" | "close") {
  try {
    const appWindow = getCurrentWindow();
    await appWindow[action]();
  } catch (error) {
    console.warn(`Titlebar action '${action}' is only available inside Tauri.`, error);
  }
}

function TitlebarButton({
  id,
  label,
  close,
  onClick,
  children,
}: {
  id: string;
  label: string;
  close?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      id={id}
      type="button"
      aria-label={label}
      onClick={onClick}
      className={[
        "flex h-10 w-12 cursor-pointer items-center justify-center text-white/88 transition",
        close ? "hover:bg-[#cb4b4b] hover:text-white" : "hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function Titlebar() {
  return (
    <div
      data-tauri-drag-region
      className="fixed inset-x-0 top-0 z-50 flex h-10 items-center justify-end border-b border-white/7 bg-black/30 backdrop-blur-xl"
    >
      <TitlebarButton id="titlebar-minimize" label="Minimize window" onClick={() => void runWindowAction("minimize")}>
        <MinimizeIcon className="h-4 w-4" />
      </TitlebarButton>
      <TitlebarButton id="titlebar-maximize" label="Maximize window" onClick={() => void runWindowAction("toggleMaximize")}>
        <MaximizeIcon className="h-4 w-4" />
      </TitlebarButton>
      <TitlebarButton id="titlebar-close" label="Close window" close onClick={() => void runWindowAction("close")}>
        <CloseIcon className="h-4 w-4" />
      </TitlebarButton>
    </div>
  );
}
