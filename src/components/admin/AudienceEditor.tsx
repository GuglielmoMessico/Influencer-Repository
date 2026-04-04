import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAudienceData } from "@/hooks/use-data";
import type { AudienceGender, AudienceAge } from "@/lib/data";
import { toast } from "sonner";
import { Save, Plus, Trash2, Users, Calendar, Loader2 } from "lucide-react";

const AudienceEditor = () => {
  const { genderData, ageData, loading, updateGenderData, updateAgeData } = useAudienceData();
  
  const [localGender, setLocalGender] = useState<AudienceGender[]>([]);
  const [localAge, setLocalAge] = useState<AudienceAge[]>([]);
  const [saving, setSaving] = useState(false);

  // Sync local state with fetched data
  useEffect(() => {
    setLocalGender(genderData);
  }, [genderData]);

  useEffect(() => {
    setLocalAge(ageData);
  }, [ageData]);

  const handleGenderChange = (index: number, field: keyof AudienceGender, value: string | number) => {
    const updated = [...localGender];
    if (field === 'value') {
      updated[index] = { ...updated[index], [field]: Number(value) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setLocalGender(updated);
  };

  const handleAgeChange = (index: number, field: keyof AudienceAge, value: string | number) => {
    const updated = [...localAge];
    if (field === 'percentage' || field === 'order_index') {
      updated[index] = { ...updated[index], [field]: Number(value) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setLocalAge(updated);
  };

  const addAgeRange = () => {
    setLocalAge([
      ...localAge,
      { age: "", percentage: 0, order_index: localAge.length }
    ]);
  };

  const removeAgeRange = (index: number) => {
    if (localAge.length <= 1) {
      toast.error("Debe haber al menos un rango de edad");
      return;
    }
    const updated = localAge.filter((_, i) => i !== index);
    // Reindex
    updated.forEach((item, i) => item.order_index = i);
    setLocalAge(updated);
  };

  const handleSave = async () => {
    // Validate gender totals to 100%
    const genderTotal = localGender.reduce((sum, g) => sum + g.value, 0);
    if (genderTotal !== 100) {
      toast.error(`Los porcentajes de género deben sumar 100% (actual: ${genderTotal}%)`);
      return;
    }

    // Validate age totals to 100%
    const ageTotal = localAge.reduce((sum, a) => sum + a.percentage, 0);
    if (ageTotal !== 100) {
      toast.error(`Los porcentajes de edad deben sumar 100% (actual: ${ageTotal}%)`);
      return;
    }

    setSaving(true);
    
    const [genderSuccess, ageSuccess] = await Promise.all([
      updateGenderData(localGender),
      updateAgeData(localAge)
    ]);

    if (genderSuccess && ageSuccess) {
      toast.success("Datos de audiencia actualizados");
    } else {
      toast.error("Error al guardar algunos datos");
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const genderTotal = localGender.reduce((sum, g) => sum + g.value, 0);
  const ageTotal = localAge.reduce((sum, a) => sum + a.percentage, 0);

  const initializeGenderData = () => {
    setLocalGender([
      { name: "Hombres", value: 50 },
      { name: "Mujeres", value: 50 },
    ]);
  };

  const addGenderCategory = () => {
    setLocalGender([
      ...localGender,
      { name: "", value: 0 }
    ]);
  };

  const removeGenderCategory = (index: number) => {
    if (localGender.length <= 1) {
      toast.error("Debe haber al menos una categoría de género");
      return;
    }
    setLocalGender(localGender.filter((_, i) => i !== index));
  };

  // Estado vacío - no hay datos en la base de datos
  if (localGender.length === 0 && localAge.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sin Datos de Audiencia
            </CardTitle>
            <CardDescription>
              No hay datos de audiencia en la base de datos. Inicializa los datos para comenzar a editar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La sección "Conoce Mi Audiencia" no se mostrará en la página principal hasta que agregues datos aquí.
            </p>
            <div className="flex gap-4">
              <Button onClick={initializeGenderData} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Inicializar Género
              </Button>
              <Button onClick={addAgeRange} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Rango de Edad
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gender Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Distribución por Género
          </CardTitle>
          <CardDescription>
            Los porcentajes deben sumar 100% (actual: {genderTotal}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {localGender.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">No hay categorías de género</p>
              <Button onClick={initializeGenderData} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Inicializar con Hombres/Mujeres
              </Button>
            </div>
          ) : (
            localGender.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Nombre</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => handleGenderChange(index, 'name', e.target.value)}
                    placeholder="Ej: Hombres"
                  />
                </div>
                <div className="w-32">
                  <Label>Porcentaje</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.value}
                      onChange={(e) => handleGenderChange(index, 'value', e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-6 text-destructive hover:text-destructive"
                  onClick={() => removeGenderCategory(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
          
          {localGender.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addGenderCategory}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Categoría
            </Button>
          )}

          {localGender.length > 0 && genderTotal !== 100 && (
            <p className="text-sm text-destructive">
              ⚠️ Los porcentajes deben sumar exactamente 100%
            </p>
          )}
        </CardContent>
      </Card>

      {/* Age Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Distribución por Edad
          </CardTitle>
          <CardDescription>
            Los porcentajes deben sumar 100% (actual: {ageTotal}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {localAge.map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Rango de Edad</Label>
                <Input
                  value={item.age}
                  onChange={(e) => handleAgeChange(index, 'age', e.target.value)}
                  placeholder="Ej: 25-34"
                />
              </div>
              <div className="w-32">
                <Label>Porcentaje</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={item.percentage}
                    onChange={(e) => handleAgeChange(index, 'percentage', e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="mt-6 text-destructive hover:text-destructive"
                onClick={() => removeAgeRange(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={addAgeRange}
            className="mt-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Rango
          </Button>

          {ageTotal !== 100 && (
            <p className="text-sm text-destructive">
              ⚠️ Los porcentajes deben sumar exactamente 100%
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={saving || genderTotal !== 100 || ageTotal !== 100}
        className="w-full"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Guardar Cambios
      </Button>
    </div>
  );
};

export default AudienceEditor;