"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RestaurantNavProps = {
    restaurantId: string;
};

export function RestaurantNav({ restaurantId }: RestaurantNavProps) {
    const pathname = usePathname();
    const id = restaurantId || "";
    const base = `/dashboard`;

    const links = [
        { href: `${base}/ingredients?restaurantId=${id}`, label: "Ingredients", key: "ingredients" },
        { href: `${base}/recipes?restaurantId=${id}`, label: "Recipes", key: "recipes" },
        { href: `${base}/menu?restaurantId=${id}`, label: "Calculations", key: "menu" },
    ];

    return (
        <nav className="flex items-center gap-2">
            {links.map((l) => {
                const isActive = pathname?.includes(l.key);
                return (
                    <Button
                        key={l.key}
                        variant={isActive ? "default" : "outline"}
                        asChild
                        className={cn(isActive && "bg-primary text-primary-foreground")}
                    >
                        <Link href={l.href}>{l.label}</Link>
                    </Button>
                );
            })}
        </nav>
    );
}



