import type { PrismaClient, Prisma, Unit } from "@prisma/client";

type IngredientNode = {
  type: "ingredient";
  id: string;
  name: string;
  packCost: number;
  packQuantity: number;
  packUnit: Unit;
  wastagePct: number;
};

type RecipeLine = {
  type: "ingredient" | "recipe";
  refId: string;
  quantity: number;
  unit: Unit;
};

type RecipeNode = {
  type: "recipe";
  id: string;
  name: string;
  yieldQuantity: number;
  yieldUnit: Unit;
  processLossPct: number;
  lines: RecipeLine[];
};

export type Catalog = {
  ingredients: Record<string, IngredientNode>;
  recipes: Record<string, RecipeNode>;
};

// ---- Unit handling --------------------------------------------------------
// Each unit reduces to a canonical base within its kind. Conversions across
// kinds (e.g. mass <-> count) are genuine data errors and throw, rather than
// silently returning the raw quantity.

type Kind = "mass" | "volume" | "count";

const UNIT_BASE: Record<Unit, { kind: Kind; perBase: number }> = {
  G: { kind: "mass", perBase: 1 }, // base: gram
  KG: { kind: "mass", perBase: 1000 },
  ML: { kind: "volume", perBase: 1 }, // base: millilitre
  L: { kind: "volume", perBase: 1000 },
  TSP: { kind: "volume", perBase: 5 },
  TBSP: { kind: "volume", perBase: 15 },
  CUP: { kind: "volume", perBase: 240 },
  PCS: { kind: "count", perBase: 1 },
};

export function sameKind(a: Unit, b: Unit): boolean {
  return UNIT_BASE[a].kind === UNIT_BASE[b].kind;
}

export function convertUnits(quantity: number, fromUnit: Unit, toUnit: Unit): number {
  if (fromUnit === toUnit) return quantity;

  const from = UNIT_BASE[fromUnit];
  const to = UNIT_BASE[toUnit];
  if (!from || !to) {
    throw new Error(`Unknown unit conversion: ${fromUnit} → ${toUnit}`);
  }
  if (from.kind !== to.kind) {
    throw new Error(
      `Incompatible units: cannot convert ${fromUnit} (${from.kind}) to ${toUnit} (${to.kind})`
    );
  }
  // Convert via the kind's base unit.
  return (quantity * from.perBase) / to.perBase;
}

export function calculateIngredientUnitCost(ing: IngredientNode) {
  const usable = ing.packQuantity * (1 - (ing.wastagePct || 0) / 100);
  if (usable <= 0) throw new Error(`Ingredient ${ing.id} has non-positive usable quantity`);
  const costPerPackUnit = ing.packCost / usable;
  return { unit: ing.packUnit, cost: costPerPackUnit };
}

export function costPerYieldUnit(recipeId: string, catalog: Catalog) {
  const visiting = new Set<string>();
  const memo = new Map<string, { unit: Unit; cost: number }>();

  function costOfRecipe(id: string): { unit: Unit; cost: number } {
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) throw new Error(`Cycle detected in recipes (id=${id})`);
    visiting.add(id);

    const r = catalog.recipes[id];
    if (!r) throw new Error(`Recipe ${id} not found in catalog`);

    let totalCost = 0;

    for (const line of r.lines ?? []) {
      if (line.type === "ingredient") {
        const ing = catalog.ingredients[line.refId];
        if (!ing) throw new Error(`Ingredient ${line.refId} not found for recipe ${r.name}`);

        const { unit: packUnit, cost: costPerPackUnit } = calculateIngredientUnitCost(ing);
        const qty = convertUnits(line.quantity, line.unit, packUnit);
        totalCost += qty * costPerPackUnit;
      } else {
        const child = costOfRecipe(line.refId);
        const qty = convertUnits(line.quantity, line.unit, child.unit);
        totalCost += qty * child.cost;
      }
    }

    const effectiveYield = r.yieldQuantity * (1 - (r.processLossPct || 0) / 100);
    if (effectiveYield <= 0) throw new Error(`Recipe ${r.name} has non-positive effective yield`);

    const costPerYield = totalCost / effectiveYield;
    const result = { unit: r.yieldUnit, cost: costPerYield };

    memo.set(id, result);
    visiting.delete(id);
    return result;
  }

  return costOfRecipe(recipeId);
}

