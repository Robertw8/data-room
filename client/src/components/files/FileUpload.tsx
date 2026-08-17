import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  FileTextIcon,
  UploadCloudIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { uploadFile } from "@/api";
import { getDirectoryQueryKey } from "@/hooks";
import getApiErrorMessage from "@/lib/api-error";

type UploadStatus =
  | "pending"
  | "uploading"
  | "completing"
  | "success"
  | "error";

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
}

interface FileUploadProps {
  dataRoomId: string;
  folderId: string | null;
  userId: string;
}

const statusLabels: Record<UploadStatus, string> = {
  pending: "Pending",
  uploading: "Uploading",
  completing: "Completing upload",
  success: "Complete",
  error: "Failed",
};

const FileUpload = ({ dataRoomId, folderId, userId }: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateUpload = (id: string, update: Partial<UploadItem>) => {
    setUploads((current) =>
      current.map((item) => (item.id === id ? { ...item, ...update } : item)),
    );
  };

  const runUpload = async (item: UploadItem) => {
    updateUpload(item.id, { status: "uploading" });

    try {
      await uploadFile({
        file: item.file,
        dataRoomId,
        folderId: folderId ?? undefined,
        onProgress: (progress) => {
          updateUpload(item.id, {
            progress,
            status: progress >= 100 ? "completing" : "uploading",
          });
        },
      });

      updateUpload(item.id, {
        progress: 100,
        status: "success",
        error: undefined,
      });

      void queryClient.invalidateQueries({
        queryKey: getDirectoryQueryKey(userId, dataRoomId, folderId),
      });
    } catch (requestError) {
      updateUpload(item.id, {
        status: "error",
        error: getApiErrorMessage(
          requestError,
          "Upload failed. Please try again.",
        ),
      });
    }
  };

  const addFiles = (selectedFiles: File[]) => {
    setSelectionError(null);

    const pdfFiles = selectedFiles.filter(
      (file) => file.type === "application/pdf",
    );
    const rejectedCount = selectedFiles.length - pdfFiles.length;

    if (rejectedCount > 0) {
      setSelectionError(
        rejectedCount === 1
          ? "One file was skipped. Only PDF files are allowed."
          : `${rejectedCount} files were skipped. Only PDF files are allowed.`,
      );
    }

    const newUploads: UploadItem[] = pdfFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: "pending",
    }));

    if (newUploads.length === 0) return;

    setUploads((current) => [...newUploads, ...current]);
    newUploads.forEach((item) => void runUpload(item));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <section className="mb-6 space-y-3">
      <input
        ref={inputRef}
        accept="application/pdf,.pdf"
        className="sr-only"
        multiple
        type="file"
        onChange={handleInputChange}
      />

      <div
        className={`flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-4 py-5 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <UploadCloudIcon className="size-7 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">Drop PDF files here</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload one or several PDFs directly to secure storage.
        </p>
        <Button
          className="mt-4"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          Upload PDF
        </Button>
      </div>

      {selectionError && (
        <p className="text-sm text-destructive" role="alert">
          {selectionError}
        </p>
      )}

      {uploads.length > 0 && (
        <div className="space-y-2 rounded-xl border bg-card p-3">
          {uploads.map((item) => (
            <div className="rounded-lg border p-3" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">
                    {item.file.name}
                  </span>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  {item.status === "success" && (
                    <CheckCircle2Icon className="size-3.5 text-green-600" />
                  )}
                  {item.status === "error" && (
                    <AlertCircleIcon className="size-3.5 text-destructive" />
                  )}
                  {statusLabels[item.status]}
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-[width] ${
                    item.status === "error" ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>

              <div className="mt-1 flex justify-between gap-3 text-xs text-muted-foreground">
                <span>{item.error ?? ""}</span>
                <span>{item.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default FileUpload;
