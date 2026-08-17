import { useState, type MouseEvent } from "react";
import { useDeleteFile } from "@/hooks";

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
import type { FolderFile } from "@/types";

interface DeleteFileDialogProps {
  dataRoomId: string;
  file: FolderFile;
  folderId: string | null;
  userId: string;
  onClose: () => void;
}

const DeleteFileDialog = ({
  dataRoomId,
  file,
  folderId,
  userId,
  onClose,
}: DeleteFileDialogProps) => {
  const deleteFile = useDeleteFile(userId, dataRoomId, folderId);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open && !deleteFile.isPending) onClose();
  };

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await deleteFile.mutateAsync(file.id);
      onClose();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to delete the file. Please try again.",
        ),
      );
    }
  };

  return (
    <AlertDialog open onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{file.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This file will be permanently deleted. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteFile.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="min-w-24 bg-destructive text-white hover:bg-destructive/90"
            disabled={deleteFile.isPending}
            onClick={handleDelete}
          >
            {deleteFile.isPending ? "Deleting…" : "Delete File"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteFileDialog;
