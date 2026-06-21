import { NextRequest, NextResponse } from "next/server";
import { Unit } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  costPerYieldUnit,
  costForPortion,
  buildCatalog,
  calculateProfitMargin,
  calculateIngredientUnitCost,
  convertUnits,
} from "@/lib/costing";
import { getSessionUserId, userOwnsRestaurant } from "@/lib/auth";

// GET /api/cost/menu-item?menuItemId=...&portionQty=...&portionUnit=...
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const menuItemId = searchParams.get("menuItemId");
    const portionQty = searchParams.get("portionQty");
    const portionUnit = searchParams.get("portionUnit");

    if (!menuItemId) {
      return NextResponse.json({ message: "menuItemId is required" }, { status: 400 });
    }

    // Fetch menu item with recipe + extra lines
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        recipe: {
          include: {
            lines: {
              include: {
                ingredient: true,
                subRecipe: true,
              },
            },
          },
        },
        extraLines: {
          include: {
            ingredient: true,
            subRecipe: true,
          },
        },
      },
    });

    if (!menuItem) {
      return NextResponse.json({ message: "Menu item not found" }, { status: 404 });
    }
    if (!(await userOwnsRestaurant(userId, menuItem.restaurantId))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Build catalog for the whole restaurant so base recipe and any extra
    // sub-recipes are all resolvable.
    const catalog = await buildCatalog(prisma, menuItem.restaurantId);

    // Base recipe costing
    const baseRecipeCost = costPerYieldUnit(menuItem.recipe.id, catalog);

    // Extra lines costing (applies wastage + unit conversion)
    let extraCost = 0;
    for (const line of menuItem.extraLines) {
      if (line.ingredient) {
        const { unit: packUnit, cost: costPerPackUnit } = calculateIngredientUnitCost({
          type: "ingredient",
          id: line.ingredient.id,
          name: line.ingredient.name,
          packCost: line.ingredient.packCost,
          packQuantity: line.ingredient.packQuantity,
          packUnit: line.ingredient.packUnit,
          wastagePct: line.ingredient.wastagePct,
        });
        const qty = convertUnits(line.quantity, line.unit, packUnit);
        extraCost += qty * costPerPackUnit;
      } else if (line.subRecipe) {
        const child = costPerYieldUnit(line.subRecipe.id, catalog);
        const qty = convertUnits(line.quantity, line.unit, child.unit);
        extraCost += qty * child.cost;
      }
    }

    const totalCostPerYieldUnit = {
      unit: baseRecipeCost.unit,
      cost: baseRecipeCost.cost + extraCost,
    };

    const { profitMargin, profitMarginPercent } = calculateProfitMargin(
      menuItem.sellingPrice,
      totalCostPerYieldUnit.cost
    );

    const result: {
      menuItemId: string;
      menuItemName: string;
      sellingPrice: number;
      recipeId: string;
      recipeName: string;
      yieldQuantity: number;
      yieldUnit: Unit;
      processLossPct: number;
      baseRecipeCost: { unit: Unit; cost: number };
      extraCost: number;
      totalCostPerYieldUnit: { unit: Unit; cost: number };
      profitMargin: number;
      profitMarginPercent: number;
      portionCost?: { quantity: number; unit: string; cost: number };
    } = {
      menuItemId,
      menuItemName: menuItem.name,
      sellingPrice: menuItem.sellingPrice,
      recipeId: menuItem.recipe.id,
      recipeName: menuItem.recipe.name,
      yieldQuantity: menuItem.recipe.yieldQuantity,
      yieldUnit: menuItem.recipe.yieldUnit,
      processLossPct: menuItem.recipe.processLossPct,
      baseRecipeCost,
      extraCost,
      totalCostPerYieldUnit,
      profitMargin,
      profitMarginPercent,
    };

    // Portion costing if provided
    if (portionQty && portionUnit) {
      const portionCost = costForPortion(
        menuItem.recipe.id,
        parseFloat(portionQty),
        portionUnit as Unit,
        catalog
      );
      result.portionCost = {
        quantity: parseFloat(portionQty),
        unit: portionUnit,
        cost: portionCost,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Menu item costing error:", error);
    return NextResponse.json(
      {
        message: "Failed to calculate menu item cost",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
