import api from "./api-client";
import type {
  CreateFolderInput,
  DeletionStats,
  Folder,
  FolderDetail,
  UpdateFolderInput,
} from "@/types";

const getRootFolders = async (dataRoomId: string): Promise<Folder[]> => {
  const response = await api.get<Folder[]>(`/data-rooms/${dataRoomId}/folders`);

  return response.data;
};

const getFolder = async (id: string): Promise<FolderDetail> => {
  const response = await api.get<FolderDetail>(`/folders/${id}`);

  return response.data;
};

const getFolderDeletionStats = async (id: string): Promise<DeletionStats> => {
  const response = await api.get<DeletionStats>(
    `/folders/${id}/deletion-stats`,
  );

  return response.data;
};

const createFolder = async (input: CreateFolderInput): Promise<Folder> => {
  const response = await api.post<Folder>("/folders", input);

  return response.data;
};

const updateFolder = async (
  id: string,
  input: UpdateFolderInput,
): Promise<Folder> => {
  const response = await api.patch<Folder>(`/folders/${id}`, input);

  return response.data;
};

const deleteFolder = async (id: string): Promise<Folder> => {
  const response = await api.delete<Folder>(`/folders/${id}`);

  return response.data;
};

export {
  createFolder,
  deleteFolder,
  getFolder,
  getFolderDeletionStats,
  getRootFolders,
  updateFolder,
};
