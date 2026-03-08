import { useMutation } from "@tanstack/react-query";
import {
  BoardCategory,
  createBoard,
  CreateBoardRequest,
} from "@features/post/api/board";

interface UseCreateBoardParams {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface CreateBoardVariables {
  title: string;
  content: string;
  category: BoardCategory;
  file?: File;
}

export function useCreateBoard({
  onSuccess,
  onError,
}: UseCreateBoardParams = {}) {
  return useMutation({
    mutationFn: ({ title, content, category, file }: CreateBoardVariables) => {
      const request: CreateBoardRequest = { title, content, category };
      return createBoard(request, file);
    },
    onSuccess,
    onError,
  });
}
