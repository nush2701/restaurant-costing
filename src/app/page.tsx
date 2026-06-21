import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Carrot, ChefHat, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Carrot,
    title: "Ingredients",
    body: "Track pack sizes, costs, and wastage so every unit price stays accurate.",
  },
  {
    icon: ChefHat,
    title: "Recipes",
    body: "Build recipes from ingredients and sub-recipes with instant, recursive costing.",
  },
  {
    icon: Calculator,
    title: "Menu costing",
    body: "Cost any menu item, including extras and portions, in real time.",
  },
  {
    icon: TrendingUp,
    title: "Profit margins",
    body: "See cost, margin, and margin % for every dish at a glance.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 space-y-16">
      <section className="text-center space-y-6">
        <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          Restaurant costing, simplified
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          Know the true cost of <span className="text-primary">every dish</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          CostYou turns your ingredients and recipes into precise per-item costs and
          profit margins — so you can price your menu with confidence.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button size="lg" asChild>
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="transition-colors hover:border-primary/40">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <CardTitle>{title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
