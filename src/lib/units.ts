// lib/units.ts
export type Unit = 'G'|'KG'|'ML'|'L'|'PCS'|'TBSP'|'TSP'|'CUP';

const base: Record<Unit, {kind:'mass'|'volume'|'count', toBase:(n:number)=>number, fromBase:(n:number)=>number}> = {
  G:   {kind:'mass',   toBase:n=>n,       fromBase:n=>n},
  KG:  {kind:'mass',   toBase:n=>n*1000,  fromBase:n=>n/1000},
  ML:  {kind:'volume', toBase:n=>n,       fromBase:n=>n},
  L:   {kind:'volume', toBase:n=>n*1000,  fromBase:n=>n/1000},
  PCS: {kind:'count',  toBase:n=>n,       fromBase:n=>n},
  TBSP:{kind:'volume', toBase:n=>n*15,    fromBase:n=>n/15},
  TSP: {kind:'volume', toBase:n=>n*5,     fromBase:n=>n/5},
  CUP: {kind:'volume', toBase:n=>n*240,   fromBase:n=>n/240},
};

export function convert(q:number, from:Unit, to:Unit) {
  if (from===to) return q;
  const a = base[from], b = base[to];
  if (a.kind!==b.kind) throw new Error(`Incompatible units: ${from} → ${to}`);
  return b.fromBase(a.toBase(q));
}

export function sameKind(a:Unit,b:Unit){ return base[a].kind===base[b].kind; }
