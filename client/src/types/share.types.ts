import type { DataRoomContents, FolderBreadcrumb } from "./folder.types";

export type ShareType = "PUBLIC" | "USER";
export type ShareRole = "VIEWER";
export type ShareTargetType = "DATAROOM" | "FOLDER" | "FILE";
export type SharedAccessMode = "public" | "user";

export interface ShareSummary {
  id: string;
  token: string;
  type: ShareType;
  role: ShareRole;
  createdAt: string;
}

export interface CreateShareInput {
  type: ShareType;
  targetType: ShareTargetType;
  targetId: string;
  recipientEmail?: string;
}

export interface CreatedShareResponse extends ShareSummary {
  recipientUserId: string | null;
  dataRoomId: string | null;
  folderId: string | null;
  fileId: string | null;
}

export interface CreatedShare extends CreatedShareResponse {
  recipientUser: { id: string; email: string } | null;
  dataRoom: { id: string; name: string } | null;
  folder: { id: string; name: string; dataRoomId: string } | null;
  file: {
    id: string;
    name: string;
    dataRoomId: string;
    folderId: string | null;
  } | null;
}

export interface SharedItem {
  id: string;
  name: string;
  mimeType?: string;
  size?: number;
  dataRoomId?: string;
  folderId?: string | null;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SharedResourceResponse {
  share: ShareSummary;
  targetType: ShareTargetType;
  item: SharedItem;
  contents?: DataRoomContents;
  breadcrumbs?: FolderBreadcrumb[];
}

export type ReceivedShare = Pick<
  SharedResourceResponse,
  "share" | "targetType" | "item"
>;

export interface SharedFileViewInput {
  mode: SharedAccessMode;
  token: string;
  fileId: string;
}
