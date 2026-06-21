"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RestaurantNav } from "@/components/restaurant-nav";

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
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Ingredients</h1>
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">Restaurant: {restaurantId || 'unknown'}</p>
                <RestaurantNav restaurantId={restaurantId} />
            </div>

            <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div>
                    <label className="block text-sm mb-1">Name</label>
                    <input className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm mb-1">Pack Qty</label>
                    <input type="number" className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground" value={packQuantity} onChange={(e) => setPackQuantity(parseFloat(e.target.value))} />
                </div>
                <div>
                    <label className="block text-sm mb-1">Unit</label>
                    <select className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground" value={packUnit} onChange={(e) => setPackUnit(e.target.value)}>
                        {['G', 'KG', 'ML', 'L', 'PCS', 'TBSP', 'TSP', 'CUP'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm mb-1">Pack Cost</label>
                    <input type="number" className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground" value={packCost} onChange={(e) => setPackCost(parseFloat(e.target.value))} />
                </div>
                <div>
                    <label className="block text-sm mb-1">Wastage %</label>
                    <input type="number" className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground" value={wastagePct} onChange={(e) => setWastagePct(parseFloat(e.target.value))} />
                </div>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded" disabled={loading}>
                    {loading ? "Saving..." : "Add Ingredient"}
                </button>
            </form>

            <div>
                <h2 className="text-xl font-medium mb-3">List</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left border-b">
                                <th className="py-2 pr-4">Name</th>
                                <th className="py-2 pr-4">Pack</th>
                                <th className="py-2 pr-4">Cost</th>
                                <th className="py-2 pr-4">Wastage %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(i => (
                                <tr key={i.id} className="border-b">
                                    <td className="py-2 pr-4">{i.name}</td>
                                    <td className="py-2 pr-4">{i.packQuantity} {i.packUnit}</td>
                                    <td className="py-2 pr-4">{i.packCost}</td>
                                    <td className="py-2 pr-4">{i.wastagePct}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}





