import { useState, type SyntheticEvent } from "react";
import { useCreateShare } from "@/hooks";

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
import type { ShareTargetType, ShareType } from "@/types";

interface ShareDialogProps {
  open: boolean;
  targetId: string;
  targetName: string;
  targetType: ShareTargetType;
  userId: string;
  onOpenChange: (open: boolean) => void;
}

const ShareDialog = ({
  open,
  targetId,
  targetName,
  targetType,
  userId,
  onOpenChange,
}: ShareDialogProps) => {
  const createShare = useCreateShare(userId);
  const [mode, setMode] = useState<ShareType>("PUBLIC");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resetFeedback = () => {
    setPublicUrl(null);
    setSuccess(null);
    setError(null);
    setCopied(false);
    createShare.reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (createShare.isPending) return;

    if (!nextOpen) {
      setMode("PUBLIC");
      setRecipientEmail("");
      resetFeedback();
    }

    onOpenChange(nextOpen);
  };

  const handleModeChange = (nextMode: ShareType) => {
    setMode(nextMode);
    resetFeedback();
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();

    const email = recipientEmail.trim();

    if (mode === "USER" && !email) {
      setError("Recipient email is required.");
      return;
    }

    try {
      const share = await createShare.mutateAsync({
        type: mode,
        targetType,
        targetId,
        ...(mode === "USER" ? { recipientEmail: email } : {}),
      });

      if (mode === "PUBLIC") {
        setPublicUrl(`${window.location.origin}/shared/public/${share.token}`);
      } else {
        setSuccess(`Access shared with ${email}.`);
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to create this share. Please try again.",
        ),
      );
    }
  };

  const handleCopy = async () => {
    if (!publicUrl) return;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setError(null);
    } catch {
      setCopied(false);
      setError("Unable to copy the link. Please copy it manually.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share {targetName}</DialogTitle>
          <DialogDescription>
            Grant read-only access with a public link or to a specific user.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          <Button
            type="button"
            variant={mode === "PUBLIC" ? "default" : "ghost"}
            onClick={() => handleModeChange("PUBLIC")}
          >
            Public link
          </Button>
          <Button
            type="button"
            variant={mode === "USER" ? "default" : "ghost"}
            onClick={() => handleModeChange("USER")}
          >
            Specific user
          </Button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "USER" && (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="share-email">
                Recipient email
              </label>
              <input
                id="share-email"
                autoFocus
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={createShare.isPending}
                onChange={(event) => {
                  setRecipientEmail(event.target.value);
                  setSuccess(null);
                  setError(null);
                }}
                placeholder="user@example.com"
                type="email"
                value={recipientEmail}
              />
            </div>
          )}

          {publicUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="public-share-url">
                Public link
              </label>
              <div className="flex gap-2">
                <input
                  id="public-share-url"
                  className="h-10 min-w-0 flex-1 rounded-lg border bg-muted px-3 text-sm"
                  readOnly
                  value={publicUrl}
                />
                <Button type="button" variant="outline" onClick={handleCopy}>
                  {copied ? "Link copied" : "Copy Link"}
                </Button>
              </div>
            </div>
          )}

          {success && (
            <p className="text-sm text-foreground" role="status">
              {success}
            </p>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                disabled={createShare.isPending}
                type="button"
                variant="outline"
              >
                Close
              </Button>
            </DialogClose>
            <Button
              className="min-w-40"
              disabled={
                createShare.isPending || Boolean(publicUrl) || Boolean(success)
              }
              type="submit"
            >
              {createShare.isPending
                ? "Creating…"
                : mode === "PUBLIC"
                  ? "Create public link"
                  : "Share with user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
