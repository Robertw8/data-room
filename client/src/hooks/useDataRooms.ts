import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDataRoom,
  deleteDataRoom,
  getDataRoom,
  getDataRoomDeletionStats,
  getDataRooms,
  updateDataRoom,
} from "@/api";
import type { DataRoomInput } from "@/types";

const dataRoomKeys = {
  all: ["data-rooms"] as const,
  list: (userId: string) => [...dataRoomKeys.all, "list", userId] as const,
  detail: (userId: string, id: string) =>
    [...dataRoomKeys.all, "detail", userId, id] as const,
};

const useDataRooms = (userId: string) =>
  useQuery({
    queryKey: dataRoomKeys.list(userId),
    queryFn: getDataRooms,
  });

const useDataRoom = (userId: string, id: string) =>
  useQuery({
    queryKey: dataRoomKeys.detail(userId, id),
    queryFn: () => getDataRoom(id),
    enabled: Boolean(id),
  });

const useDataRoomDeletionStats = (userId: string, id: string) =>
  useQuery({
    queryKey: [...dataRoomKeys.detail(userId, id), "deletion-stats"],
    queryFn: () => getDataRoomDeletionStats(id),
    enabled: Boolean(id),
    retry: false,
  });

const useCreateDataRoom = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDataRoom,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: dataRoomKeys.list(userId) }),
  });
};

const useUpdateDataRoom = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DataRoomInput }) =>
      updateDataRoom(id, input),
    onSuccess: (dataRoom) => {
      queryClient.setQueryData(
        dataRoomKeys.detail(userId, dataRoom.id),
        dataRoom,
      );

      return queryClient.invalidateQueries({
        queryKey: dataRoomKeys.list(userId),
      });
    },
  });
};

const useDeleteDataRoom = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDataRoom,
    onSuccess: (dataRoom) => {
      queryClient.removeQueries({
        queryKey: dataRoomKeys.detail(userId, dataRoom.id),
      });

      return queryClient.invalidateQueries({
        queryKey: dataRoomKeys.list(userId),
      });
    },
  });
};

export {
  dataRoomKeys,
  useCreateDataRoom,
  useDataRoom,
  useDataRoomDeletionStats,
  useDataRooms,
  useDeleteDataRoom,
  useUpdateDataRoom,
};
