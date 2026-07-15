//client/src/components/AdminRoute.tsx
import { Redirect } from "wouter";

import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

export default function AdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" replace />;
  }

  if (!isAdmin) {
    return <Redirect to="/dashboard" replace />;
  }

  return <>{children}</>;
}
