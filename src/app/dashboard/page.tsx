"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-semibold">Restaurant Dashboard</h1>

            <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2">
                    <Label htmlFor="restaurantName">Restaurant name</Label>
                    <Input
                        id="restaurantName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Demo Restaurant"
                    />
                </div>
                <Button type="submit" disabled={loading}>
                    {loading ? "Loading..." : "Create Restaurant"}
                </Button>
            </form>

            <div>
                <h2 className="text-xl font-medium mb-3">Your Restaurants</h2>
                {restaurants.length === 0 ? (
                    <p className="text-muted-foreground">
                        No restaurants yet. Create one above to get started.
                    </p>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {restaurants.map((r) => (
                            <div key={r.id} className="border rounded p-4 space-y-2 bg-card text-card-foreground">
                                <div className="font-medium">{r.name}</div>
                                <div className="flex gap-3 text-sm">
                                    <a className="text-primary underline" href={`/dashboard/ingredients?restaurantId=${r.id}`}>Ingredients</a>
                                    <a className="text-primary underline" href={`/dashboard/recipes?restaurantId=${r.id}`}>Recipes</a>
                                    <a className="text-primary underline" href={`/dashboard/menu?restaurantId=${r.id}`}>Menu Costing</a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
