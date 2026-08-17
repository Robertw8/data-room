import { Navigate, Route, Routes } from "react-router-dom";
import GuestRoute from "@/components/auth/GuestRoute";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DataRoomPage from "@/pages/DataRoomPage";
import DataRoomsPage from "@/pages/DataRoomsPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import SharedExplorerPage from "@/pages/SharedExplorerPage";
import SharesCreatedPage from "@/pages/SharesCreatedPage";
import SharesReceivedPage from "@/pages/SharesReceivedPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route
        path="/shared/public/:token"
        element={<SharedExplorerPage mode="public" />}
      />
      <Route
        path="/shared/public/:token/folders/:folderId"
        element={<SharedExplorerPage mode="public" />}
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DataRoomsPage />} />
        <Route path="/data-rooms/:dataRoomId" element={<DataRoomPage />} />
        <Route
          path="/data-rooms/:dataRoomId/folders/:folderId"
          element={<DataRoomPage />}
        />
        <Route path="/shares/created" element={<SharesCreatedPage />} />
        <Route path="/shares/received" element={<SharesReceivedPage />} />
        <Route
          path="/shared/user/:token"
          element={<SharedExplorerPage mode="user" />}
        />
        <Route
          path="/shared/user/:token/folders/:folderId"
          element={<SharedExplorerPage mode="user" />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
