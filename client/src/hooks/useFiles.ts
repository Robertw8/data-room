import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFile, getFileViewUrl, moveFile, renameFile } from "@/api";
import { folderKeys } from "./useFolders";
import type { MoveFileInput, RenameFileInput } from "@/types";

const getDirectoryQueryKey = (
  userId: string,
  dataRoomId: string,
  folderId: string | null,
) =>
  folderId
    ? folderKeys.detail(userId, folderId)
    : folderKeys.root(userId, dataRoomId);

const useFileViewUrl = () =>
  useMutation({
    mutationFn: getFileViewUrl,
  });

const useRenameFile = (
  userId: string,
  dataRoomId: string,
  folderId: string | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RenameFileInput }) =>
      renameFile(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getDirectoryQueryKey(userId, dataRoomId, folderId),
      }),
  });
};

const useMoveFile = (
  userId: string,
  dataRoomId: string,
  currentFolderId: string | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MoveFileInput }) =>
      moveFile(id, input),
    onSuccess: async (_file, variables) => {
      const currentKey = getDirectoryQueryKey(
        userId,
        dataRoomId,
        currentFolderId,
      );
      const destinationKey = getDirectoryQueryKey(
        userId,
        dataRoomId,
        variables.input.folderId,
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: currentKey }),
        queryClient.invalidateQueries({ queryKey: destinationKey }),
      ]);
    },
  });
};

const useDeleteFile = (
  userId: string,
  dataRoomId: string,
  folderId: string | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFile,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getDirectoryQueryKey(userId, dataRoomId, folderId),
      }),
  });
};

export {
  getDirectoryQueryKey,
  useDeleteFile,
  useFileViewUrl,
  useMoveFile,
  useRenameFile,
};
