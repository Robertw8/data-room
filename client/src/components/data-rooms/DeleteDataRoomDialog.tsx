import { useState, type MouseEvent } from "react";
import { useDeleteDataRoom } from "@/hooks";

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
          <AlertDialogDescription>
            Deleting this Data Room will permanently delete all nested folders
            and files. This action cannot be undone.
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
            className="bg-destructive text-white hover:bg-destructive/90"
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
