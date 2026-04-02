import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Campana from "./pages/Campana";
import Cotizacion from "./pages/Cotizacion";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { CreatorProvider } from "./context/CreatorContext";

// Create QueryClient inside the module but ensure React is imported
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const AppRoutes = () => (
  <Routes>
    {/* Base/Neutral routes first to win over dynamic slugs */}
    <Route index element={<Index />} />
    <Route path="cotizacion" element={<Cotizacion />} />
    <Route path="admin" element={<Admin />} />
    
    {/* Tenant specific routes */}
    <Route path="/:slug">
      <Route index element={<Index />} />
      <Route path="campana" element={<Campana />} />
      <Route path="cotizacion" element={<Cotizacion />} />
      <Route path="admin" element={<Admin />} />
    </Route>
    
    {/* Fallback */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CreatorProvider>
          <AppRoutes />
        </CreatorProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
