import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import getApiErrorMessage from "@/lib/api-error";

interface PdfViewerDialogProps {
  fileId: string;
  fileName: string;
  loadViewUrl: (fileId: string) => Promise<string>;
  onClose: () => void;
}

const PdfViewerDialog = ({
  fileId,
  fileName,
  loadViewUrl,
  onClose,
}: PdfViewerDialogProps) => {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadPdf = async () => {
      try {
        const url = await loadViewUrl(fileId);

        if (isActive) setViewUrl(url);
      } catch (requestError) {
        if (!isActive) return;

        setError(
          getApiErrorMessage(
            requestError,
            "Unable to load this PDF. Access may have expired or been revoked.",
          ),
        );
      }
    };

    void loadPdf();

    return () => {
      isActive = false;
    };
  }, [fileId, loadViewUrl]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[90dvh] max-h-[90dvh] max-w-6xl flex-col gap-4 p-4 sm:p-6">
        <DialogHeader className="min-w-0 shrink-0 pr-8">
          <DialogTitle className="truncate">{fileName}</DialogTitle>
          <DialogDescription>PDF preview</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
          {!viewUrl && !error && (
            <p className="text-sm text-muted-foreground">Loading PDF…</p>
          )}

          {error && (
            <div className="max-w-md p-6 text-center">
              <p className="font-medium">PDF unavailable</p>
              <p className="mt-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            </div>
          )}

          {viewUrl && (
            <iframe
              className="h-full w-full bg-background"
              src={viewUrl}
              title={`${fileName} PDF preview`}
            />
          )}
        </div>

        {viewUrl && (
          <DialogFooter className="shrink-0">
            <Button asChild variant="outline">
              <a href={viewUrl} rel="noreferrer" target="_blank">
                Open in new tab
              </a>
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PdfViewerDialog;
