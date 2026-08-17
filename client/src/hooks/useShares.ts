import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createShare,
  getCreatedShares,
  getReceivedShares,
  getSharedFileViewUrl,
  getSharedFolder,
  getSharedRoot,
  revokeShare,
} from "@/api";
import type { SharedAccessMode } from "@/types";

const shareKeys = {
  all: ["shares"] as const,
  created: (userId: string) => [...shareKeys.all, "created", userId] as const,
  received: (userId: string) => [...shareKeys.all, "received", userId] as const,
  sharedRoot: (mode: SharedAccessMode, token: string) =>
    ["shared", mode, token] as const,
  sharedFolder: (mode: SharedAccessMode, token: string, folderId: string) =>
    ["shared", mode, token, "folder", folderId] as const,
};

const useCreatedShares = (userId: string) =>
  useQuery({
    queryKey: shareKeys.created(userId),
    queryFn: getCreatedShares,
  });

const useReceivedShares = (userId: string) =>
  useQuery({
    queryKey: shareKeys.received(userId),
    queryFn: getReceivedShares,
  });

const useCreateShare = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createShare,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: shareKeys.created(userId) }),
  });
};

const useRevokeShare = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeShare,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: shareKeys.created(userId) }),
  });
};

const useSharedResource = (
  mode: SharedAccessMode,
  token: string,
  folderId: string | null,
) =>
  useQuery({
    queryKey: folderId
      ? shareKeys.sharedFolder(mode, token, folderId)
      : shareKeys.sharedRoot(mode, token),
    queryFn: () =>
      folderId
        ? getSharedFolder(mode, token, folderId)
        : getSharedRoot(mode, token),
    enabled: Boolean(token),
    retry: false,
  });

const useSharedFileViewUrl = () =>
  useMutation({
    mutationFn: getSharedFileViewUrl,
  });

export {
  shareKeys,
  useCreatedShares,
  useCreateShare,
  useReceivedShares,
  useRevokeShare,
  useSharedFileViewUrl,
  useSharedResource,
};
