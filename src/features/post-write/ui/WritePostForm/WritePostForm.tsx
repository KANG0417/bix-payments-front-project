"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ROUTES } from "@shared/config/routes";
import { CancelConfirmModal } from "./CancelConfirmModal";
import {
  WRITE_CATEGORIES,
  categoryToLabel,
  labelToCategory,
} from "@entities/post/model/category";
import { getBoardDetail, updateBoard } from "@features/post/api/board";
import { useCreateBoard } from "@features/auth/api/useCreateBoard";

const TITLE_MAX = 40;
const CONTENT_MAX = 10000;
const FILE_MAX_SIZE_MB = 10;
const FILE_MAX_SIZE = FILE_MAX_SIZE_MB * 1024 * 1024;
const FILE_MAX_COUNT = 1;
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
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://front-mission.bigs.or.kr"
).replace(/\/$/, "");

interface ExistingAttachment {
  name: string;
  url: string;
  size?: number;
}

function resolveApiUrl(rawUrl: string) {
  const url = String(rawUrl ?? "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
}

function guessFileNameFromUrl(url: string) {
  try {
    const pathname = new URL(url, API_BASE_URL).pathname;
    const last = pathname.split("/").pop();
    return decodeURIComponent(last || "첨부파일");
  } catch {
    return "첨부파일";
  }
}

function toAttachment(item: unknown): ExistingAttachment | null {
  if (typeof item === "string") {
    const url = resolveApiUrl(item.trim());
    if (!url) return null;
    return { url, name: guessFileNameFromUrl(url) };
  }
  if (!item || typeof item !== "object") return null;

  const obj = item as Record<string, unknown>;
  const rawUrl = [
    obj.imageUrl,
    obj.downloadUrl,
    obj.fileUrl,
    obj.url,
    obj.path,
    obj.link,
    obj.presignedUrl,
  ]
    .map((v) => String(v ?? "").trim())
    .find(Boolean);

  if (!rawUrl) return null;
  const resolvedUrl = resolveApiUrl(rawUrl);
  if (!resolvedUrl) return null;

  const name =
    [
      obj.originalFileName,
      obj.fileName,
      obj.filename,
      obj.name,
      obj.storedFileName,
    ]
      .map((v) => String(v ?? "").trim())
      .find(Boolean) ?? guessFileNameFromUrl(resolvedUrl);

  const sizeNum = Number(obj.fileSize ?? obj.size);
  return {
    name,
    url: resolvedUrl,
    size: Number.isFinite(sizeNum) ? sizeNum : undefined,
  };
}

function extractAttachments(raw: unknown): ExistingAttachment[] {
  const data = (raw ?? {}) as Record<string, unknown>;
  const candidates = [
    data.files,
    data.attachments,
    data.attachmentFiles,
    data.fileList,
    data.uploadedFiles,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const attachments = candidate
      .map(toAttachment)
      .filter(Boolean) as ExistingAttachment[];
    if (attachments.length > 0) return attachments;
  }

  const single = toAttachment(data.file ?? data.attachment);
  if (single) return [single];

  const directImage = toAttachment(data.imageUrl ?? data.image ?? data.thumbnailUrl);
  if (directImage) return [directImage];

  return [];
}

function resolveCategoryLabel(input: unknown) {
  const raw = String(input ?? "").trim();
  if (!raw) return WRITE_CATEGORIES[0].label;

  const lowered = raw.toLowerCase();
  const byLabel = WRITE_CATEGORIES.find(
    (cat) => cat.label.trim().toLowerCase() === lowered,
  );
  if (byLabel) return byLabel.label;

  const byValue = WRITE_CATEGORIES.find(
    (cat) => String(cat.value).trim().toLowerCase() === lowered,
  );
  if (byValue) return byValue.label;

  return categoryToLabel(raw as ReturnType<typeof labelToCategory>);
}

export function WritePostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const mode = searchParams.get("mode");
  const editId = Number(searchParams.get("id"));
  const isEditMode = mode === "edit" && Number.isFinite(editId);

  const { mutate: createBoard, isPending } = useCreateBoard({
    onSuccess: async () => {
      await queryClient.removeQueries({ queryKey: ["boards"] });
      router.push(`${ROUTES.DASHBOARD}?sort=latest`);
    },
    onError: (error) => alert(`글 작성 실패: ${error.message}`),
  });

  const { data: editData, isLoading: isEditLoading } = useQuery({
    queryKey: ["board", editId],
    queryFn: () => getBoardDetail(editId),
    enabled: isEditMode,
  });

  const { mutate: patchBoard, isPending: isPatchPending } = useMutation({
    mutationFn: (variables: {
      id: number;
      title: string;
      content: string;
      category: ReturnType<typeof labelToCategory>;
      file?: File;
    }) =>
      updateBoard(
        variables.id,
        {
          title: variables.title,
          content: variables.content,
          category: variables.category,
        },
        variables.file,
      ),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["boards"] });
      await queryClient.invalidateQueries({ queryKey: ["board", variables.id] });
      router.push(`${ROUTES.DASHBOARD}/${variables.id}`);
    },
    onError: (error: Error) => alert(`글 수정 실패: ${error.message}`),
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // 카테고리 관리
  const [category, setCategory] = useState<string>(WRITE_CATEGORIES[0].label);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>(
    [],
  );
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const didHydrateEditRef = useRef(false);

  useEffect(() => {
    didHydrateEditRef.current = false;
    if (!isEditMode) {
      setTitle("");
      setContent("");
      setCategory(WRITE_CATEGORIES[0].label);
      setFiles([]);
      setExistingAttachments([]);
      setFileError("");
      setEditMessage("");
    }
  }, [isEditMode, editId]);

  useEffect(() => {
    if (!isEditMode || !editData || didHydrateEditRef.current) return;
    setTitle((editData.title ?? "").slice(0, TITLE_MAX));
    setContent((editData.content ?? "").slice(0, CONTENT_MAX));
    setCategory(resolveCategoryLabel(editData.category));
    setExistingAttachments(extractAttachments(editData));
    didHydrateEditRef.current = true;
  }, [isEditMode, editData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    const targetFile = selected[0];
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
    // 단일 파일만 허용: 새로 선택하면 기존 파일을 교체한다.
    setFiles([targetFile]);
    setFileError("");
    if (selected.length > 0) setEditMessage("");
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
    setEditMessage("");
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
    const payload = {
      title: title.trim(),
      content: content.trim(),
      category: labelToCategory(category),
      file: files[0],
    };

    if (isEditMode) {
      const originalTitle = (editData?.title ?? "").trim().slice(0, TITLE_MAX);
      const originalContent = (editData?.content ?? "").trim().slice(0, CONTENT_MAX);
      const titleChanged = payload.title !== originalTitle;
      const contentChanged = payload.content !== originalContent;
      const fileChanged = files.length > 0;

      if (!titleChanged && !contentChanged && !fileChanged) {
        setEditMessage("수정된 내용이 없어요. 제목이나 내용을 변경해주세요.");
        setTitleError("수정된 내용이 없어요.");
        setContentError("수정된 내용이 없어요.");
        titleRef.current?.focus();
        return;
      }

      patchBoard({ id: editId, ...payload });
      return;
    }

    createBoard(payload);
  };

  const isSubmitting = isPending || isPatchPending;

  if (isEditMode && isEditLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-6">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-12 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-48 w-full animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

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
          <div className="group relative">
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value.slice(0, TITLE_MAX));
                if (titleError) setTitleError("");
                if (editMessage) setEditMessage("");
              }}
              ref={titleRef}
              className={`w-full rounded-2xl border px-4 py-2.5 pr-10 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all
            ${titleError ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-pink-300 focus:ring-pink-100"}`}
            />
            <button
              type="button"
              onClick={() => {
                setTitle("");
                setTitleError("");
                titleRef.current?.focus();
              }}
              disabled={title.length === 0}
              aria-label="제목 전체 삭제"
              className="cursor-pointer absolute right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-slate-200 bg-white text-sm text-slate-400 opacity-0 transition hover:bg-slate-50 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
            >
              x
            </button>
          </div>
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
        <fieldset className="space-y-3">
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
              if (editMessage) setEditMessage("");
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

          {isEditMode && existingAttachments.length > 0 && (
            <div className="mt-2 rounded-2xl border border-amber-100 bg-amber-50/60 p-3">
              <p className="mb-2 text-xs font-semibold text-amber-700">기존 첨부파일</p>
              <ul className="space-y-1.5 list-none p-0 m-0">
                {existingAttachments.map((file) => (
                  <li
                    key={`${file.url}-${file.name}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-amber-100 bg-white/90 px-3 py-2 text-sm text-slate-700"
                  >
                    <span className="truncate">{file.name}</span>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-full border border-[#f6c7b2] bg-[#ffe8dc] px-3 py-1 text-xs font-semibold text-[#b76842] transition hover:bg-[#ffdccc]"
                    >
                      미리보기
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-100/70 px-2 py-1 text-xs font-semibold text-amber-900">
                새 파일을 첨부하면 기존 첨부파일은 서버 정책에 따라 교체될 수 있어요.
              </p>
            </div>
          )}

          {/* 업로드된 파일 목록 */}
          {files.length > 0 && (
            <ul className="mt-2 space-y-1.5 list-none p-0 m-0">
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
            <label className="mt-2 cursor-pointer inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 px-5 py-2 text-sm font-semibold text-slate-400 hover:border-orange-300 hover:text-orange-400 transition-all duration-200">
              <span>📎 파일 선택</span>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXT}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
          {fileError && (
            <small className="mt-1 block text-xs text-red-400" role="alert">
              ⚠ {fileError}
            </small>
          )}
          <p className="mt-2 text-xs text-slate-400">
            이미지(JPG·PNG·GIF·WEBP), PDF, Word, Excel · 최대 {FILE_MAX_SIZE_MB}
            MB · 1개까지
          </p>
        </fieldset>

        {/* 버튼 */}
        <footer className="flex justify-end gap-2">
          {editMessage && (
            <p className="mr-auto self-center text-sm font-medium text-rose-500">
              {editMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer rounded-full px-6 py-1.5 text-base font-bold bg-amber-100 text-amber-600 shadow-sm shadow-amber-100 hover:bg-amber-200 transition-all border border-amber-200"
          >
            {isSubmitting ? "처리중..." : isEditMode ? "수정 완료" : "작성"}
          </button>
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="cursor-pointer rounded-full px-6 py-1.5 text-base font-bold border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all"
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
