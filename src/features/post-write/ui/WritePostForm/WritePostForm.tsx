"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@shared/ui/Button";
import { useAuthStore } from "@entities/user/model/auth-store";
import { ROUTES } from "@shared/config/routes";
import { CancelConfirmModal } from "./CancelConfirmModal";
import {
  WRITE_CATEGORIES,
  labelToCategory,
} from "@entities/post/model/category";
import { useCreateBoard } from "@features/auth/api/useCreateBoard";

const TITLE_MAX = 100;
const CONTENT_MAX = 10000;
const FILE_MAX_SIZE_MB = 10;
const FILE_MAX_SIZE = FILE_MAX_SIZE_MB * 1024 * 1024;
const FILE_MAX_COUNT = 5;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const ALLOWED_EXT = ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx";

export function WritePostForm() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { mutate: createBoard, isPending } = useCreateBoard({
    onSuccess: () => router.push(ROUTES.DASHBOARD),
    onError: (error) => alert(`글 작성 실패: ${error.message}`),
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // 카테고리 관리
  const [category, setCategory] = useState<string>(WRITE_CATEGORIES[0].label);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const combined = [...files, ...selected];
    if (combined.length > FILE_MAX_COUNT) {
      setFileError(`파일은 최대 ${FILE_MAX_COUNT}개까지 첨부할 수 있어요.`);
      return;
    }
    const oversize = selected.find((f) => f.size > FILE_MAX_SIZE);
    if (oversize) {
      setFileError(`파일 크기는 ${FILE_MAX_SIZE_MB}MB 이하만 가능해요.`);
      return;
    }
    const invalid = selected.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalid) {
      setFileError(
        "지원하지 않는 파일 형식이에요. (이미지, PDF, Word, Excel 가능)",
      );
      return;
    }
    setFiles(combined);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError("");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    if (!title.trim()) {
      setTitleError("제목을 입력해주세요.");
      hasError = true;
    } else setTitleError("");
    if (!content.trim()) {
      setContentError("내용을 입력해주세요.");
      hasError = true;
    } else setContentError("");
    if (hasError) {
      if (!title.trim()) titleRef.current?.focus();
      else contentRef.current?.focus();
      return;
    }
    createBoard({
      title: title.trim(),
      content: content.trim(),
      category: labelToCategory(category),
      file: files[0],
    });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto max-w-2xl space-y-6"
      >
        {/* 제목 */}
        <fieldset className="space-y-1.5">
          <label className="block text-base font-bold text-slate-600">
            🌸 제목
          </label>
          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value.slice(0, TITLE_MAX));
              if (titleError) setTitleError("");
            }}
            ref={titleRef}
            className={`w-full rounded-2xl border px-4 py-2.5 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all
            ${titleError ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-pink-300 focus:ring-pink-100"}`}
          />
          {titleError && (
            <small className="text-xs text-red-400" role="alert">
              ⚠ {titleError}
            </small>
          )}
          <p className="text-right text-xs text-slate-400">
            {title.length} / {TITLE_MAX}
          </p>
        </fieldset>

        {/* 카테고리 */}
        <fieldset className="space-y-2">
          <legend className="text-base font-bold text-slate-600">
            🌸 카테고리
          </legend>
          <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
            {WRITE_CATEGORIES.map((cat) => (
              <li key={cat.value}>
                <button
                  type="button"
                  onClick={() => setCategory(cat.label)}
                  aria-pressed={category === cat.label}
                  className={`cursor-pointer rounded-full px-5 py-2 text-base font-semibold transition-all duration-200
                  ${
                    category === cat.label
                      ? "bg-gradient-to-r from-pink-300 to-purple-300 text-white shadow-md shadow-pink-100 -translate-y-0.5"
                      : "bg-white/70 text-slate-500 border border-slate-200 hover:bg-pink-50 hover:border-pink-200 hover:-translate-y-0.5"
                  }`}
                >
                  {cat.label}
                </button>
              </li>
            ))}
          </ul>
        </fieldset>

        {/* 내용 */}
        <fieldset className="space-y-1.5">
          <legend className="text-base font-bold text-slate-600">
            🌸 내용
          </legend>
          <textarea
            placeholder="내용을 입력하세요"
            value={content}
            ref={contentRef}
            onChange={(e) => {
              setContent(e.target.value.slice(0, CONTENT_MAX));
              if (contentError) setContentError("");
            }}
            rows={12}
            className={`w-full resize-none overflow-y-auto rounded-2xl border px-4 py-3 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all bg-white/80
            ${contentError ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-pink-300 focus:ring-pink-100"}`}
          />
          {contentError && (
            <small className="text-xs text-red-400" role="alert">
              ⚠ {contentError}
            </small>
          )}
          <p className="text-right text-xs text-slate-400">
            {content.length.toLocaleString()} / {CONTENT_MAX.toLocaleString()}
          </p>
        </fieldset>

        {/* 파일 첨부 */}
        <fieldset className="space-y-2">
          <legend className="text-base font-bold text-slate-600">
            🌸 파일 첨부
            <span
              className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold text-white
            ${files.length >= FILE_MAX_COUNT ? "bg-pink-400" : "bg-slate-300"}`}
            >
              {files.length} / {FILE_MAX_COUNT}
            </span>
          </legend>

          {/* 업로드된 파일 목록 */}
          {files.length > 0 && (
            <ul className="space-y-1.5 list-none p-0 m-0">
              {files.map((file, i) => (
                <li
                  key={i}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-600"
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="text-base">
                      {file.type.startsWith("image/")
                        ? "🖼️"
                        : file.type === "application/pdf"
                          ? "📄"
                          : "📎"}
                    </span>
                    <span className="truncate max-w-xs">{file.name}</span>
                    <span className="text-xs text-slate-400 shrink-0">
                      {formatSize(file.size)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label={`${file.name} 삭제`}
                    className="cursor-pointer ml-2 w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-xs flex items-center justify-center shrink-0 hover:bg-red-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* 파일 선택 버튼 */}
          {files.length < FILE_MAX_COUNT && (
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 px-5 py-2 text-sm font-semibold text-slate-400 hover:border-orange-300 hover:text-orange-400 transition-all duration-200">
              <span>📎 파일 선택</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_EXT}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
          {fileError && (
            <small className="text-xs text-red-400" role="alert">
              ⚠ {fileError}
            </small>
          )}
          <p className="text-xs text-slate-400">
            이미지(JPG·PNG·GIF·WEBP), PDF, Word, Excel · 최대 {FILE_MAX_SIZE_MB}
            MB · {FILE_MAX_COUNT}개까지
          </p>
        </fieldset>

        {/* 버튼 */}
        <footer className="flex justify-end gap-2">
          <button
            type="submit"
            className="cursor-pointer rounded-full px-6 py-2.5 text-base font-bold bg-amber-100 text-amber-600 shadow-sm shadow-amber-100 hover:bg-amber-200 transition-all border border-amber-200"
          >
            작성
          </button>
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="cursor-pointer rounded-full px-6 py-2.5 text-base font-bold border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all"
          >
            취소
          </button>
        </footer>
      </form>

      {/* 취소 확인 모달 */}
      {showCancelModal && (
        <CancelConfirmModal
          onConfirm={() => router.push(ROUTES.DASHBOARD)}
          onCancel={() => setShowCancelModal(false)}
        />
      )}
    </>
  );
}
