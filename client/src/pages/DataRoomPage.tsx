import { useState } from "react";
import {
  useAuth,
  useDataRoom,
  useDataRoomContents,
  useFileViewUrl,
  useFolder,
} from "@/hooks";

import { Link, useParams } from "react-router-dom";
import {
  ChevronRightIcon,
  FileTextIcon,
  FolderIcon,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateFolderDialog from "@/components/folders/CreateFolderDialog";
import DeleteFolderDialog from "@/components/folders/DeleteFolderDialog";
import RenameFolderDialog from "@/components/folders/RenameFolderDialog";
import DeleteFileDialog from "@/components/files/DeleteFileDialog";
import FileUpload from "@/components/files/FileUpload";
import MoveFileDialog from "@/components/files/MoveFileDialog";
import RenameFileDialog from "@/components/files/RenameFileDialog";
import ShareDialog from "@/components/shares/ShareDialog";

import getApiErrorMessage from "@/lib/api-error";
import type { Folder, FolderFile, ShareTargetType } from "@/types";

interface ShareTarget {
  id: string;
  name: string;
  type: ShareTargetType;
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(date),
  );

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DataRoomPage = () => {
  const { dataRoomId = "", folderId } = useParams();
  const { logout, user } = useAuth();

  if (!user) return null;

  return (
    <FolderExplorer
      key={`${dataRoomId}:${folderId ?? "root"}`}
      dataRoomId={dataRoomId}
      folderId={folderId ?? null}
      userId={user.id}
      onLogout={logout}
    />
  );
};

interface FolderExplorerProps {
  dataRoomId: string;
  folderId: string | null;
  userId: string;
  onLogout: () => void;
}

const FolderExplorer = ({
  dataRoomId,
  folderId,
  userId,
  onLogout,
}: FolderExplorerProps) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [fileToRename, setFileToRename] = useState<FolderFile | null>(null);
  const [fileToMove, setFileToMove] = useState<FolderFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FolderFile | null>(null);
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [fileActionError, setFileActionError] = useState<string | null>(null);
  const viewFile = useFileViewUrl();
  const dataRoom = useDataRoom(userId, dataRoomId);
  const rootContents = useDataRoomContents(
    userId,
    dataRoomId,
    folderId === null,
  );
  const folder = useFolder(userId, folderId ?? "", folderId !== null);

  const directoryIsPending = folderId
    ? folder.isPending
    : rootContents.isPending;
  const directoryIsError = folderId ? folder.isError : rootContents.isError;
  const directoryError = folderId ? folder.error : rootContents.error;
  const folderDoesNotBelongToRoom =
    folderId !== null &&
    folder.isSuccess &&
    folder.data.dataRoomId !== dataRoomId;
  const hasLoadError =
    dataRoom.isError || directoryIsError || folderDoesNotBelongToRoom;

  const handleRetry = () => {
    void dataRoom.refetch();

    if (folderId) {
      void folder.refetch();
    } else {
      void rootContents.refetch();
    }
  };

  const handleViewFile = async (file: FolderFile) => {
    setFileActionError(null);

    const viewTab = window.open("about:blank", "_blank");

    if (!viewTab) {
      setFileActionError(
        "Unable to open a new tab. Please allow pop-ups and try again.",
      );
      return;
    }

    viewTab.opener = null;

    try {
      const { viewUrl } = await viewFile.mutateAsync(file.id);
      viewTab.location.href = viewUrl;
    } catch (requestError) {
      viewTab.close();
      setFileActionError(
        getApiErrorMessage(
          requestError,
          "Unable to open this PDF. Please try again.",
        ),
      );
    }
  };

  const folders = folderId
    ? (folder.data?.children ?? [])
    : (rootContents.data?.folders ?? []);
  const files = folderId
    ? (folder.data?.files ?? [])
    : (rootContents.data?.files ?? []);
  const breadcrumbs = folderId ? (folder.data?.breadcrumbs ?? []) : [];
  const currentName = folderId ? folder.data?.name : dataRoom.data?.name;
  const isReady =
    dataRoom.isSuccess &&
    (folderId ? folder.isSuccess : rootContents.isSuccess) &&
    !folderDoesNotBelongToRoom;

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Button asChild variant="ghost">
            <Link to="/app">← Data Rooms</Link>
          </Button>
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {!hasLoadError && (dataRoom.isPending || directoryIsPending) && (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            Loading folder…
          </div>
        )}

        {hasLoadError && (
          <div className="rounded-xl border border-destructive/30 bg-card p-8 text-center">
            <p className="text-sm text-destructive" role="alert">
              {folderDoesNotBelongToRoom
                ? "This folder does not belong to the selected Data Room."
                : getApiErrorMessage(
                    dataRoom.error ?? directoryError,
                    "Unable to load this folder. Please try again.",
                  )}
            </p>
            {!folderDoesNotBelongToRoom && (
              <Button className="mt-4" variant="outline" onClick={handleRetry}>
                Try again
              </Button>
            )}
          </div>
        )}

        {isReady && (
          <>
            <nav
              aria-label="Breadcrumb"
              className="mb-5 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
            >
              <Link
                className="rounded-sm hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                to={`/data-rooms/${dataRoomId}`}
              >
                {dataRoom.data.name}
              </Link>

              {breadcrumbs.map((breadcrumb, index) => (
                <span className="flex items-center gap-1" key={breadcrumb.id}>
                  <ChevronRightIcon className="size-4" />
                  <Link
                    aria-current={
                      index === breadcrumbs.length - 1 ? "page" : undefined
                    }
                    className="rounded-sm hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    to={`/data-rooms/${dataRoomId}/folders/${breadcrumb.id}`}
                  >
                    {breadcrumb.name}
                  </Link>
                </span>
              ))}
            </nav>

            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {currentName}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {folderId
                    ? "Browse folders and manage PDF files."
                    : "Browse folders and manage PDF files in this Data Room."}
                </p>
              </div>
              <Button onClick={() => setCreateOpen(true)}>
                <PlusIcon data-icon="inline-start" />
                New Folder
              </Button>
            </div>

            <FileUpload
              key={folderId ?? "root"}
              dataRoomId={dataRoomId}
              folderId={folderId}
              userId={userId}
            />

            {fileActionError && (
              <p className="mb-4 text-sm text-destructive" role="alert">
                {fileActionError}
              </p>
            )}

            {folders.length === 0 && files.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card p-12 text-center">
                <FolderIcon className="mx-auto size-8 text-muted-foreground" />
                <h2 className="mt-4 text-lg font-semibold">
                  This folder is empty
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create a folder or upload a PDF to get started.
                </p>
                <Button className="mt-6" onClick={() => setCreateOpen(true)}>
                  <PlusIcon data-icon="inline-start" />
                  Create Folder
                </Button>
              </div>
            ) : (
              <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <div className="hidden grid-cols-[minmax(0,1fr)_10rem_auto] gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid">
                  <span>Name</span>
                  <span>Modified</span>
                  <span className="text-right">Actions</span>
                </div>

                {folders.map((childFolder) => (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_10rem_auto]"
                    key={childFolder.id}
                  >
                    <Link
                      className="flex min-w-0 items-center gap-3 rounded-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      to={`/data-rooms/${dataRoomId}/folders/${childFolder.id}`}
                    >
                      <FolderIcon className="size-5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{childFolder.name}</span>
                    </Link>
                    <span className="hidden text-sm text-muted-foreground sm:block">
                      {formatDate(childFolder.updatedAt)}
                    </span>
                    <div className="flex justify-end gap-1">
                      <Button asChild size="sm" variant="ghost">
                        <Link
                          to={`/data-rooms/${dataRoomId}/folders/${childFolder.id}`}
                        >
                          Open
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setShareTarget({
                            id: childFolder.id,
                            name: childFolder.name,
                            type: "FOLDER",
                          })
                        }
                      >
                        Share
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFolderToRename(childFolder)}
                      >
                        Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setFolderToDelete(childFolder)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}

                {files.map((file) => (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_10rem_auto]"
                    key={file.id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileTextIcon className="size-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <span className="hidden text-sm text-muted-foreground sm:block">
                      {formatDate(file.updatedAt)}
                    </span>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        disabled={viewFile.isPending}
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleViewFile(file)}
                      >
                        {viewFile.isPending && viewFile.variables === file.id
                          ? "Opening…"
                          : "View"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setShareTarget({
                            id: file.id,
                            name: file.name,
                            type: "FILE",
                          })
                        }
                      >
                        Share
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFileToRename(file)}
                      >
                        Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFileToMove(file)}
                      >
                        Move
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setFileToDelete(file)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </section>
            )}

            <CreateFolderDialog
              dataRoomId={dataRoomId}
              open={createOpen}
              parentId={folderId}
              userId={userId}
              onOpenChange={setCreateOpen}
            />

            {folderToRename && (
              <RenameFolderDialog
                currentFolderId={folderId}
                dataRoomId={dataRoomId}
                folder={folderToRename}
                userId={userId}
                onClose={() => setFolderToRename(null)}
              />
            )}

            {folderToDelete && (
              <DeleteFolderDialog
                currentFolderId={folderId}
                dataRoomId={dataRoomId}
                folder={folderToDelete}
                userId={userId}
                onClose={() => setFolderToDelete(null)}
              />
            )}

            {fileToRename && (
              <RenameFileDialog
                dataRoomId={dataRoomId}
                file={fileToRename}
                folderId={folderId}
                userId={userId}
                onClose={() => setFileToRename(null)}
              />
            )}

            {fileToMove && (
              <MoveFileDialog
                currentFolderId={folderId}
                dataRoomId={dataRoomId}
                dataRoomName={dataRoom.data.name}
                file={fileToMove}
                userId={userId}
                onClose={() => setFileToMove(null)}
              />
            )}

            {fileToDelete && (
              <DeleteFileDialog
                dataRoomId={dataRoomId}
                file={fileToDelete}
                folderId={folderId}
                userId={userId}
                onClose={() => setFileToDelete(null)}
              />
            )}

            {shareTarget && (
              <ShareDialog
                open
                targetId={shareTarget.id}
                targetName={shareTarget.name}
                targetType={shareTarget.type}
                userId={userId}
                onOpenChange={(open) => {
                  if (!open) setShareTarget(null);
                }}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default DataRoomPage;
