export interface DataRoom {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataRoomInput {
  name: string;
}

export interface DeletionStats {
  folderCount: number;
  fileCount: number;
  totalSize: number;
}
