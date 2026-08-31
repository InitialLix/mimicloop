import type { CollocationData } from "./content-types";

const placeholderPattern = /\{([a-z][a-z0-9_]*)\}/g;

const normalizeExpression = (value: string) => value
  .replace(/\s+([,.;:!?])/g, "$1")
  .replace(/\s+/g, " ")
  .trim();

const sameExpression = (left: string, right: string) =>
  normalizeExpression(left).toLocaleLowerCase("en") === normalizeExpression(right).toLocaleLowerCase("en");

const offersUsefulVariation = (collocation: CollocationData) => {
  if (!collocation.pattern || collocation.slots.length === 0) return false;
  if (collocation.expression_type === "fixed_phrase") return false;
  if (collocation.canonical_text === "present a challenge") return false;

  const canonical = normalizeExpression(collocation.canonical_text);
  const pattern = normalizeExpression(collocation.pattern);
  if (!pattern.toLocaleLowerCase("en").startsWith(canonical.toLocaleLowerCase("en"))) return true;

  const suffix = pattern.slice(canonical.length).trimStart();
  return suffix.startsWith("{");
};

export function buildCollocationVariations(collocation: CollocationData, limit = 3) {
  if (!offersUsefulVariation(collocation)) return [];

  const slotMap = new Map(collocation.slots.map((slot) => [slot.name, slot.replacement_examples]));
  const exampleCount = Math.max(...collocation.slots.map((slot) => slot.replacement_examples.length));
  const variations: string[] = [];

  for (let index = 0; index < exampleCount && variations.length < limit; index += 1) {
    const expression = normalizeExpression(collocation.pattern!.replace(placeholderPattern, (_, slotName: string) => {
      const replacements = slotMap.get(slotName);
      return replacements?.[index % replacements.length] ?? `{${slotName}}`;
    }));
    if (expression.includes("{") || sameExpression(expression, collocation.canonical_text)) continue;
    if (variations.some((item) => sameExpression(item, expression))) continue;
    variations.push(expression);
  }

  return variations.length >= 2 ? variations : [];
}
