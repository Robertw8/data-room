import { useAuth } from "@/hooks";
import { Navigate, Outlet } from "react-router-dom";
import AuthLoading from "./AuthLoading";

const ProtectedRoute = () => {
  const { isLoading, user } = useAuth();

  if (isLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
