"use client";

import { useState } from "react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmButtonText: string;
  confirmPendingText?: string;
  cancelButtonText?: string;
  isConfirmDisabled?: boolean;
  panelClassName?: string;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmButtonText,
  confirmPendingText = "처리중...",
  cancelButtonText = "취소",
  isConfirmDisabled = false,
  panelClassName = "mx-4 w-full max-w-sm rounded-3xl border border-pink-100 bg-white p-8 shadow-2xl",
}: ConfirmModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    if (isConfirming || isConfirmDisabled) return;
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm"
      onClick={() => {
        if (!isConfirming) onClose();
      }}
    >
      <article className={panelClassName} onClick={(e) => e.stopPropagation()}>
        <header className="mb-4 text-center">
          <p className="mb-2 text-3xl">🌸</p>
          <h2 className="text-lg font-bold text-slate-700">{title}</h2>
          <p className="mt-2 text-sm font-bold text-[#E72566]">{description}</p>
        </header>
        <footer className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="cursor-pointer flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500 transition-all hover:bg-slate-50"
          >
            {cancelButtonText}
          </button>
          <button
            type="button"
            disabled={isConfirmDisabled || isConfirming}
            onClick={handleConfirm}
            className="cursor-pointer flex-1 rounded-full bg-amber-100 px-4 py-2.5 text-sm font-bold text-amber-600 transition-all hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConfirming ? confirmPendingText : confirmButtonText}
          </button>
        </footer>
      </article>
    </div>
  );
}
