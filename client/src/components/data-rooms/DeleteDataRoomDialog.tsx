import { useState, type MouseEvent } from "react";
import { useDataRoomDeletionStats, useDeleteDataRoom } from "@/hooks";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import getApiErrorMessage from "@/lib/api-error";
import type { DataRoom } from "@/types";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface DeleteDataRoomDialogProps {
  dataRoom: DataRoom;
  userId: string;
  onClose: () => void;
}

const DeleteDataRoomDialog = ({
  dataRoom,
  userId,
  onClose,
}: DeleteDataRoomDialogProps) => {
  const deleteDataRoom = useDeleteDataRoom(userId);
  const stats = useDataRoomDeletionStats(userId, dataRoom.id);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open && !deleteDataRoom.isPending) onClose();
  };

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await deleteDataRoom.mutateAsync(dataRoom.id);
      onClose();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to delete the Data Room. Please try again.",
        ),
      );
    }
  };

  return (
    <AlertDialog open onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{dataRoom.name}”?</AlertDialogTitle>
          <AlertDialogDescription className="min-h-10">
            {stats.isPending && "Calculating what will be deleted…"}
            {stats.isError &&
              "All nested folders and files will be permanently deleted. This action cannot be undone."}
            {stats.isSuccess &&
              `This will permanently delete ${stats.data.folderCount} ${stats.data.folderCount === 1 ? "folder" : "folders"} and ${stats.data.fileCount} ${stats.data.fileCount === 1 ? "file" : "files"} (${formatFileSize(stats.data.totalSize)}).`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteDataRoom.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="min-w-32 bg-destructive text-white hover:bg-destructive/90"
            disabled={deleteDataRoom.isPending}
            onClick={handleDelete}
          >
            {deleteDataRoom.isPending ? "Deleting…" : "Delete Data Room"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDataRoomDialog;
