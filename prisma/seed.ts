import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Force session pooler for seeding (use DIRECT_URL only)
if (!process.env.DIRECT_URL) {
  throw new Error("DIRECT_URL is required for seeding (session pooler). Set it in .env");
}
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  const url = process.env.DIRECT_URL || '';
  try {
    const u = new URL(url);
    console.log(`Seeding via ${u.hostname}:${u.port || '(default)'} (DIRECT_URL)`);
  } catch {}
  // Upsert a demo user (login: demo@example.com / demo12345)
  const demoUserEmail = "demo@example.com";
  const passwordHash = await bcrypt.hash("demo12345", 10);
  const user = await prisma.user.upsert({
    where: { email: demoUserEmail },
    update: { passwordHash },
    create: { email: demoUserEmail, name: "Demo User", passwordHash },
  });

  // Create one restaurant with a few ingredients + a sample recipe
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Demo Restaurant",
      ownerId: user.id,
    },
  });

  // Create ingredients
  const [flour, tomato, cheese] = await Promise.all([
    prisma.ingredient.create({
      data: {
        restaurantId: restaurant.id,
        name: "Flour",
        packQuantity: 2000,
        packUnit: "G",
        packCost: 80,
        wastagePct: 0,
      },
    }),
    prisma.ingredient.create({
      data: {
        restaurantId: restaurant.id,
        name: "Tomato",
        packQuantity: 1000,
        packUnit: "G",
        packCost: 120,
        wastagePct: 0,
      },
    }),
    prisma.ingredient.create({
      data: {
        restaurantId: restaurant.id,
        name: "Cheese",
        packQuantity: 500,
        packUnit: "G",
        packCost: 250,
        wastagePct: 0,
      },
    }),
  ]);

  // Create a sample recipe referencing created ingredients
  const recipe = await prisma.recipe.create({
    data: {
      restaurantId: restaurant.id,
      name: "Margherita Pizza",
      yieldQuantity: 1,
      yieldUnit: "PCS",
      processLossPct: 0,
      lines: {
        create: [
          { lineType: "INGREDIENT", ingredientId: flour.id, quantity: 200, unit: "G" },
          { lineType: "INGREDIENT", ingredientId: tomato.id, quantity: 150, unit: "G" },
          { lineType: "INGREDIENT", ingredientId: cheese.id, quantity: 100, unit: "G" },
        ],
      },
    },
    include: { lines: true },
  });

  console.log("✅ Seeded:", { restaurant, recipeName: recipe.name, ingredients: [flour.name, tomato.name, cheese.name] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
