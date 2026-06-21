import { NextRequest, NextResponse } from "next/server";
import { LineType, Unit } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, userOwnsRestaurant } from "@/lib/auth";

// GET /api/recipes?restaurantId=...
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");
    if (!restaurantId) {
      return NextResponse.json({ message: "restaurantId is required" }, { status: 400 });
    }
    if (!(await userOwnsRestaurant(userId, restaurantId))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const recipes = await prisma.recipe.findMany({
      where: { restaurantId },
      include: { lines: true },
    });
    return NextResponse.json(recipes);
  } catch {
    return NextResponse.json({ message: "Failed to fetch recipes" }, { status: 500 });
  }
}

// POST /api/recipes
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { restaurantId, name, yieldQuantity, yieldUnit, processLossPct, lines } = body as {
      restaurantId?: string;
      name?: string;
      yieldQuantity?: number;
      yieldUnit?: Unit;
      processLossPct?: number;
      lines?: Array<{
        lineType: LineType;
        ingredientId?: string;
        subRecipeId?: string;
        quantity: number;
        unit: Unit;
      }>;
    };

    if (!restaurantId || !name || !yieldQuantity || !yieldUnit) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    if (!(await userOwnsRestaurant(userId, restaurantId))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const created = await prisma.recipe.create({
      data: {
        restaurantId,
        name,
        yieldQuantity,
        yieldUnit,
        processLossPct: processLossPct ?? 0,
        lines:
          lines && lines.length > 0
            ? {
                create: lines.map((l) => ({
                  lineType: l.lineType,
                  ingredientId: l.ingredientId,
                  subRecipeId: l.subRecipeId,
                  quantity: l.quantity,
                  unit: l.unit,
                })),
              }
            : undefined,
      },
      include: { lines: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Failed to create recipe" }, { status: 500 });
  }
}
