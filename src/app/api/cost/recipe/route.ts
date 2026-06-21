import { NextRequest, NextResponse } from "next/server";
import { Unit } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { costPerYieldUnit, costForPortion, buildCatalog } from "@/lib/costing";
import { getSessionUserId, userOwnsRestaurant } from "@/lib/auth";

// GET /api/cost/recipe?recipeId=...&portionQty=...&portionUnit=...
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const recipeId = searchParams.get("recipeId");
    const portionQty = searchParams.get("portionQty");
    const portionUnit = searchParams.get("portionUnit");

    if (!recipeId) {
      return NextResponse.json({ message: "recipeId is required" }, { status: 400 });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, name: true, yieldQuantity: true, yieldUnit: true, processLossPct: true, restaurantId: true },
    });

    if (!recipe) {
      return NextResponse.json({ message: "Recipe not found" }, { status: 404 });
    }
    if (!(await userOwnsRestaurant(userId, recipe.restaurantId))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const catalog = await buildCatalog(prisma, recipe.restaurantId, recipe.id);
    const costPerUnit = costPerYieldUnit(recipeId, catalog);

    const result: {
      recipeId: string;
      recipeName: string;
      yieldQuantity: number;
      yieldUnit: Unit;
      processLossPct: number;
      costPerYieldUnit: { unit: Unit; cost: number };
      portionCost?: { quantity: number; unit: string; cost: number };
    } = {
      recipeId,
      recipeName: recipe.name,
      yieldQuantity: recipe.yieldQuantity,
      yieldUnit: recipe.yieldUnit,
      processLossPct: recipe.processLossPct,
      costPerYieldUnit: costPerUnit,
    };

    if (portionQty && portionUnit) {
      const portionCost = costForPortion(
        recipeId,
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
    console.error("Recipe costing error:", error);
    return NextResponse.json(
      { message: "Failed to calculate recipe cost", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
