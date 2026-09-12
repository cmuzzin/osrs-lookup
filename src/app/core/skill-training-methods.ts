// XP-rate training methods per skill, for the XP calculator. Sourced from the
// OSRS Wiki's own training-method articles (e.g. "Woodcutting training"),
// keyed by the same skill keys as SKILL_ORDER. Rates are approximate — real
// wiki articles themselves usually only cite a single representative "at a
// skilled, well-geared level" figure rather than a full per-level curve, and
// that's what's stored here too.
//
// Not every skill has an entry yet — this is being filled in incrementally.
// A skill with no entry here just shows as "not available yet" in the
// calculator rather than an empty table.

export interface TrainingMethod {
  name: string;
  /** Minimum level to use this method at all. */
  levelReq: number;
  /** Approximate XP/hour a skilled player can expect — not a strict per-level curve. */
  xpPerHour: number;
}

export const SKILL_TRAINING_METHODS: Partial<Record<string, TrainingMethod[]>> = {
  woodcutting: [
    { name: 'Regular trees', levelReq: 1, xpPerHour: 15_000 },
    { name: 'Oak trees', levelReq: 15, xpPerHour: 40_000 },
    { name: 'Willow trees', levelReq: 30, xpPerHour: 74_000 },
    { name: 'Teak trees', levelReq: 35, xpPerHour: 60_000 },
    { name: 'Maple trees', levelReq: 45, xpPerHour: 50_000 },
    { name: 'Yew trees', levelReq: 60, xpPerHour: 47_000 },
    { name: 'Blisterwood trees', levelReq: 62, xpPerHour: 70_000 },
    { name: 'Sulliuscep', levelReq: 65, xpPerHour: 90_000 },
    { name: 'Magic trees', levelReq: 75, xpPerHour: 27_500 },
    { name: 'Bloodwood trees', levelReq: 77, xpPerHour: 150_000 },
    { name: 'Ironwood trees', levelReq: 80, xpPerHour: 90_000 },
    { name: 'Redwood trees', levelReq: 90, xpPerHour: 65_000 },
    { name: 'Rosewood trees', levelReq: 92, xpPerHour: 87_000 },
  ],
  magic: [
    { name: "Lvl-1 Enchant", levelReq: 7, xpPerHour: 32_000 },
    { name: 'Low Level Alchemy', levelReq: 21, xpPerHour: 60_000 },
    { name: 'Superheat Item', levelReq: 43, xpPerHour: 97_000 },
    { name: 'Camelot Teleport', levelReq: 45, xpPerHour: 80_000 },
    { name: 'High Level Alchemy', levelReq: 55, xpPerHour: 78_000 },
    { name: 'Bake Pie (passive)', levelReq: 65, xpPerHour: 113_000 },
    { name: 'Ice Burst (Maniacal Monkeys)', levelReq: 70, xpPerHour: 310_000 },
    { name: 'Cure Me (Lunar, passive)', levelReq: 71, xpPerHour: 414_000 },
    { name: 'String Jewellery (Lunar)', levelReq: 80, xpPerHour: 150_000 },
    { name: 'Potion Share (Lunar)', levelReq: 81, xpPerHour: 140_000 },
    { name: 'Magic Imbue (passive)', levelReq: 82, xpPerHour: 22_000 },
    { name: 'Plank Make (Lunar)', levelReq: 86, xpPerHour: 166_000 },
    { name: 'Ice Barrage (Maniacal Monkeys)', levelReq: 94, xpPerHour: 400_000 },
  ],
};
