import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeTheme } from "./hooks/use-theme";

const rootElement = document.getElementById("root");

// Initialize theme from Supabase, then render app
const init = async () => {
  await initializeTheme();
  
  if (rootElement) {
    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
};

init();
