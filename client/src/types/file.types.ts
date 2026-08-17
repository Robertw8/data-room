export interface CreateUploadUrlInput {
  name: string;
  mimeType: string;
  size: number;
  dataRoomId: string;
  folderId?: string;
}

export interface CreateUploadUrlResponse {
  storageKey: string;
  uploadUrl: string;
}

export interface UploadInput {
  file: File;
  dataRoomId: string;
  folderId?: string;
  onProgress: (progress: number) => void;
}

export interface CompleteUploadInput {
  name: string;
  storageKey: string;
  dataRoomId: string;
  folderId?: string;
}

export interface CompleteUploadResponse extends CreateUploadUrlInput {
  storageKey: string;
}

export interface FileViewUrlResponse {
  viewUrl: string;
}

export interface RenameFileInput {
  name: string;
}

export interface MoveFileInput {
  folderId: string | null;
}
