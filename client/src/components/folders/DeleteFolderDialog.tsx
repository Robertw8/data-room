import { useState, type MouseEvent } from "react";
import { useDeleteFolder, useFolderDeletionStats } from "@/hooks";

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

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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
  const stats = useFolderDeletionStats(userId, folder.id);
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
          <AlertDialogCancel disabled={deleteFolder.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="min-w-28 bg-destructive text-white hover:bg-destructive/90"
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
