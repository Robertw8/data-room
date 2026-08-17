import { useState, type SyntheticEvent } from "react";
import { useUpdateFolder } from "@/hooks";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import getApiErrorMessage from "@/lib/api-error";
import type { Folder } from "@/types";

interface RenameFolderDialogProps {
  currentFolderId: string | null;
  dataRoomId: string;
  folder: Folder;
  userId: string;
  onClose: () => void;
}

const RenameFolderDialog = ({
  currentFolderId,
  dataRoomId,
  folder,
  userId,
  onClose,
}: RenameFolderDialogProps) => {
  const updateFolder = useUpdateFolder(userId, dataRoomId, currentFolderId);
  const [name, setName] = useState(folder.name);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open && !updateFolder.isPending) onClose();
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Folder name is required.");
      return;
    }

    try {
      await updateFolder.mutateAsync({
        id: folder.id,
        input: { name: trimmedName },
      });
      onClose();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to rename the folder. Please try again.",
        ),
      );
    }
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
          <DialogDescription>
            Update the folder name shown in this directory.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="rename-folder">
              Name
            </label>
            <input
              id="rename-folder"
              autoFocus
              disabled={updateFolder.isPending}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                disabled={updateFolder.isPending}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="min-w-28"
              disabled={updateFolder.isPending}
              type="submit"
            >
              {updateFolder.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenameFolderDialog;
