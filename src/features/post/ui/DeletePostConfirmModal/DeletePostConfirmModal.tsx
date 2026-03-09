"use client";

import { ConfirmModal } from "@shared/ui/Modal";

interface DeletePostConfirmModalProps {
  open: boolean;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeletePostConfirmModal({
  open,
  isDeleting = false,
  onCancel,
  onConfirm,
}: DeletePostConfirmModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="게시글을 삭제할까요?"
      description="지워지면 복구할 수 없습니다."
      confirmButtonText="삭제하기"
      isConfirmDisabled={isDeleting}
    />
  );
}
