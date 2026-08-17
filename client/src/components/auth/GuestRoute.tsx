import { useAuth } from "@/hooks";
import { Navigate, Outlet } from "react-router-dom";
import AuthLoading from "./AuthLoading";

const GuestRoute = () => {
  const { isLoading, user } = useAuth();

  if (isLoading) return <AuthLoading />;
  if (user) return <Navigate to="/app" replace />;

  return <Outlet />;
};

export default GuestRoute;
