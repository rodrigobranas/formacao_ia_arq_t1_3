import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import "./config/i18n";
import "./styles/index.css";
import { router } from "./router";
import { AuthProvider } from "./store/AuthContext";
import { ThemeProvider } from "./store/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
