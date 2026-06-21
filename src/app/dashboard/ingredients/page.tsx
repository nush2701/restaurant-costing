"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RestaurantNav } from "@/components/restaurant-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const UNITS = ["G", "KG", "ML", "L", "PCS", "TBSP", "TSP", "CUP"];

type Ingredient = {
    id: string;
    restaurantId: string;
    name: string;
    packQuantity: number;
    packUnit: string;
    packCost: number;
    wastagePct: number;
};

export default function IngredientsPage() {
    const params = useMemo(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''), []);
    const restaurantId = params.get('restaurantId') || '';

    const [items, setItems] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState("");
    const [packQuantity, setPackQuantity] = useState<number>(1000);
    const [packUnit, setPackUnit] = useState("G");
    const [packCost, setPackCost] = useState<number>(100);
    const [wastagePct, setWastagePct] = useState<number>(0);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/ingredients?restaurantId=${restaurantId}`);
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    useEffect(() => {
        if (restaurantId) load();
    }, [restaurantId, load]);

    async function onCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!restaurantId) {
            alert("Missing restaurantId in URL");
            return;
        }
        const res = await fetch("/api/ingredients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ restaurantId, name, packQuantity, packUnit, packCost, wastagePct }),
        });
        if (res.ok) {
            setName("");
            await load();
        } else {
            const j = await res.json().catch(() => ({}));
            alert(j.message || "Failed to create ingredient");
        }
    }

    return (
        <div className="p-6 py-10 space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">Ingredients</h1>
                    <p className="text-sm text-muted-foreground">
                        Pack sizes, costs, and wastage for this restaurant.
                    </p>
                </div>
                <RestaurantNav restaurantId={restaurantId} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Add ingredient</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                        <div className="space-y-1.5 lg:col-span-2">
                            <Label htmlFor="ingName">Name</Label>
                            <Input id="ingName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Flour" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="packQty">Pack qty</Label>
                            <Input id="packQty" type="number" value={packQuantity} onChange={(e) => setPackQuantity(parseFloat(e.target.value))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="packUnit">Unit</Label>
                            <NativeSelect id="packUnit" value={packUnit} onChange={(e) => setPackUnit(e.target.value)}>
                                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="packCost">Pack cost (₹)</Label>
                            <Input id="packCost" type="number" value={packCost} onChange={(e) => setPackCost(parseFloat(e.target.value))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="wastage">Wastage %</Label>
                            <Input id="wastage" type="number" value={wastagePct} onChange={(e) => setWastagePct(parseFloat(e.target.value))} />
                        </div>
                        <Button type="submit" disabled={loading} className="lg:col-span-6 sm:w-auto sm:justify-self-start">
                            {loading ? "Saving…" : "Add ingredient"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>All ingredients ({items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {items.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            No ingredients yet. Add one above.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Pack</TableHead>
                                    <TableHead className="text-right">Cost (₹)</TableHead>
                                    <TableHead className="text-right">Wastage %</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((i) => (
                                    <TableRow key={i.id}>
                                        <TableCell className="font-medium">{i.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{i.packQuantity} {i.packUnit}</TableCell>
                                        <TableCell className="text-right">{i.packCost}</TableCell>
                                        <TableCell className="text-right">{i.wastagePct}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}





