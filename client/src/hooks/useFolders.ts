import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFolder,
  deleteFolder,
  getFolder,
  getDataRoomContents,
  updateFolder,
} from "@/api";
import type { CreateFolderInput, UpdateFolderInput } from "@/types";

const folderKeys = {
  root: (userId: string, dataRoomId: string) =>
    ["data-room-contents", userId, dataRoomId] as const,
  details: (userId: string) => ["folder", userId] as const,
  detail: (userId: string, folderId: string) =>
    [...folderKeys.details(userId), folderId] as const,
};

const useDataRoomContents = (
  userId: string,
  dataRoomId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: folderKeys.root(userId, dataRoomId),
    queryFn: () => getDataRoomContents(dataRoomId),
    enabled: enabled && Boolean(dataRoomId),
  });

const useFolder = (userId: string, folderId: string, enabled = true) =>
  useQuery({
    queryKey: folderKeys.detail(userId, folderId),
    queryFn: () => getFolder(folderId),
    enabled: enabled && Boolean(folderId),
  });

const useCreateFolder = (
  userId: string,
  dataRoomId: string,
  parentId: string | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFolderInput) => createFolder(input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: parentId
          ? folderKeys.detail(userId, parentId)
          : folderKeys.root(userId, dataRoomId),
      }),
  });
};

const useUpdateFolder = (
  userId: string,
  dataRoomId: string,
  parentId: string | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFolderInput }) =>
      updateFolder(id, input),
    onSuccess: async () => {
      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: folderKeys.details(userId),
        }),
      ];

      if (!parentId) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: folderKeys.root(userId, dataRoomId),
          }),
        );
      }

      await Promise.all(invalidations);
    },
  });
};

const useDeleteFolder = (
  userId: string,
  dataRoomId: string,
  parentId: string | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFolder,
    onSuccess: async () => {
      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: folderKeys.details(userId),
        }),
      ];

      if (!parentId) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: folderKeys.root(userId, dataRoomId),
          }),
        );
      }

      await Promise.all(invalidations);
    },
  });
};

export {
  folderKeys,
  useCreateFolder,
  useDeleteFolder,
  useDataRoomContents,
  useFolder,
  useUpdateFolder,
};
