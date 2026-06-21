/**
 * Restore script — loads the app data from the Supabase cluster backup
 * (db_cluster-23-09-2025@21-01-56.backup.gz) into a fresh database.
 *
 * Usage (after pointing DIRECT_URL at the NEW database and running `prisma db push`):
 *   npm run restore
 *
 * Idempotent: uses skipDuplicates so re-running will not create duplicates.
 */
import { PrismaClient, Unit, LineType } from "@prisma/client";

if (!process.env.DIRECT_URL) {
  throw new Error("DIRECT_URL is required for restore. Set it in .env");
}

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

const users = [
  { id: "cmfex2o2c0000l2vkfyj6yk7x", email: "demo@example.com" },
  { id: "demo-12", email: "kshitijvgarg@gmail.com" },
];

const restaurants = [
  { id: "cmfex2o770002l2vk19my569x", name: "Demo Restaurant", ownerId: "cmfex2o2c0000l2vkfyj6yk7x" },
  { id: "cmffgktem0003l22ctv1z1wqj", name: "flour and dew", ownerId: "cmfex2o2c0000l2vkfyj6yk7x" },
];

const R = "cmfex2o770002l2vk19my569x";

const ingredients = [
  { id: "cmfex2o810004l2vk2id986fl", restaurantId: R, name: "Flour", packQuantity: 2000, packUnit: Unit.G, packCost: 80, wastagePct: 0 },
  { id: "cmfex2ob70006l2vk2jb1kbaw", restaurantId: R, name: "Tomato", packQuantity: 1000, packUnit: Unit.G, packCost: 120, wastagePct: 0 },
  { id: "cmfex2ob80008l2vkki7znd6j", restaurantId: R, name: "Cheese", packQuantity: 500, packUnit: Unit.G, packCost: 250, wastagePct: 0 },
  { id: "cmffqxywj0001l2w4axbff182", restaurantId: "cmffgktem0003l22ctv1z1wqj", name: "flour", packQuantity: 1000, packUnit: Unit.G, packCost: 100, wastagePct: 0 },
  { id: "cmfi7tfzj0003l2q0gkp7f14n", restaurantId: R, name: "Garlic", packQuantity: 500, packUnit: Unit.G, packCost: 150, wastagePct: 0 },
  { id: "cmfi7u29w0005l2q0jo07pf2n", restaurantId: R, name: "olive oil", packQuantity: 1000, packUnit: Unit.ML, packCost: 500, wastagePct: 0 },
  { id: "cmfi7ug0o0007l2q04d4ihs6a", restaurantId: R, name: "onion", packQuantity: 1000, packUnit: Unit.G, packCost: 80, wastagePct: 0 },
  { id: "cmfld9ndj0001l2xoy0f6p117", restaurantId: R, name: "mixed herbs", packQuantity: 500, packUnit: Unit.G, packCost: 10, wastagePct: 0 },
  { id: "cmfldcd8g0003l2xoamvtrbwx", restaurantId: R, name: "Mascerpone Cheese", packQuantity: 250, packUnit: Unit.G, packCost: 195, wastagePct: 0 },
  { id: "cmflde47l0005l2xoc4lxb2wt", restaurantId: R, name: "Eggs", packQuantity: 30, packUnit: Unit.PCS, packCost: 147.5, wastagePct: 0 },
  { id: "cmfldewya0007l2xo1g1a2q17", restaurantId: R, name: "Castor Sugar", packQuantity: 1000, packUnit: Unit.G, packCost: 85, wastagePct: 0 },
  { id: "cmfldfu530009l2xoxkpqvsws", restaurantId: R, name: "Coffee Beans", packQuantity: 1000, packUnit: Unit.G, packCost: 700, wastagePct: 0 },
  { id: "cmfldiqzc000bl2xoj4gvan74", restaurantId: R, name: "Ladyfinger Biscuits", packQuantity: 200, packUnit: Unit.G, packCost: 146.32, wastagePct: 0 },
  { id: "cmfldjem2000dl2xorfo3zpd7", restaurantId: R, name: "Salt", packQuantity: 1000, packUnit: Unit.G, packCost: 28, wastagePct: 0 },
  { id: "cmfldjxni000fl2xolyocpffy", restaurantId: R, name: "Unsweetened Cocoa powder", packQuantity: 1000, packUnit: Unit.G, packCost: 1070, wastagePct: 0 },
];

