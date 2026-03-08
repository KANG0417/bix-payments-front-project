"use client";

interface CancelConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function CancelConfirmModal({
  onConfirm,
  onCancel,
}: CancelConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onCancel}
    >
      <article
        className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl border border-pink-100 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 text-center">
          <p className="text-3xl mb-2">🌸</p>
          <h2 className="text-lg font-bold text-slate-700">
            작성을 취소할까요?
          </h2>
          <p className="mt-2 text-sm text-[#E72566] font-bold">
            지금까지 입력한 내용이 모두 사라져요.
          </p>
        </header>
        <footer className="flex gap-2 justify-center mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer flex-1 rounded-full bg-amber-100 px-4 py-2.5 text-sm font-semibold font-bold bg-amber-100 text-amber-600 hover:bg-amber-200 transition-all"
          >
            확인
          </button>
        </footer>
      </article>
    </div>
  );
}
