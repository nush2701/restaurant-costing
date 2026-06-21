"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";

type Restaurant = {
    id: string;
    name: string;
};

export default function DashboardPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/restaurants");
            const data = await res.json().catch(() => []);
            setRestaurants(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function onCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!name) {
            alert("Please enter a restaurant name");
            return;
        }
        const res = await fetch("/api/restaurants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        if (res.ok) {
            setName("");
            await load();
        } else {
            const j = await res.json().catch(() => ({}));
            alert(j.message || "Failed to create restaurant");
        }
    }

    return (
        <div className="p-6 py-10 space-y-8 max-w-5xl mx-auto">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Restaurants</h1>
                <p className="text-sm text-muted-foreground">
                    Create a restaurant, then manage its ingredients, recipes, and menu costing.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Add a restaurant</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onCreate} className="flex flex-col sm:flex-row gap-3 sm:items-end">
                        <div className="flex-1 space-y-1.5">
                            <Label htmlFor="restaurantName">Restaurant name</Label>
                            <Input
                                id="restaurantName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Demo Restaurant"
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Loading…" : "Create restaurant"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-3">
                <h2 className="text-lg font-medium">Your restaurants</h2>
                {restaurants.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            No restaurants yet. Create one above to get started.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {restaurants.map((r) => (
                            <Card key={r.id} className="gap-4 transition-colors hover:border-primary/40">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <Store className="size-5" />
                                        </span>
                                        <CardTitle className="truncate">{r.name}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-2">
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={`/dashboard/ingredients?restaurantId=${r.id}`}>Ingredients</Link>
                                    </Button>
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={`/dashboard/recipes?restaurantId=${r.id}`}>Recipes</Link>
                                    </Button>
                                    <Button size="sm" asChild>
                                        <Link href={`/dashboard/menu?restaurantId=${r.id}`}>Menu costing</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
