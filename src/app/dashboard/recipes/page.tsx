"use client";

import { useEffect, useMemo, useState } from "react";
import { RestaurantNav } from "@/components/restaurant-nav";

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
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Recipes</h1>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Restaurant: {restaurantId || "unknown"}</p>
        <RestaurantNav restaurantId={restaurantId} />
      </div>

      <form onSubmit={onCreate} className="space-y-4">
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Yield Qty</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground"
              value={yieldQuantity}
              onChange={(e) => setYieldQuantity(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Yield Unit</label>
            <select
              className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground"
              value={yieldUnit}
              onChange={(e) => setYieldUnit(e.target.value)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={addLine}
            className="bg-primary text-primary-foreground px-4 py-2 rounded"
          >
            Add Line
          </button>
        </div>

        <div className="space-y-2">
          {lines.map((l, idx) => (
            <div
              key={idx}
              className="grid md:grid-cols-6 gap-2 items-end border rounded p-3 bg-card text-card-foreground"
            >
              <div>
                <label className="block text-sm mb-1">Type</label>
                <select
                  className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground"
                  value={l.lineType}
                  onChange={(e) =>
                    updateLine(idx, { lineType: e.target.value as "INGREDIENT" | "SUBRECIPE" })
                  }
                >
                  <option value="INGREDIENT">Ingredient</option>
                  <option value="SUBRECIPE">Sub-recipe</option>
                </select>
              </div>
              {l.lineType === "INGREDIENT" ? (
                <div>
                  <label className="block text-sm mb-1">Ingredient</label>
                  <select
                    className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground"
                    value={l.ingredientId}
                    onChange={(e) => updateLine(idx, { ingredientId: e.target.value })}
                  >
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm mb-1">Sub-recipe</label>
                  <select
                    className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground"
                    value={l.subRecipeId || ""}
                    onChange={(e) => updateLine(idx, { subRecipeId: e.target.value })}
                  >
                    <option value="">-- Select Sub-recipe --</option>
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm mb-1">Qty</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground"
                  value={l.quantity}
                  onChange={(e) => updateLine(idx, { quantity: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Unit</label>
                <select
                  className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground"
                  value={l.unit}
                  onChange={(e) => updateLine(idx, { unit: e.target.value })}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  className="border px-3 rounded"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="bg-primary text-primary-foreground px-4 py-2 rounded" disabled={saving}>
          {saving ? "Saving..." : "Create Recipe"}
        </button>
      </form>

      <div>
        <h2 className="text-xl font-medium mb-3">Existing Recipes</h2>
        <div className="space-y-2">
          {recipes.map((r) => (
            <div key={r.id} className="border rounded p-3 bg-card text-card-foreground">
              <div className="font-medium">{r.name}</div>
              <div className="text-sm text-muted-foreground">
                Yield: {r.yieldQuantity} {r.yieldUnit}
              </div>
              <div className="text-sm">Lines: {r.lines?.length ?? 0}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
