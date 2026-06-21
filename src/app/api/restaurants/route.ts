import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

// GET /api/restaurants -> list the signed-in user's restaurants
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { ownerId: userId },
      include: {
        ingredients: true,
        recipes: true,
      },
    });
    return NextResponse.json(restaurants);
  } catch {
    return NextResponse.json({ message: "Failed to fetch restaurants" }, { status: 500 });
  }
}

// POST /api/restaurants -> create a restaurant owned by the signed-in user
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { name } = body as { name?: string };
    if (!name) {
      return NextResponse.json({ message: "name is required" }, { status: 400 });
    }

    const created = await prisma.restaurant.create({
      data: { name, ownerId: userId },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Failed to create restaurant" }, { status: 500 });
  }
}
