import api from "./api-client";
import axios from "axios";
import type {
  UploadInput,
  CompleteUploadInput,
  CompleteUploadResponse,
  CreateUploadUrlInput,
  CreateUploadUrlResponse,
  FileViewUrlResponse,
  FolderFile,
  MoveFileInput,
  RenameFileInput,
} from "@/types";

const createUploadUrl = async (
  input: CreateUploadUrlInput,
): Promise<CreateUploadUrlResponse> => {
  const response = await api.post<CreateUploadUrlResponse>(
    "/files/upload-url",
    input,
  );

  return response.data;
};

const uploadFile = async ({
  file,
  dataRoomId,
  folderId,
  onProgress,
}: UploadInput): Promise<CompleteUploadResponse> => {
  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are allowed");
  }

  const { storageKey, uploadUrl } = await createUploadUrl({
    name: file.name,
    mimeType: file.type,
    size: file.size,
    dataRoomId: dataRoomId,
    folderId: folderId,
  });

  // Put the file directly into S3 bucket
  await axios.put(uploadUrl, file, {
    headers: {
      "Content-Type": "application/pdf",
    },
    onUploadProgress: (event) => {
      if (!event.total) return;

      const progress = Math.round((event.loaded / event.total) * 100);

      onProgress?.(progress);
    },
  });

  return completeUpload({
    name: file.name,
    dataRoomId,
    storageKey,
    folderId,
  });
};

const completeUpload = async (
  input: CompleteUploadInput,
): Promise<CompleteUploadResponse> => {
  const response = await api.post<CompleteUploadResponse>(
    "/files/complete",
    input,
  );

  return response.data;
};

const getFileViewUrl = async (id: string): Promise<FileViewUrlResponse> => {
  const response = await api.get<FileViewUrlResponse>(`/files/${id}/view-url`);

  return response.data;
};

const renameFile = async (
  id: string,
  input: RenameFileInput,
): Promise<FolderFile> => {
  const response = await api.patch<FolderFile>(`/files/${id}`, input);

  return response.data;
};

const moveFile = async (
  id: string,
  input: MoveFileInput,
): Promise<FolderFile> => {
  const response = await api.patch<FolderFile>(`/files/${id}/move`, input);

  return response.data;
};

const deleteFile = async (id: string): Promise<FolderFile> => {
  const response = await api.delete<FolderFile>(`/files/${id}`);

  return response.data;
};

export {
  createUploadUrl,
  deleteFile,
  getFileViewUrl,
  moveFile,
  renameFile,
  uploadFile,
};
