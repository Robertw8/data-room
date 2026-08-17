import { useState, type SyntheticEvent } from "react";
import { useUpdateDataRoom } from "@/hooks";

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
import type { DataRoom } from "@/types";

interface RenameDataRoomDialogProps {
  dataRoom: DataRoom;
  userId: string;
  onClose: () => void;
}

const RenameDataRoomDialog = ({
  dataRoom,
  userId,
  onClose,
}: RenameDataRoomDialogProps) => {
  const updateDataRoom = useUpdateDataRoom(userId);
  const [name, setName] = useState(dataRoom.name);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open && !updateDataRoom.isPending) onClose();
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
      await updateDataRoom.mutateAsync({
        id: dataRoom.id,
        input: { name: trimmedName },
      });
      onClose();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to rename the Data Room. Please try again.",
        ),
      );
    }
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Data Room</DialogTitle>
          <DialogDescription>
            Update the name shown in your Data Rooms list.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="rename-data-room">
              Name
            </label>
            <input
              id="rename-data-room"
              autoFocus
              disabled={updateDataRoom.isPending}
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
              <Button disabled={updateDataRoom.isPending} variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={updateDataRoom.isPending} type="submit">
              {updateDataRoom.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenameDataRoomDialog;