const recipes = [
  { id: "cmfex2och000al2vkim5d0232", restaurantId: R, name: "Margherita Pizza", yieldQuantity: 1, yieldUnit: Unit.PCS, processLossPct: 0 },
  { id: "cmfldnhog000hl2xog52ydr4u", restaurantId: R, name: "Tiramisu", yieldQuantity: 9, yieldUnit: Unit.PCS, processLossPct: 0 },
  { id: "cmfo74xcg000pl2ykj2nnqgpf", restaurantId: R, name: "marinara sauce", yieldQuantity: 500, yieldUnit: Unit.G, processLossPct: 0 },
  { id: "cmfo76l0c000xl2yktqkz0kvn", restaurantId: R, name: "Pizza base", yieldQuantity: 1, yieldUnit: Unit.PCS, processLossPct: 0 },
  { id: "cmfo77vqy0013l2yk2zccv0ft", restaurantId: R, name: "MGP 2", yieldQuantity: 1, yieldUnit: Unit.PCS, processLossPct: 0 },
];

const recipeLines = [
  { id: "cmfex2oci000cl2vkpq6vzy71", recipeId: "cmfex2och000al2vkim5d0232", lineType: LineType.INGREDIENT, ingredientId: "cmfex2o810004l2vk2id986fl", subRecipeId: null, quantity: 200, unit: Unit.G },
  { id: "cmfex2oci000dl2vk7tw57d1e", recipeId: "cmfex2och000al2vkim5d0232", lineType: LineType.INGREDIENT, ingredientId: "cmfex2ob70006l2vk2jb1kbaw", subRecipeId: null, quantity: 150, unit: Unit.G },
  { id: "cmfex2oci000el2vko99yeafi", recipeId: "cmfex2och000al2vkim5d0232", lineType: LineType.INGREDIENT, ingredientId: "cmfex2ob80008l2vkki7znd6j", subRecipeId: null, quantity: 100, unit: Unit.G },
  { id: "cmfldnhog000jl2xopwz6phy1", recipeId: "cmfldnhog000hl2xog52ydr4u", lineType: LineType.INGREDIENT, ingredientId: "cmfldcd8g0003l2xoamvtrbwx", subRecipeId: null, quantity: 400, unit: Unit.G },
  { id: "cmfldnhog000kl2xo8ff1hzb0", recipeId: "cmfldnhog000hl2xog52ydr4u", lineType: LineType.INGREDIENT, ingredientId: "cmflde47l0005l2xoc4lxb2wt", subRecipeId: null, quantity: 5, unit: Unit.PCS },
  { id: "cmfldnhog000ll2xos6cer14l", recipeId: "cmfldnhog000hl2xog52ydr4u", lineType: LineType.INGREDIENT, ingredientId: "cmfldewya0007l2xo1g1a2q17", subRecipeId: null, quantity: 130, unit: Unit.G },
  { id: "cmfldnhog000ml2xo4a2exp11", recipeId: "cmfldnhog000hl2xog52ydr4u", lineType: LineType.INGREDIENT, ingredientId: "cmfldfu530009l2xoxkpqvsws", subRecipeId: null, quantity: 216, unit: Unit.G },
  { id: "cmfldnhog000nl2xo0v7kek6b", recipeId: "cmfldnhog000hl2xog52ydr4u", lineType: LineType.INGREDIENT, ingredientId: "cmfldiqzc000bl2xoj4gvan74", subRecipeId: null, quantity: 350, unit: Unit.G },
  { id: "cmfldnhoh000ol2xo1el3d31r", recipeId: "cmfldnhog000hl2xog52ydr4u", lineType: LineType.INGREDIENT, ingredientId: "cmfldjem2000dl2xorfo3zpd7", subRecipeId: null, quantity: 1.5, unit: Unit.G },
  { id: "cmfldnhoh000pl2xoo3hp7ijb", recipeId: "cmfldnhog000hl2xog52ydr4u", lineType: LineType.INGREDIENT, ingredientId: "cmfldjxni000fl2xolyocpffy", subRecipeId: null, quantity: 7.5, unit: Unit.G },
  { id: "cmfo74xcg000rl2yk33e3l18g", recipeId: "cmfo74xcg000pl2ykj2nnqgpf", lineType: LineType.INGREDIENT, ingredientId: "cmfex2ob70006l2vk2jb1kbaw", subRecipeId: null, quantity: 400, unit: Unit.G },
  { id: "cmfo74xcg000sl2ykokfh448r", recipeId: "cmfo74xcg000pl2ykj2nnqgpf", lineType: LineType.INGREDIENT, ingredientId: "cmfi7tfzj0003l2q0gkp7f14n", subRecipeId: null, quantity: 10, unit: Unit.G },
  { id: "cmfo74xcg000tl2ykiubxm322", recipeId: "cmfo74xcg000pl2ykj2nnqgpf", lineType: LineType.INGREDIENT, ingredientId: "cmfi7u29w0005l2q0jo07pf2n", subRecipeId: null, quantity: 10, unit: Unit.ML },
  { id: "cmfo74xcg000ul2ykoky9z7r4", recipeId: "cmfo74xcg000pl2ykj2nnqgpf", lineType: LineType.INGREDIENT, ingredientId: "cmfld9ndj0001l2xoy0f6p117", subRecipeId: null, quantity: 2, unit: Unit.G },
  { id: "cmfo74xcg000vl2yk5ed7atsh", recipeId: "cmfo74xcg000pl2ykj2nnqgpf", lineType: LineType.INGREDIENT, ingredientId: "cmfldjem2000dl2xorfo3zpd7", subRecipeId: null, quantity: 2, unit: Unit.G },
  { id: "cmfo76l0c000zl2yklmi0dhk0", recipeId: "cmfo76l0c000xl2yktqkz0kvn", lineType: LineType.INGREDIENT, ingredientId: "cmfex2o810004l2vk2id986fl", subRecipeId: null, quantity: 200, unit: Unit.G },
  { id: "cmfo76l0c0010l2ykqnkyl6fm", recipeId: "cmfo76l0c000xl2yktqkz0kvn", lineType: LineType.INGREDIENT, ingredientId: "cmfldjem2000dl2xorfo3zpd7", subRecipeId: null, quantity: 2, unit: Unit.G },
  { id: "cmfo76l0c0011l2ykx4ahzf7s", recipeId: "cmfo76l0c000xl2yktqkz0kvn", lineType: LineType.INGREDIENT, ingredientId: "cmfi7u29w0005l2q0jo07pf2n", subRecipeId: null, quantity: 15, unit: Unit.ML },
  { id: "cmfo77vqy0015l2yksywxnymh", recipeId: "cmfo77vqy0013l2yk2zccv0ft", lineType: LineType.SUBRECIPE, ingredientId: "cmfex2o810004l2vk2id986fl", subRecipeId: "cmfo74xcg000pl2ykj2nnqgpf", quantity: 500, unit: Unit.G },
  { id: "cmfo77vqy0016l2ykyw8p8ryf", recipeId: "cmfo77vqy0013l2yk2zccv0ft", lineType: LineType.SUBRECIPE, ingredientId: "cmfex2o810004l2vk2id986fl", subRecipeId: "cmfo76l0c000xl2yktqkz0kvn", quantity: 1, unit: Unit.PCS },
  { id: "cmfo77vqy0017l2yk15nlr0k5", recipeId: "cmfo77vqy0013l2yk2zccv0ft", lineType: LineType.INGREDIENT, ingredientId: "cmfex2ob80008l2vkki7znd6j", subRecipeId: null, quantity: 50, unit: Unit.G },
];

