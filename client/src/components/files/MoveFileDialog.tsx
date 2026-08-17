import { useState } from "react";
import { useDataRoomContents, useFolder, useMoveFile } from "@/hooks";

import { ChevronRightIcon, FolderIcon } from "lucide-react";
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

interface MoveFileDialogProps {
  currentFolderId: string | null;
  dataRoomId: string;
  dataRoomName: string;
  file: FolderFile;
  userId: string;
  onClose: () => void;
}

const MoveFileDialog = ({
  currentFolderId,
  dataRoomId,
  dataRoomName,
  file,
  userId,
  onClose,
}: MoveFileDialogProps) => {
  const [browseFolderId, setBrowseFolderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootContents = useDataRoomContents(
    userId,
    dataRoomId,
    browseFolderId === null,
  );
  const folder = useFolder(
    userId,
    browseFolderId ?? "",
    browseFolderId !== null,
  );
  const moveFile = useMoveFile(userId, dataRoomId, currentFolderId);

  const destinationIsCurrent = browseFolderId === currentFolderId;
  const isPending = browseFolderId ? folder.isPending : rootContents.isPending;
  const isError = browseFolderId ? folder.isError : rootContents.isError;
  const queryError = browseFolderId ? folder.error : rootContents.error;
  const folders = browseFolderId
    ? (folder.data?.children ?? [])
    : (rootContents.data?.folders ?? []);
  const breadcrumbs = browseFolderId ? (folder.data?.breadcrumbs ?? []) : [];

  const handleOpenChange = (open: boolean) => {
    if (!open && !moveFile.isPending) onClose();
  };

  const handleMove = async () => {
    setError(null);

    try {
      await moveFile.mutateAsync({
        id: file.id,
        input: { folderId: browseFolderId },
      });
      onClose();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to move the file. Please try again.",
        ),
      );
    }
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move “{file.name}”</DialogTitle>
          <DialogDescription>
            Browse to a destination, then move the file there.
          </DialogDescription>
        </DialogHeader>

        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <button
            className="rounded-sm hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
            onClick={() => setBrowseFolderId(null)}
          >
            {dataRoomName}
          </button>
          {breadcrumbs.map((breadcrumb) => (
            <span className="flex items-center gap-1" key={breadcrumb.id}>
              <ChevronRightIcon className="size-4" />
              <button
                className="rounded-sm hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                type="button"
                onClick={() => setBrowseFolderId(breadcrumb.id)}
              >
                {breadcrumb.name}
              </button>
            </span>
          ))}
        </nav>

        <div className="max-h-64 overflow-y-auto rounded-lg border">
          {isPending && (
            <p className="p-4 text-sm text-muted-foreground">
              Loading folders…
            </p>
          )}

          {isError && (
            <p className="p-4 text-sm text-destructive" role="alert">
              {getApiErrorMessage(
                queryError,
                "Unable to load folder destinations.",
              )}
            </p>
          )}

          {!isPending && !isError && folders.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              No child folders in this directory.
            </p>
          )}

          {!isPending &&
            !isError &&
            folders.map((destination) => (
              <button
                className="flex w-full items-center gap-3 border-b px-4 py-3 text-left text-sm font-medium last:border-b-0 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                key={destination.id}
                type="button"
                onClick={() => setBrowseFolderId(destination.id)}
              >
                <FolderIcon className="size-4 text-muted-foreground" />
                <span className="truncate">{destination.name}</span>
                <ChevronRightIcon className="ml-auto size-4 text-muted-foreground" />
              </button>
            ))}
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button
              disabled={moveFile.isPending}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={
              moveFile.isPending || isPending || isError || destinationIsCurrent
            }
            onClick={() => void handleMove()}
          >
            {moveFile.isPending
              ? "Moving…"
              : destinationIsCurrent
                ? "Current location"
                : "Move here"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveFileDialog;
