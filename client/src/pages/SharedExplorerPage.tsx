import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRightIcon, FileTextIcon, FolderIcon } from "lucide-react";
import { useSharedFileViewUrl, useSharedResource } from "@/hooks";
import { Button } from "@/components/ui/button";
import PdfViewerDialog from "@/components/files/PdfViewerDialog";

import type { FolderFile, SharedAccessMode } from "@/types";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface SharedExplorerPageProps {
  mode: SharedAccessMode;
}

const SharedExplorerPage = ({ mode }: SharedExplorerPageProps) => {
  const { token = "", folderId } = useParams();
  const [fileToView, setFileToView] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const resource = useSharedResource(mode, token, folderId ?? null);
  const { mutateAsync: getSharedFileViewUrl } = useSharedFileViewUrl();
  const routeBase = `/shared/${mode}/${token}`;

  const loadViewUrl = useCallback(
    async (fileId: string) =>
      (
        await getSharedFileViewUrl({
          mode,
          token,
          fileId,
        })
      ).viewUrl,
    [getSharedFileViewUrl, mode, token],
  );

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-lg font-semibold">Shared resource</p>
            <p className="text-xs text-muted-foreground">Read-only access</p>
          </div>
          {mode === "user" && (
            <Button asChild variant="outline">
              <Link to="/shares/received">Shared with me</Link>
            </Button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {resource.isPending && (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            Loading shared resource…
          </div>
        )}

        {resource.isError && (
          <div className="rounded-xl border border-destructive/30 bg-card p-10 text-center">
            <h1 className="text-lg font-semibold">
              This resource is no longer available.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              It may have been deleted or your access may have changed.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button asChild variant="outline">
                <Link to={mode === "user" ? "/shares/received" : "/"}>
                  {mode === "user" ? "Back to Shared with me" : "Go to home"}
                </Link>
              </Button>
              <Button variant="outline" onClick={() => void resource.refetch()}>
                Try again
              </Button>
            </div>
          </div>
        )}

        {resource.isSuccess && (
          <>
            {folderId && (
              <nav
                aria-label="Breadcrumb"
                className="mb-5 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
              >
                <Link
                  className="rounded-sm hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  to={routeBase}
                >
                  Shared root
                </Link>
                {resource.data.breadcrumbs?.map((breadcrumb, index, list) => (
                  <span className="flex items-center gap-1" key={breadcrumb.id}>
                    <ChevronRightIcon className="size-4" />
                    <Link
                      aria-current={
                        index === list.length - 1 ? "page" : undefined
                      }
                      className="rounded-sm hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      to={`${routeBase}/folders/${breadcrumb.id}`}
                    >
                      {breadcrumb.name}
                    </Link>
                  </span>
                ))}
              </nav>
            )}

            <div className="mb-6">
              <h1 className="text-3xl font-semibold tracking-tight">
                {resource.data.item.name}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Shared with viewer access. Changes are not available.
              </p>
            </div>

            {resource.data.targetType === "FILE" && !resource.data.contents && (
              <section className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileTextIcon className="size-6 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {resource.data.item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {resource.data.item.mimeType ?? "PDF"}
                        {typeof resource.data.item.size === "number"
                          ? ` · ${formatFileSize(resource.data.item.size)}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      setFileToView({
                        id: resource.data.item.id,
                        name: resource.data.item.name,
                      })
                    }
                  >
                    View PDF
                  </Button>
                </div>
              </section>
            )}

            {resource.data.contents && (
              <SharedDirectory
                files={resource.data.contents.files}
                folders={resource.data.contents.folders}
                routeBase={routeBase}
                onViewFile={setFileToView}
              />
            )}

            {fileToView && (
              <PdfViewerDialog
                fileId={fileToView.id}
                fileName={fileToView.name}
                loadViewUrl={loadViewUrl}
                onClose={() => setFileToView(null)}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
};

interface SharedDirectoryProps {
  files: FolderFile[];
  folders: Array<{ id: string; name: string }>;
  routeBase: string;
  onViewFile: (file: FolderFile) => void;
}

const SharedDirectory = ({
  files,
  folders,
  routeBase,
  onViewFile,
}: SharedDirectoryProps) => {
  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-12 text-center">
        <FolderIcon className="mx-auto size-8 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">This folder is empty</h2>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {folders.map((folder) => (
        <div
          className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0"
          key={folder.id}
        >
          <Link
            className="flex min-w-0 items-center gap-3 rounded-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            to={`${routeBase}/folders/${folder.id}`}
          >
            <FolderIcon className="size-5 shrink-0 text-muted-foreground" />
            <span className="truncate">{folder.name}</span>
          </Link>
          <Button asChild size="sm" variant="ghost">
            <Link to={`${routeBase}/folders/${folder.id}`}>Open</Link>
          </Button>
        </div>
      ))}

      {files.map((file) => (
        <div
          className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0"
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
          <Button size="sm" variant="ghost" onClick={() => onViewFile(file)}>
            View PDF
          </Button>
        </div>
      ))}
    </section>
  );
};

export default SharedExplorerPage;
