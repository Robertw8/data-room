import { useState, type SyntheticEvent } from "react";
import { useRenameFile } from "@/hooks";

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
import type { FolderFile } from "@/types";

interface RenameFileDialogProps {
  dataRoomId: string;
  file: FolderFile;
  folderId: string | null;
  userId: string;
  onClose: () => void;
}

const RenameFileDialog = ({
  dataRoomId,
  file,
  folderId,
  userId,
  onClose,
}: RenameFileDialogProps) => {
  const renameFile = useRenameFile(userId, dataRoomId, folderId);
  const [name, setName] = useState(file.name);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open && !renameFile.isPending) onClose();
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("File name is required.");
      return;
    }

    try {
      await renameFile.mutateAsync({
        id: file.id,
        input: { name: trimmedName },
      });
      onClose();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to rename the file. Please try again.",
        ),
      );
    }
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename File</DialogTitle>
          <DialogDescription>
            Change the displayed filename. The stored object remains unchanged.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="rename-file">
              Name
            </label>
            <input
              id="rename-file"
              autoFocus
              disabled={renameFile.isPending}
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
                disabled={renameFile.isPending}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="min-w-28"
              disabled={renameFile.isPending}
              type="submit"
            >
              {renameFile.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenameFileDialog;
