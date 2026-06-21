import MenuCalcClient from "./MenuCalcClient";

export default async function MenuCalcPage({
  searchParams,
}: {
  searchParams: Promise<{ restaurantId?: string }>;
}) {
  const { restaurantId } = await searchParams;
  return <MenuCalcClient restaurantId={restaurantId ?? ""} />;
}

