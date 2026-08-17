export interface Folder {
  id: string;
  name: string;
  dataRoomId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataRoomId: string;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderBreadcrumb {
  id: string;
  name: string;
}

export interface FolderDetail extends Folder {
  children: Folder[];
  files: FolderFile[];
  breadcrumbs: FolderBreadcrumb[];
}

export interface DataRoomContents {
  folders: Folder[];
  files: FolderFile[];
}

export interface CreateFolderInput {
  name: string;
  dataRoomId: string;
  parentId?: string;
}

export interface UpdateFolderInput {
  name: string;
}
