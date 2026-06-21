"use client";

import { useEffect, useMemo, useState } from "react";
import { RestaurantNav } from "@/components/restaurant-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

type RecipeLineInput = {
  lineType: "INGREDIENT" | "SUBRECIPE";
  ingredientId?: string;
  subRecipeId?: string;
  quantity: number;
  unit: string;
};

type Ingredient = { id: string; name: string };

type Recipe = {
  id: string;
  name: string;
  yieldQuantity: number;
  yieldUnit: string;
  lines?: unknown[];
};

const UNITS = ["G", "KG", "ML", "L", "PCS", "TBSP", "TSP", "CUP"];

export default function RecipesPage() {
  const params = useMemo(
    () => new URLSearchParams(typeof window !== "undefined" ? window.location.search : ""),
    []
  );
  const restaurantId = params.get("restaurantId") || "";

  const [name, setName] = useState("");
  const [yieldQuantity, setYieldQuantity] = useState<number>(1);
  const [yieldUnit, setYieldUnit] = useState<string>("PCS");
  const [lines, setLines] = useState<RecipeLineInput[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!restaurantId) return;
      const [ingsRes, recRes] = await Promise.all([
        fetch(`/api/ingredients?restaurantId=${restaurantId}`),
        fetch(`/api/recipes?restaurantId=${restaurantId}`),
      ]);
      const [ings, recs] = await Promise.all([ingsRes.json(), recRes.json()]);
      setIngredients(Array.isArray(ings) ? ings : []);
      setRecipes(Array.isArray(recs) ? recs : []);
    }
    load();
  }, [restaurantId]);

  function addLine() {
    setLines((prev) => [
      ...prev,
      { lineType: "INGREDIENT", ingredientId: ingredients[0]?.id, quantity: 100, unit: "G" },
    ]);
  }

  function updateLine(index: number, patch: Partial<RecipeLineInput>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurantId) return alert("Missing restaurantId");
    setSaving(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, name, yieldQuantity, yieldUnit, lines }),
      });
      if (res.ok) {
        setName("");
        setLines([]);
        const recRes = await fetch(`/api/recipes?restaurantId=${restaurantId}`);
        const recs = await recRes.json();
        setRecipes(Array.isArray(recs) ? recs : []);
      } else {
        const j = await res.json().catch(() => ({}));
        alert(j.message || "Failed to create recipe");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 py-10 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Recipes</h1>
          <p className="text-sm text-muted-foreground">
            Build recipes from ingredients and sub-recipes.
          </p>
        </div>
        <RestaurantNav restaurantId={restaurantId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create recipe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="recName">Name</Label>
                <Input id="recName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marinara Sauce" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="yieldQty">Yield qty</Label>
                <Input id="yieldQty" type="number" value={yieldQuantity} onChange={(e) => setYieldQuantity(parseFloat(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="yieldUnit">Yield unit</Label>
                <NativeSelect id="yieldUnit" value={yieldUnit} onChange={(e) => setYieldUnit(e.target.value)}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </NativeSelect>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Lines</Label>
                <Button type="button" size="sm" variant="outline" onClick={addLine}>
                  <Plus className="size-4" /> Add line
                </Button>
              </div>

              {lines.length === 0 ? (
                <p className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                  No lines yet. Add ingredients or sub-recipes to build this recipe.
                </p>
              ) : (
                <div className="space-y-2">
                  {lines.map((l, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-end rounded-lg border border-border bg-background/40 p-3"
                    >
                      <div className="space-y-1.5 lg:col-span-3">
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <NativeSelect
                          value={l.lineType}
                          onChange={(e) =>
                            updateLine(idx, { lineType: e.target.value as "INGREDIENT" | "SUBRECIPE" })
                          }
                        >
                          <option value="INGREDIENT">Ingredient</option>
                          <option value="SUBRECIPE">Sub-recipe</option>
                        </NativeSelect>
                      </div>
                      <div className="space-y-1.5 lg:col-span-4">
                        <Label className="text-xs text-muted-foreground">
                          {l.lineType === "INGREDIENT" ? "Ingredient" : "Sub-recipe"}
                        </Label>
                        {l.lineType === "INGREDIENT" ? (
                          <NativeSelect
                            value={l.ingredientId}
                            onChange={(e) => updateLine(idx, { ingredientId: e.target.value })}
                          >
                            {ingredients.map((i) => (
                              <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                          </NativeSelect>
                        ) : (
                          <NativeSelect
                            value={l.subRecipeId || ""}
                            onChange={(e) => updateLine(idx, { subRecipeId: e.target.value })}
                          >
                            <option value="">Select sub-recipe…</option>
                            {recipes.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </NativeSelect>
                        )}
                      </div>
                      <div className="space-y-1.5 lg:col-span-2">
                        <Label className="text-xs text-muted-foreground">Qty</Label>
                        <Input
                          type="number"
                          value={l.quantity}
                          onChange={(e) => updateLine(idx, { quantity: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1.5 lg:col-span-2">
                        <Label className="text-xs text-muted-foreground">Unit</Label>
                        <NativeSelect value={l.unit} onChange={(e) => updateLine(idx, { unit: e.target.value })}>
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </NativeSelect>
                      </div>
                      <div className="lg:col-span-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeLine(idx)}
                          aria-label="Remove line"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create recipe"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Existing recipes ({recipes.length})</h2>
        {recipes.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No recipes yet. Create one above.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r) => (
              <Card key={r.id} className="gap-2 py-4 transition-colors hover:border-primary/40">
                <CardContent className="space-y-1">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Yield: {r.yieldQuantity} {r.yieldUnit}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {r.lines?.length ?? 0} line{(r.lines?.length ?? 0) === 1 ? "" : "s"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
