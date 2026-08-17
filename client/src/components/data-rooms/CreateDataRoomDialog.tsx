import { useState, type SyntheticEvent } from "react";
import { useCreateDataRoom } from "@/hooks";

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

interface CreateDataRoomDialogProps {
  open: boolean;
  userId: string;
  onOpenChange: (open: boolean) => void;
}

const CreateDataRoomDialog = ({
  open,
  userId,
  onOpenChange,
}: CreateDataRoomDialogProps) => {
  const createDataRoom = useCreateDataRoom(userId);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (createDataRoom.isPending) return;

    if (!nextOpen) {
      setName("");
      setError(null);
      createDataRoom.reset();
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Data Room name is required.");
      return;
    }

    try {
      await createDataRoom.mutateAsync({ name: trimmedName });
      handleOpenChange(false);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to create the Data Room. Please try again.",
        ),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Data Room</DialogTitle>
          <DialogDescription>
            Create a secure workspace for your documents.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="data-room-name">
              Name
            </label>
            <input
              id="data-room-name"
              autoFocus
              disabled={createDataRoom.isPending}
              onChange={(event) => setName(event.target.value)}
              placeholder="Project Alpha"
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
              <Button disabled={createDataRoom.isPending} variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={createDataRoom.isPending} type="submit">
              {createDataRoom.isPending ? "Creating…" : "Create Data Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDataRoomDialog;
