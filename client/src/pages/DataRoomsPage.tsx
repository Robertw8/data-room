import { useState } from "react";
import { useAuth, useDataRooms } from "@/hooks";

import { Link } from "react-router-dom";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateDataRoomDialog from "@/components/data-rooms/CreateDataRoomDialog";
import DeleteDataRoomDialog from "@/components/data-rooms/DeleteDataRoomDialog";
import RenameDataRoomDialog from "@/components/data-rooms/RenameDataRoomDialog";
import AuthenticatedHeader from "@/components/shares/AuthenticatedHeader";
import ShareDialog from "@/components/shares/ShareDialog";

import getApiErrorMessage from "@/lib/api-error";
import type { DataRoom } from "@/types";

const formatDate = (date: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(date),
  );

const DataRoomsPage = () => {
  const { logout, user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [roomToRename, setRoomToRename] = useState<DataRoom | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<DataRoom | null>(null);
  const [roomToShare, setRoomToShare] = useState<DataRoom | null>(null);

  if (!user) return null;

  return (
    <DataRoomsContent
      createOpen={createOpen}
      roomToDelete={roomToDelete}
      roomToRename={roomToRename}
      roomToShare={roomToShare}
      userId={user.id}
      userEmail={user.email}
      onCreateOpenChange={setCreateOpen}
      onDelete={setRoomToDelete}
      onLogout={logout}
      onRename={setRoomToRename}
      onShare={setRoomToShare}
    />
  );
};

interface DataRoomsContentProps {
  createOpen: boolean;
  roomToDelete: DataRoom | null;
  roomToRename: DataRoom | null;
  roomToShare: DataRoom | null;
  userEmail: string;
  userId: string;
  onCreateOpenChange: (open: boolean) => void;
  onDelete: (dataRoom: DataRoom | null) => void;
  onLogout: () => void;
  onRename: (dataRoom: DataRoom | null) => void;
  onShare: (dataRoom: DataRoom | null) => void;
}

const DataRoomsContent = ({
  createOpen,
  roomToDelete,
  roomToRename,
  roomToShare,
  userEmail,
  userId,
  onCreateOpenChange,
  onDelete,
  onLogout,
  onRename,
  onShare,
}: DataRoomsContentProps) => {
  const dataRooms = useDataRooms(userId);

  return (
    <main className="min-h-screen bg-muted/30">
      <AuthenticatedHeader email={userEmail} onLogout={onLogout} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Data Rooms
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your secure document workspaces.
            </p>
          </div>
          <Button onClick={() => onCreateOpenChange(true)}>
            <PlusIcon data-icon="inline-start" />
            New Data Room
          </Button>
        </div>

        {dataRooms.isPending && (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            Loading Data Rooms…
          </div>
        )}

        {dataRooms.isError && (
          <div className="rounded-xl border border-destructive/30 bg-card p-8 text-center">
            <p className="text-sm text-destructive" role="alert">
              {getApiErrorMessage(
                dataRooms.error,
                "Unable to load Data Rooms. Please try again.",
              )}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => void dataRooms.refetch()}
            >
              Try again
            </Button>
          </div>
        )}

        {dataRooms.isSuccess && dataRooms.data.length === 0 && (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center">
            <h2 className="text-lg font-semibold">No Data Rooms yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first Data Room to get started.
            </p>
            <Button className="mt-6" onClick={() => onCreateOpenChange(true)}>
              <PlusIcon data-icon="inline-start" />
              Create your first Data Room
            </Button>
          </div>
        )}

        {dataRooms.isSuccess && dataRooms.data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dataRooms.data.map((dataRoom) => (
              <article
                className="flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm"
                key={dataRoom.id}
              >
                <Link
                  className="group flex-1 rounded-t-xl p-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  to={`/data-rooms/${dataRoom.id}`}
                >
                  <h2 className="font-semibold group-hover:underline">
                    {dataRoom.name}
                  </h2>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Updated {formatDate(dataRoom.updatedAt)}
                  </p>
                </Link>

                <div className="flex flex-wrap gap-2 border-t p-3">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/data-rooms/${dataRoom.id}`}>Open</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onShare(dataRoom)}
                  >
                    Share
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRename(dataRoom)}
                  >
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(dataRoom)}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <CreateDataRoomDialog
        open={createOpen}
        userId={userId}
        onOpenChange={onCreateOpenChange}
      />

      {roomToRename && (
        <RenameDataRoomDialog
          dataRoom={roomToRename}
          userId={userId}
          onClose={() => onRename(null)}
        />
      )}

      {roomToDelete && (
        <DeleteDataRoomDialog
          dataRoom={roomToDelete}
          userId={userId}
          onClose={() => onDelete(null)}
        />
      )}

      {roomToShare && (
        <ShareDialog
          open
          targetId={roomToShare.id}
          targetName={roomToShare.name}
          targetType="DATAROOM"
          userId={userId}
          onOpenChange={(open) => {
            if (!open) onShare(null);
          }}
        />
      )}
    </main>
  );
};

export default DataRoomsPage;
