import { useState, type MouseEvent } from "react";
import { useDeleteFolder } from "@/hooks";

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
import type { Folder } from "@/types";

interface DeleteFolderDialogProps {
  currentFolderId: string | null;
  dataRoomId: string;
  folder: Folder;
  userId: string;
  onClose: () => void;
}

const DeleteFolderDialog = ({
  currentFolderId,
  dataRoomId,
  folder,
  userId,
  onClose,
}: DeleteFolderDialogProps) => {
  const deleteFolder = useDeleteFolder(userId, dataRoomId, currentFolderId);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open && !deleteFolder.isPending) onClose();
  };

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await deleteFolder.mutateAsync(folder.id);
      onClose();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to delete the folder. Please try again.",
        ),
      );
    }
  };

  return (
    <AlertDialog open onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{folder.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Deleting this folder will permanently delete all nested folders and
            files. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteFolder.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={deleteFolder.isPending}
            onClick={handleDelete}
          >
            {deleteFolder.isPending ? "Deleting…" : "Delete Folder"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteFolderDialog;
