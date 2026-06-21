import { NextRequest, NextResponse } from "next/server";
import { Unit } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, userOwnsRestaurant } from "@/lib/auth";

// GET /api/ingredients?restaurantId=...
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
    const ingredients = await prisma.ingredient.findMany({ where: { restaurantId } });
    return NextResponse.json(ingredients);
  } catch {
    return NextResponse.json({ message: "Failed to fetch ingredients" }, { status: 500 });
  }
}

// POST /api/ingredients
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { restaurantId, name, packQuantity, packUnit, packCost, wastagePct } = body as {
      restaurantId?: string;
      name?: string;
      packQuantity?: number;
      packUnit?: Unit;
      packCost?: number;
      wastagePct?: number;
    };
    if (!restaurantId || !name || !packQuantity || !packUnit || packCost === undefined) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    if (!(await userOwnsRestaurant(userId, restaurantId))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const created = await prisma.ingredient.create({
      data: {
        restaurantId,
        name,
        packQuantity,
        packUnit,
        packCost,
        wastagePct: wastagePct ?? 0,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Failed to create ingredient" }, { status: 500 });
  }
}
