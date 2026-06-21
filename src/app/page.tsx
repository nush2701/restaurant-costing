import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <section className="text-center space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">CostYou</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Restaurant costing made simple. Manage ingredients, recipes, and menu item costs with a unified, beautiful UI.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button className="bg-primary text-primary-foreground" asChild>
            <a href="/dashboard">Open Dashboard</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/register">Create account</a>
          </Button>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Track pack sizes, costs, and wastage with precision.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recipes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Build recipes from ingredients and sub-recipes, with instant costing.
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
