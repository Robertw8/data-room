import { useState, type MouseEvent } from "react";
import { useAuth, useCreatedShares, useRevokeShare } from "@/hooks";

import AuthenticatedHeader from "@/components/shares/AuthenticatedHeader";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import getApiErrorMessage from "@/lib/api-error";
import type { CreatedShare, ShareTargetType } from "@/types";

const formatDate = (date: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

const getTarget = (share: CreatedShare) => {
  if (share.dataRoom) {
    return { name: share.dataRoom.name, type: "DATAROOM" as ShareTargetType };
  }

  if (share.folder) {
    return { name: share.folder.name, type: "FOLDER" as ShareTargetType };
  }

  if (share.file) {
    return { name: share.file.name, type: "FILE" as ShareTargetType };
  }

  return { name: "Unavailable target", type: "FILE" as ShareTargetType };
};

const getPublicUrl = (token: string) =>
  `${window.location.origin}/shared/public/${token}`;

const SharesCreatedPage = () => {
  const { logout, user } = useAuth();
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!user) return null;

  return (
    <SharesCreatedContent
      actionError={actionError}
      copiedShareId={copiedShareId}
      email={user.email}
      userId={user.id}
      onActionError={setActionError}
      onCopied={setCopiedShareId}
      onLogout={logout}
    />
  );
};

interface SharesCreatedContentProps {
  actionError: string | null;
  copiedShareId: string | null;
  email: string;
  userId: string;
  onActionError: (error: string | null) => void;
  onCopied: (shareId: string | null) => void;
  onLogout: () => void;
}

const SharesCreatedContent = ({
  actionError,
  copiedShareId,
  email,
  userId,
  onActionError,
  onCopied,
  onLogout,
}: SharesCreatedContentProps) => {
  const shares = useCreatedShares(userId);
  const revokeShare = useRevokeShare(userId);
  const [shareToRevoke, setShareToRevoke] = useState<CreatedShare | null>(null);

  const handleCopy = async (share: CreatedShare) => {
    try {
      await navigator.clipboard.writeText(getPublicUrl(share.token));
      onCopied(share.id);
      onActionError(null);
    } catch {
      onCopied(null);
      onActionError("Unable to copy the link. Please try again.");
    }
  };

  const handleRevoke = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!shareToRevoke || revokeShare.isPending) return;
    onActionError(null);

    try {
      await revokeShare.mutateAsync(shareToRevoke.id);
    } catch (requestError) {
      onActionError(
        getApiErrorMessage(
          requestError,
          "Unable to revoke this share. Please try again.",
        ),
      );
    } finally {
      setShareToRevoke(null);
    }
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <AuthenticatedHeader email={email} onLogout={onLogout} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Shared by me
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage active public links and user access.
          </p>
        </div>

        {actionError && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {actionError}
          </p>
        )}

        {shares.isPending && (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            Loading shares…
          </div>
        )}

        {shares.isError && (
          <div className="rounded-xl border border-destructive/30 bg-card p-8 text-center">
            <p className="text-sm text-destructive" role="alert">
              {getApiErrorMessage(
                shares.error,
                "Unable to load your shares. Please try again.",
              )}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => void shares.refetch()}
            >
              Try again
            </Button>
          </div>
        )}

        {shares.isSuccess && shares.data.length === 0 && (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center">
            <h2 className="text-lg font-semibold">No active shares</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Shares you create from a Data Room, folder, or file will appear
              here.
            </p>
          </div>
        )}

        {shares.isSuccess && shares.data.length > 0 && (
          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            {shares.data.map((share) => {
              const target = getTarget(share);

              return (
                <div
                  className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-4 last:border-b-0"
                  key={share.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{target.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {target.type} · {share.type}
                      {share.type === "USER" && share.recipientUser
                        ? ` · ${share.recipientUser.email}`
                        : ""}
                      {` · ${formatDate(share.createdAt)}`}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {share.type === "PUBLIC" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleCopy(share)}
                      >
                        {copiedShareId === share.id
                          ? "Link copied"
                          : "Copy Link"}
                      </Button>
                    )}
                    <Button
                      disabled={revokeShare.isPending}
                      size="sm"
                      variant="destructive"
                      onClick={() => setShareToRevoke(share)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>

      {shareToRevoke && (
        <AlertDialog
          open
          onOpenChange={(open) => {
            if (!open && !revokeShare.isPending) setShareToRevoke(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke access?</AlertDialogTitle>
              <AlertDialogDescription>
                Anyone using this share will lose access.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={revokeShare.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="min-w-20 bg-destructive text-white hover:bg-destructive/90"
                disabled={revokeShare.isPending}
                onClick={handleRevoke}
              >
                {revokeShare.isPending ? "Revoking…" : "Revoke"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </main>
  );
};

export default SharesCreatedPage;
