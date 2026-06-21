import { NextRequest, NextResponse } from "next/server";
import { Unit } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, userOwnsRestaurant } from "@/lib/auth";

// GET /api/menu?restaurantId=...
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

    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId },
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

    return NextResponse.json(menuItems);
  } catch {
    return NextResponse.json({ message: "Failed to fetch menu items" }, { status: 500 });
  }
}

// POST /api/menu
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { restaurantId, name, recipeId, sellingPrice, extraLines } = body as {
      restaurantId?: string;
      name?: string;
      recipeId?: string;
      sellingPrice?: number;
      extraLines?: Array<{
        ingredientId?: string;
        subRecipeId?: string;
        quantity: number;
        unit: Unit;
      }>;
    };

    if (!restaurantId || !name || !recipeId || sellingPrice === undefined) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    if (!(await userOwnsRestaurant(userId, restaurantId))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const created = await prisma.menuItem.create({
      data: {
        restaurantId,
        name,
        recipeId,
        sellingPrice,
        extraLines:
          extraLines && extraLines.length > 0
            ? {
                create: extraLines.map((line) => ({
                  ingredientId: line.ingredientId,
                  subRecipeId: line.subRecipeId,
                  quantity: line.quantity,
                  unit: line.unit,
                })),
              }
            : undefined,
      },
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

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Failed to create menu item" }, { status: 500 });
  }
}
