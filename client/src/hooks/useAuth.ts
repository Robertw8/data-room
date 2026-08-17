import { AuthContext } from "@/providers";
import { useContext } from "react";

const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("No auth context found");
  }

  return context;
};

export default useAuth;
