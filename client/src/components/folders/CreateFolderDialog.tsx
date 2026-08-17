import { useState, type SyntheticEvent } from "react";
import { useCreateFolder } from "@/hooks";

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

interface CreateFolderDialogProps {
  dataRoomId: string;
  open: boolean;
  parentId: string | null;
  userId: string;
  onOpenChange: (open: boolean) => void;
}

const CreateFolderDialog = ({
  dataRoomId,
  open,
  parentId,
  userId,
  onOpenChange,
}: CreateFolderDialogProps) => {
  const createFolder = useCreateFolder(userId, dataRoomId, parentId);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (createFolder.isPending) return;

    if (!nextOpen) {
      setName("");
      setError(null);
      createFolder.reset();
    }

    onOpenChange(nextOpen);
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
      await createFolder.mutateAsync({
        name: trimmedName,
        dataRoomId,
        ...(parentId ? { parentId } : {}),
      });
      handleOpenChange(false);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to create the folder. Please try again.",
        ),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
          <DialogDescription>
            Create a folder in the current directory.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="folder-name">
              Name
            </label>
            <input
              id="folder-name"
              autoFocus
              disabled={createFolder.isPending}
              onChange={(event) => setName(event.target.value)}
              placeholder="Folder name"
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
                disabled={createFolder.isPending}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={createFolder.isPending} type="submit">
              {createFolder.isPending ? "Creating…" : "Create Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderDialog;
