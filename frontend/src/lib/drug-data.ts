import rawInteractions from "@/data/interactions.json";
import type { DrugInteraction, InteractionCheckResult, InteractionSeverity } from "@/types";

interface RawInteraction {
  drugA: string;
  drugB: string;
  severity: string;
  description: string;
  recommendation: string;
}

const interactions = rawInteractions as RawInteraction[];

function normalise(name: string): string {
  return name.toLowerCase().trim();
}

// Check whether two drug names match a known interaction entry
function matchesPair(entry: RawInteraction, a: string, b: string): boolean {
  const na = normalise(a);
  const nb = normalise(b);
  const ea = normalise(entry.drugA);
  const eb = normalise(entry.drugB);
  return (na.includes(ea) || ea.includes(na)) && (nb.includes(eb) || eb.includes(nb)) ||
         (nb.includes(ea) || ea.includes(nb)) && (na.includes(eb) || eb.includes(na));
}

export function checkPairInteraction(drugA: string, drugB: string): DrugInteraction | null {
  const match = interactions.find((e) => matchesPair(e, drugA, drugB));
  if (!match) return null;
  return {
    drugA: match.drugA,
    drugB: match.drugB,
    severity: match.severity as InteractionSeverity,
    description: match.description,
    recommendation: match.recommendation,
    source: "MediMate curated dataset",
  };
}

export function checkInteractions(drugNames: string[]): InteractionCheckResult {
  const found: DrugInteraction[] = [];

  for (let i = 0; i < drugNames.length; i++) {
    for (let j = i + 1; j < drugNames.length; j++) {
      const result = checkPairInteraction(drugNames[i], drugNames[j]);
      if (result) found.push(result);
    }
  }

  const hasDangerous = found.some(
    (i) => i.severity === "major" || i.severity === "contraindicated"
  );

  return {
    interactions: found,
    hasDangerous,
    checkedAt: new Date().toISOString(),
  };
}

export function searchDrug(query: string): string[] {
  const q = normalise(query);
  const names = new Set<string>();
  for (const entry of interactions) {
    if (normalise(entry.drugA).includes(q)) names.add(entry.drugA);
    if (normalise(entry.drugB).includes(q)) names.add(entry.drugB);
  }
  return Array.from(names);
}
