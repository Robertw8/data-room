import api from "./api-client";
import type { DataRoom, DataRoomContents, DataRoomInput } from "@/types";

const getDataRooms = async (): Promise<DataRoom[]> => {
  const response = await api.get<DataRoom[]>("/data-rooms");

  return response.data;
};

const getDataRoom = async (id: string): Promise<DataRoom> => {
  const response = await api.get<DataRoom>(`/data-rooms/${id}`);

  return response.data;
};

const getDataRoomContents = async (id: string): Promise<DataRoomContents> => {
  const response = await api.get<DataRoomContents>(
    `/data-rooms/${id}/contents`,
  );

  return response.data;
};

const createDataRoom = async (input: DataRoomInput): Promise<DataRoom> => {
  const response = await api.post<DataRoom>("/data-rooms", input);

  return response.data;
};

const updateDataRoom = async (
  id: string,
  input: DataRoomInput,
): Promise<DataRoom> => {
  const response = await api.patch<DataRoom>(`/data-rooms/${id}`, input);

  return response.data;
};

const deleteDataRoom = async (id: string): Promise<DataRoom> => {
  const response = await api.delete<DataRoom>(`/data-rooms/${id}`);

  return response.data;
};

export {
  createDataRoom,
  deleteDataRoom,
  getDataRoom,
  getDataRoomContents,
  getDataRooms,
  updateDataRoom,
};
