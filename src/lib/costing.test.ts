import { describe, it, expect } from "vitest";
import type { Unit } from "@prisma/client";
import {
  convertUnits,
  calculateIngredientUnitCost,
  calculateProfitMargin,
  costPerYieldUnit,
  costForPortion,
  type Catalog,
} from "./costing";

const U = (u: string) => u as Unit;

describe("convertUnits", () => {
  it("returns the same quantity for identical units", () => {
    expect(convertUnits(5, U("G"), U("G"))).toBe(5);
  });

  it("converts within mass", () => {
    expect(convertUnits(2, U("KG"), U("G"))).toBe(2000);
    expect(convertUnits(500, U("G"), U("KG"))).toBe(0.5);
  });

  it("converts within volume (including spoons)", () => {
    expect(convertUnits(1, U("L"), U("ML"))).toBe(1000);
    expect(convertUnits(1, U("TBSP"), U("ML"))).toBe(15);
    expect(convertUnits(1, U("CUP"), U("ML"))).toBe(240);
  });

  it("throws when converting across incompatible kinds", () => {
    expect(() => convertUnits(1, U("G"), U("ML"))).toThrow(/Incompatible units/);
    expect(() => convertUnits(1, U("PCS"), U("G"))).toThrow(/Incompatible units/);
  });
});

describe("calculateIngredientUnitCost", () => {
  it("computes cost per pack unit", () => {
    const { unit, cost } = calculateIngredientUnitCost({
      type: "ingredient",
      id: "i1",
      name: "Flour",
      packCost: 80,
      packQuantity: 2000,
      packUnit: U("G"),
      wastagePct: 0,
    });
    expect(unit).toBe("G");
    expect(cost).toBeCloseTo(0.04); // 80 / 2000
  });

  it("accounts for wastage", () => {
    const { cost } = calculateIngredientUnitCost({
      type: "ingredient",
      id: "i1",
      name: "Lettuce",
      packCost: 100,
      packQuantity: 1000,
      packUnit: U("G"),
      wastagePct: 20, // usable = 800g
    });
    expect(cost).toBeCloseTo(0.125); // 100 / 800
  });

  it("throws when usable quantity is non-positive", () => {
    expect(() =>
      calculateIngredientUnitCost({
        type: "ingredient",
        id: "i1",
        name: "Bad",
        packCost: 10,
        packQuantity: 100,
        packUnit: U("G"),
        wastagePct: 100,
      })
    ).toThrow();
  });
});

describe("calculateProfitMargin", () => {
  it("computes margin and percentage", () => {
    expect(calculateProfitMargin(100, 40)).toEqual({
      profitMargin: 60,
      profitMarginPercent: 60,
    });
  });

  it("returns 0% when selling price is 0", () => {
    expect(calculateProfitMargin(0, 10).profitMarginPercent).toBe(0);
  });
});

describe("costPerYieldUnit", () => {
  const catalog: Catalog = {
    ingredients: {
      flour: {
        type: "ingredient",
        id: "flour",
        name: "Flour",
        packCost: 80,
        packQuantity: 2000,
        packUnit: U("G"),
        wastagePct: 0,
      },
      cheese: {
        type: "ingredient",
        id: "cheese",
        name: "Cheese",
        packCost: 250,
        packQuantity: 500,
        packUnit: U("G"),
        wastagePct: 0,
      },
    },
    recipes: {
      dough: {
        type: "recipe",
        id: "dough",
        name: "Dough",
        yieldQuantity: 1,
        yieldUnit: U("PCS"),
        processLossPct: 0,
        lines: [{ type: "ingredient", refId: "flour", quantity: 200, unit: U("G") }],
      },
      pizza: {
        type: "recipe",
        id: "pizza",
        name: "Pizza",
        yieldQuantity: 1,
        yieldUnit: U("PCS"),
        processLossPct: 0,
        lines: [
          { type: "recipe", refId: "dough", quantity: 1, unit: U("PCS") },
          { type: "ingredient", refId: "cheese", quantity: 100, unit: U("G") },
        ],
      },
    },
  };

  it("costs a simple recipe", () => {
    const { cost } = costPerYieldUnit("dough", catalog);
    expect(cost).toBeCloseTo(8); // 200g * (80/2000)
  });

  it("costs a recipe with a sub-recipe", () => {
    const { cost } = costPerYieldUnit("pizza", catalog);
    // dough 8 + cheese 100 * (250/500)=50 => 58
    expect(cost).toBeCloseTo(58);
  });

  it("applies process loss to effective yield", () => {
    const lossy: Catalog = {
      ...catalog,
      recipes: {
        ...catalog.recipes,
        dough: { ...catalog.recipes.dough, processLossPct: 50 },
      },
    };
    const { cost } = costPerYieldUnit("dough", lossy);
    expect(cost).toBeCloseTo(16); // 8 / (1 - 0.5)
  });

  it("costs a portion using yield-unit cost", () => {
    const cost = costForPortion("pizza", 2, U("PCS"), catalog);
    expect(cost).toBeCloseTo(116); // 58 * 2
  });
});