const menuItems = [
  { id: "cmfi7lvyx0001l2q08zqmekt8", restaurantId: R, name: "Margherita Pizza", recipeId: "cmfex2och000al2vkim5d0232", sellingPrice: 349 },
  { id: "cmfmnwxb70001l2wcg8353jc0", restaurantId: R, name: "Kshitij Tiramisu", recipeId: "cmfldnhog000hl2xog52ydr4u", sellingPrice: 400 },
  { id: "cmfo78fk70019l2ykt7jcui64", restaurantId: R, name: "anushka margherita", recipeId: "cmfo77vqy0013l2yk2zccv0ft", sellingPrice: 350 },
];

async function main() {
  const url = new URL(process.env.DIRECT_URL as string);
  console.log(`Restoring into ${url.hostname}:${url.port || "(default)"}`);

  await prisma.user.createMany({ data: users, skipDuplicates: true });
  await prisma.restaurant.createMany({ data: restaurants, skipDuplicates: true });
  await prisma.ingredient.createMany({ data: ingredients, skipDuplicates: true });
  await prisma.recipe.createMany({ data: recipes, skipDuplicates: true });
  await prisma.recipeLine.createMany({ data: recipeLines, skipDuplicates: true });
  await prisma.menuItem.createMany({ data: menuItems, skipDuplicates: true });

  console.log("Restore complete:");
  console.log(`  users:        ${await prisma.user.count()}`);
  console.log(`  restaurants:  ${await prisma.restaurant.count()}`);
  console.log(`  ingredients:  ${await prisma.ingredient.count()}`);
  console.log(`  recipes:      ${await prisma.recipe.count()}`);
  console.log(`  recipeLines:  ${await prisma.recipeLine.count()}`);
  console.log(`  menuItems:    ${await prisma.menuItem.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