export function costForPortion(
  recipeId: string,
  portionQty: number,
  portionUnit: Unit,
  catalog: Catalog
) {
  const { unit: yieldUnit, cost } = costPerYieldUnit(recipeId, catalog);
  const qty = convertUnits(portionQty, portionUnit, yieldUnit);
  return qty * cost;
}

export function calculateProfitMargin(
  sellingPrice: number,
  cost: number
): { profitMargin: number; profitMarginPercent: number } {
  const profitMargin = sellingPrice - cost;
  const profitMarginPercent =
    sellingPrice === 0 ? 0 : (profitMargin / sellingPrice) * 100;
  return { profitMargin, profitMarginPercent };
}

type RecipeWithLines = Prisma.RecipeGetPayload<{ include: { lines: true } }>;

/**
 * Build a catalog from the database.
 * If baseRecipeId is provided, recursively fetches only that recipe and its
 * sub-recipes. Otherwise fetches all recipes for the restaurant.
 */
export async function buildCatalog(
  prisma: PrismaClient,
  restaurantId: string,
  baseRecipeId?: string
): Promise<Catalog> {
  const recipesMap: Record<string, RecipeWithLines> = {};

  async function fetchRecipeAndSubRecipes(recipeId: string) {
    if (!recipeId) return;
    if (recipesMap[recipeId]) return; // already fetched

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { lines: true },
    });
    if (!recipe) return;
    recipesMap[recipe.id] = recipe;

    for (const line of recipe.lines ?? []) {
      if (line.lineType === "SUBRECIPE" && line.subRecipeId) {
        await fetchRecipeAndSubRecipes(line.subRecipeId);
      }
    }
  }

  if (baseRecipeId) {
    await fetchRecipeAndSubRecipes(baseRecipeId);
  } else {
    const recipesAll = await prisma.recipe.findMany({
      where: { restaurantId },
      include: { lines: true },
    });
    for (const r of recipesAll) {
      await fetchRecipeAndSubRecipes(r.id);
    }
  }

  // Gather every ingredient referenced by the collected recipes.
  const allIngredientIds = new Set<string>();
  for (const recipe of Object.values(recipesMap)) {
    for (const line of recipe.lines ?? []) {
      if (line.ingredientId) allIngredientIds.add(line.ingredientId);
    }
  }

  const ingredientsRaw = await prisma.ingredient.findMany({
    where: { id: { in: Array.from(allIngredientIds) }, restaurantId },
  });

  const ingredients: Record<string, IngredientNode> = {};
  for (const ing of ingredientsRaw) {
    ingredients[ing.id] = {
      type: "ingredient",
      id: ing.id,
      name: ing.name,
      packCost: ing.packCost,
      packQuantity: ing.packQuantity,
      packUnit: ing.packUnit,
      wastagePct: ing.wastagePct ?? 0,
    };
  }

  const recipes: Record<string, RecipeNode> = {};
  for (const recipe of Object.values(recipesMap)) {
    recipes[recipe.id] = {
      type: "recipe",
      id: recipe.id,
      name: recipe.name,
      yieldQuantity: recipe.yieldQuantity,
      yieldUnit: recipe.yieldUnit,
      processLossPct: recipe.processLossPct ?? 0,
      lines: (recipe.lines ?? []).map((l) => ({
        type: l.lineType === "INGREDIENT" ? "ingredient" : "recipe",
        refId: l.ingredientId ?? l.subRecipeId ?? "",
        quantity: l.quantity,
        unit: l.unit,
      })),
    };
  }

  return { ingredients, recipes };
}
