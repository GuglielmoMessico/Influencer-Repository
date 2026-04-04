import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initializeTheme } from "./hooks/use-theme";

// Configure QueryClient for production hardening
// Default staleTime: 5 mins, No auto refetch on window focus
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const rootElement = document.getElementById("root");

// Initialize theme from Supabase, then render app
const init = async () => {
  await initializeTheme();
  
  if (rootElement) {
    createRoot(rootElement).render(
      <React.StrictMode>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </HelmetProvider>
      </React.StrictMode>
    );
  }
};

init();
