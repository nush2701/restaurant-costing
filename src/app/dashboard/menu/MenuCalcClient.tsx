"use client";
import { useState, useEffect } from "react";
import type { Unit } from "@/lib/units";
import { RestaurantNav } from "@/components/restaurant-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MenuItem = {
  id: string;
  name: string;
  sellingPrice: number;
  recipe: {
    id: string;
    name: string;
    yieldQuantity: number;
    yieldUnit: Unit;
    processLossPct: number;
  };
  extraLines: Array<{
    id: string;
    quantity: number;
    unit: Unit;
    ingredient?: { name: string };
    subRecipe?: { name: string };
  }>;
};

type Recipe = {
  id: string;
  name: string;
  yieldQuantity: number;
  yieldUnit: string;
  processLossPct: number;
};

type CostingResult = {
  menuItemId: string;
  menuItemName: string;
  sellingPrice: number;
  totalCostPerYieldUnit?: {
    unit: string;
    cost: number;
  };
  profitMargin: number;
  profitMarginPercent: number;
  portionCost?: {
    quantity: number;
    unit: string;
    cost: number;
  };
  error?: string;
};

export default function MenuCalcClient({ restaurantId }: { restaurantId: string }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [costingResults, setCostingResults] = useState<Record<string, CostingResult>>({});
  const [portionQty, setPortionQty] = useState("1");
  const [portionUnit, setPortionUnit] = useState("PCS");

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMenuItemName, setNewMenuItemName] = useState("");
  const [newMenuItemRecipeId, setNewMenuItemRecipeId] = useState("");
  const [newMenuItemPrice, setNewMenuItemPrice] = useState("");

  async function loadMenuItems() {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/menu?restaurantId=${restaurantId}`);
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load menu items:", error);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadRecipes() {
    if (!restaurantId) return;
    try {
      const res = await fetch(`/api/recipes?restaurantId=${restaurantId}`);
      const data = await res.json();
      setRecipes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load recipes:", error);
      setRecipes([]);
    }
  }

  // Inside your calculateCosts function in MenuCalcClient.tsx

async function calculateCosts() {
  if (!restaurantId) return;
  const results: Record<string, CostingResult> = {};
  for (const menuItem of menuItems) {
    try {
      const url = new URL("/api/cost/menu-item", window.location.origin);
      url.searchParams.set("menuItemId", menuItem.id);
      if (portionQty) url.searchParams.set("portionQty", portionQty);
      if (portionUnit) url.searchParams.set("portionUnit", portionUnit);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (res.ok && data.totalCostPerYieldUnit) {
        results[menuItem.id] = data;
      } else if (data.error) {
        // Surface error to UI
        results[menuItem.id] = { menuItemId: menuItem.id, menuItemName: menuItem.name, sellingPrice: menuItem.sellingPrice, profitMargin: 0, profitMarginPercent: 0, error: data.error };
      } else {
        console.error("Costing failed for", menuItem.name, data);
      }
    } catch (error) {
      console.error(`Failed to calculate cost for ${menuItem.name}:`, error);
    }
  }
  setCostingResults(results);
}


  async function createMenuItem(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurantId || !newMenuItemName || !newMenuItemRecipeId || !newMenuItemPrice) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          name: newMenuItemName,
          recipeId: newMenuItemRecipeId,
          sellingPrice: parseFloat(newMenuItemPrice),
        }),
      });

      if (res.ok) {
        setNewMenuItemName("");
        setNewMenuItemRecipeId("");
        setNewMenuItemPrice("");
        setShowCreateForm(false);
        await loadMenuItems();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to create menu item");
      }
    } catch (error) {
      console.error("Failed to create menu item:", error);
      alert("Failed to create menu item");
    }
  }

  useEffect(() => {
    if (restaurantId) {
      loadMenuItems();
      loadRecipes();
    }
  }, [restaurantId]);

  useEffect(() => {
    if (menuItems.length > 0) {
      calculateCosts();
    }
  }, [menuItems, portionQty, portionUnit]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Menu Costing</h1>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Restaurant: {restaurantId || "unknown"}
        </p>
        <RestaurantNav restaurantId={restaurantId} />
      </div>

      {/* Portion controls */}
      <Card>
        <CardHeader>
          <CardTitle>Portion Calculation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="portionQty">Portion Quantity</Label>
              <Input
                id="portionQty"
                type="number"
                value={portionQty}
                onChange={(e) => setPortionQty(e.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <Label htmlFor="portionUnit">Unit</Label>
              <select
                id="portionUnit"
                className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground"
                value={portionUnit}
                onChange={(e) => setPortionUnit(e.target.value)}
              >
                {["PCS", "G", "KG", "ML", "L", "CUP", "TBSP", "TSP"].map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={calculateCosts}>Recalculate</Button>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Menu Items</CardTitle>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? "Cancel" : "Add Menu Item"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCreateForm && (
            <form
              onSubmit={createMenuItem}
              className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-4"
            >
              <div>
                <Label htmlFor="menuItemName">Menu Item Name</Label>
                <Input
                  id="menuItemName"
                  value={newMenuItemName}
                  onChange={(e) => setNewMenuItemName(e.target.value)}
                  placeholder="e.g., Margherita Pizza"
                />
              </div>
              <div>
                <Label htmlFor="menuItemRecipe">Recipe</Label>
                <select
                  id="menuItemRecipe"
                  className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground"
                  value={newMenuItemRecipeId}
                  onChange={(e) => setNewMenuItemRecipeId(e.target.value)}
                >
                  <option value="">Select Recipe</option>
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="menuItemPrice">Selling Price (₹)</Label>
                <Input
                  id="menuItemPrice"
                  type="number"
                  step="0.01"
                  value={newMenuItemPrice}
                  onChange={(e) => setNewMenuItemPrice(e.target.value)}
                  placeholder="299.00"
                />
              </div>
              <Button type="submit">Create</Button>
            </form>
          )}

          {loading ? (
            <p>Loading menu items...</p>
          ) : menuItems.length === 0 ? (
            <p className="text-muted-foreground">No menu items found. Create one above.</p>
          ) : (
            <div className="space-y-4">
              {menuItems.map((menuItem) => {
                 const costing = costingResults[menuItem.id];
                  if (costing?.error) {
                    return (
                      <div key={menuItem.id} style={{ color: "red" }}>
                        Error calculating cost: {costing.error}
                      </div>
                    );
                  }
                return (
                  <Card key={menuItem.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{menuItem.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Based on: {menuItem.recipe.name} ({menuItem.recipe.yieldQuantity}{" "}
                            {menuItem.recipe.yieldUnit})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">₹{menuItem.sellingPrice}</p>
                          <p className="text-sm text-muted-foreground">Selling Price</p>
                        </div>
                      </div>

                      {costing && costing.totalCostPerYieldUnit && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Cost per {costing.totalCostPerYieldUnit.unit}
                            </p>
                            <p className="font-semibold">
                              ₹{costing.totalCostPerYieldUnit.cost.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Profit Margin</p>
                            <p className="font-semibold">
                              ₹{costing.profitMargin.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Margin %</p>
                            <p
                              className={`font-semibold ${
                                costing.profitMarginPercent >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {costing.profitMarginPercent.toFixed(1)}%
                            </p>
                          </div>
                          {costing.portionCost && (
                            <div>
                              <p className="text-sm text-muted-foreground">Portion Cost</p>
                              <p className="font-semibold">
                                ₹{costing.portionCost.cost.toFixed(2)} (
                                {costing.portionCost.quantity} {costing.portionCost.unit})
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {menuItem.extraLines?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">Extra ingredients:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {menuItem.extraLines.map((extra) => (
                              <span
                                key={extra.id}
                                className="text-xs bg-secondary px-2 py-1 rounded"
                              >
                                {extra.quantity} {extra.unit}{" "}
                                {extra.ingredient?.name || extra.subRecipe?.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
