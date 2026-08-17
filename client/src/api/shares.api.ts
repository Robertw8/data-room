import api from "./api-client";
import type {
  CreateShareInput,
  CreatedShare,
  CreatedShareResponse,
  FileViewUrlResponse,
  ReceivedShare,
  SharedAccessMode,
  SharedFileViewInput,
  SharedResourceResponse,
} from "@/types";

const getSharedBasePath = (mode: SharedAccessMode, token: string) =>
  mode === "public" ? `/public/shares/${token}` : `/shares/${token}`;

const createShare = async (
  input: CreateShareInput,
): Promise<CreatedShareResponse> => {
  const response = await api.post<CreatedShareResponse>("/shares", input);

  return response.data;
};

const getCreatedShares = async (): Promise<CreatedShare[]> => {
  const response = await api.get<CreatedShare[]>("/shares/created");

  return response.data;
};

const getReceivedShares = async (): Promise<ReceivedShare[]> => {
  const response = await api.get<ReceivedShare[]>("/shares/received");

  return response.data;
};

const revokeShare = async (id: string): Promise<CreatedShareResponse> => {
  const response = await api.patch<CreatedShareResponse>(
    `/shares/${id}/revoke`,
  );

  return response.data;
};

const getSharedRoot = async (
  mode: SharedAccessMode,
  token: string,
): Promise<SharedResourceResponse> => {
  const response = await api.get<SharedResourceResponse>(
    getSharedBasePath(mode, token),
  );

  return response.data;
};

const getSharedFolder = async (
  mode: SharedAccessMode,
  token: string,
  folderId: string,
): Promise<SharedResourceResponse> => {
  const response = await api.get<SharedResourceResponse>(
    `${getSharedBasePath(mode, token)}/folders/${folderId}`,
  );

  return response.data;
};

const getSharedFileViewUrl = async ({
  mode,
  token,
  fileId,
}: SharedFileViewInput): Promise<FileViewUrlResponse> => {
  const response = await api.get<FileViewUrlResponse>(
    `${getSharedBasePath(mode, token)}/files/${fileId}/view-url`,
  );

  return response.data;
};

export {
  createShare,
  getCreatedShares,
  getReceivedShares,
  getSharedFileViewUrl,
  getSharedFolder,
  getSharedRoot,
  revokeShare,
};
