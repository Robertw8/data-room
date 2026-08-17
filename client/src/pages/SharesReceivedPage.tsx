import { Link } from "react-router-dom";
import { useAuth, useReceivedShares } from "@/hooks";
import AuthenticatedHeader from "@/components/shares/AuthenticatedHeader";
import { Button } from "@/components/ui/button";

import getApiErrorMessage from "@/lib/api-error";

const formatDate = (date: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

const SharesReceivedPage = () => {
  const { logout, user } = useAuth();

  if (!user) return null;

  return (
    <SharesReceivedContent
      email={user.email}
      userId={user.id}
      onLogout={logout}
    />
  );
};

interface SharesReceivedContentProps {
  email: string;
  userId: string;
  onLogout: () => void;
}

const SharesReceivedContent = ({
  email,
  userId,
  onLogout,
}: SharesReceivedContentProps) => {
  const shares = useReceivedShares(userId);

  return (
    <main className="min-h-screen bg-muted/30">
      <AuthenticatedHeader email={email} onLogout={onLogout} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Shared with me
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Open resources shared directly with your account.
          </p>
        </div>

        {shares.isPending && (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            Loading shared resources…
          </div>
        )}

        {shares.isError && (
          <div className="rounded-xl border border-destructive/30 bg-card p-8 text-center">
            <p className="text-sm text-destructive" role="alert">
              {getApiErrorMessage(
                shares.error,
                "Unable to load shared resources. Please try again.",
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
            <h2 className="text-lg font-semibold">Nothing shared with you</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Resources shared with your email will appear here.
            </p>
          </div>
        )}

        {shares.isSuccess && shares.data.length > 0 && (
          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            {shares.data.map(({ share, targetType, item }) => (
              <div
                className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-4 last:border-b-0"
                key={share.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {targetType} · {share.role} · {formatDate(share.createdAt)}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/shared/user/${share.token}`}>Open</Link>
                </Button>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
};

export default SharesReceivedPage;
