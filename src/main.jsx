import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { PlaybackProvider } from "./context/PlaybackContext.jsx";
import { FriendsProvider } from "./context/FriendsContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <FriendsProvider>
        <PlaybackProvider>
          <App />
        </PlaybackProvider>
      </FriendsProvider>
    </AuthProvider>
  </React.StrictMode>
);
