import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllCreators } from '@/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, ChevronRight, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

interface CreatorSelectorProps {
  title?: string;
  description?: string;
  onSelect?: (slug: string) => void;
}

const CreatorSelector: React.FC<CreatorSelectorProps> = ({ 
  title = "Selecciona un Creador", 
  description = "Elige al influencer para ver su media kit o solicitar una cotización.",
  onSelect
}) => {
  const { data: creators, isLoading } = useAllCreators();
  const [search, setSearch] = React.useState("");
  const navigate = useNavigate();

  const filteredCreators = creators?.filter(c => 
    c.display_name.toLowerCase().includes(search.toLowerCase()) || 
    c.slug.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSelect = (slug: string) => {
    if (onSelect) {
      onSelect(slug);
    } else {
      navigate(`/${slug}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Cargando creadores...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nombre o slug..." 
          className="pl-10 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCreators.length > 0 ? (
          filteredCreators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-elegant transition-all border-primary/10 hover:border-primary/30 group bg-card/50 backdrop-blur-sm"
                onClick={() => handleSelect(creator.slug)}
              >
                <CardHeader className="p-4 flex flex-row items-center gap-4 space-y-0">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white shrink-0 shadow-sm">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                      {creator.display_name}
                    </CardTitle>
                    <CardDescription className="text-xs truncate">
                      @{creator.slug}
                    </CardDescription>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </CardHeader>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/30">
            <p className="text-muted-foreground">No se encontraron creadores que coincidan con tu búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorSelector;
