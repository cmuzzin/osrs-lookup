// XP-rate training methods per skill, for the XP calculator. Keyed by the same
// skill keys as SKILL_ORDER. Rates are approximate, from two real sources:
//
// - Woodcutting, Fletching: hand-picked from the OSRS Wiki's own
//   training-method articles (e.g. "Woodcutting training"), favoring the
//   classic named methods a typical player would recognize.
// - Everything else: converted from Wise Old Man's own EHP (efficient hours
//   played) rate config — the same project this app's WOM integration already
//   depends on — which tracks the best-known method at each XP milestone per
//   skill. Entries carrying "(efficient)" are the highest-throughput, often
//   click-intensive methods from that source (tick-manipulation, etc.),
//   included alongside the more casual named methods where both are available.
//
// Combat skills (Attack, Strength, Defence, Ranged) and Hitpoints have no
// entries here on purpose, and the calculator's skill picker leaves them out
// entirely — combat XP comes from whatever you're fighting and is usually
// trained together across several of them at once, so a dedicated "best
// method for just Attack" table isn't a meaningful comparison the way it is
// for a skilling skill. Magic and Prayer stay in: Magic has real standalone
// training spells (alching, enchanting, the Lunar spellbook's utility spells)
// independent of combat, and altars/bones are a real, distinct choice
// independent of what you're fighting.
//
// Not every remaining skill's list is equally deep — a few (e.g. Smithing
// before Giants' Foundry was added) converge on very few methods because one
// dominates almost the entire level range in WOM's own efficiency model, not
// because data is missing.
//
// The EHP source only tracks the single most efficient method per bracket, so
// well-known but merely "good" skilling minigames/bosses it doesn't rank as
// optimal were missing until added back in by hand from the wiki: Wintertodt,
// Tempoross, Volcanic Mine, Blast Mine, Pest Control, Mahogany Homes, Pyramid
// Plunder, Golem crafting, Giants' Foundry, Fishing Trawler, Brimhaven
// Agility Arena, Forestry events (added as separate "with Forestry events"
// rows on top of teaks/yews, the only two points the wiki gives a concrete
// boosted rate for — it isn't reducible to a single log-in-hand method the
// way group content generally isn't), and Vale Totems (Fletching's Varlamore
// minigame — "full loop of 8 totems" rates per wood tier, each a midpoint of
// the wiki's stated range).
//
// A second audit pass (prompted by "what else am I missing?") added more
// per-skill training-page methods the EHP-config-first approach never
// surfaces, since EHP only tracks the single fastest bracket and skips
// anything merely "good": the Gilded Altar (Prayer's non-Wilderness
// alternative to the chaos altar), jugs of wine and cooking-gauntlets fish
// (Cooking), barbarian fishing/2t swordfish & tuna/monkfish/infernal
// eel/leechfin fishing/Minnows (Fishing), spinning flax and glassblowing
// (Crafting), iron ore and amethyst (Mining), the Ape Atoll/Werewolf/Colossal
// Wyrm/Prifddinas agility courses, the Ourania Altar (Runecraft), Herbiboar
// and black chinchompas (Hunter), and Aldarin villa chests/Rogues' Castle
// chests/pickpocketing elves & TzHaar-Hur (Thieving). Broad arrows/bolts
// (Fletching) were checked and deliberately left out — the only XP/hour
// figure found for them didn't hold up against known per-arrow XP, so it
// would've been a guess rather than a sourced fact.
//
// A third pass (prompted specifically about Smithing) added Blast Furnace
// for every bar type, not just gold (iron/steel/mithril/adamantite/runite),
// steel cannonballs (standard and double-ammo-mould), dart tips/nails made
// at the Blast Furnace with the Foreman uniform's XP boost, and manual anvil
// armour smithing (steel/mithril/adamant platebodies) — all real, named
// methods the Giants' Foundry-and-gold-bars-only list was missing. If
// another obvious one is still missing, that's why — it's worth flagging so
// it can be added the same way.
//
// A fourth pass added methods from each skill's wiki training page (Tithe Farm,
// Guardians of the Rift and other Runecrafting, the full Hunter creature list,
// rooftop agility courses, more Thieving/Mining/Sailing/Construction/Fishing
// methods) and replaced bare "Quests"/"Tree runs" names with what they involve.
// Where the wiki gives a range, the row uses its midpoint.
//
// A few checked candidates are deliberately left out because no source gives
// a real XP/hour figure for them, so a number here would be a guess rather
// than a sourced fact: Zalcano (scales with
// contribution, no stated rate) and Sorceress's Garden (only
// per-fruit XP, no rate). Barbarian Assault isn't listed anywhere because the
// wiki states it gives no combat XP at all, for any role.
//
// `xpPerAction` and `materials` are filled in only where the wiki gives a
// clean, unambiguous per-item/per-log/per-potion figure and recipe — mostly
// Woodcutting, Fletching, Firemaking, Crafting, and Herblore. Everywhere else
// (minigames, bosses, quests, aggregate "efficient" rotations) those fields
// are left undefined rather than guessed, since there's no single action to
// attach a number to. `tags` are a qualitative, non-sourced read on how each
// method actually feels to play, same as any calculator site's own tagging:
//
// - afk: long idle stretches between required actions/clicks.
// - clicky: tick-manipulation or otherwise input-intensive for max rate.
// - profit: commonly nets GP alongside the XP, not just costs it.
// - buyable: the consumed materials are freely buyable off the GE, so GP
//   (not a supply grind) is the real bottleneck.
// - passive: XP that ticks up in the background of doing something else
//   (e.g. a spell cast as a side effect of another activity).

export type MethodTag = 'afk' | 'clicky' | 'profit' | 'buyable' | 'passive';

export interface TrainingMethod {
  name: string;
  /** Minimum level to use this method at all. */
  levelReq: number;
  /** Approximate XP/hour a skilled player can expect — not a strict per-level curve. */
  xpPerHour: number;
  /** XP granted per single action (log burned, item made, potion mixed), where cleanly known. */
  xpPerAction?: number;
  /** Raw materials one action consumes, where cleanly known — e.g. "1 log + 15 feathers". */
  materials?: string;
  /** Qualitative read on how the method plays — see file header. */
  tags?: MethodTag[];
}

export const SKILL_TRAINING_METHODS: Partial<Record<string, TrainingMethod[]>> = {
  prayer: [
    {
      name: 'Dagannoth bones at the chaos altar',
      levelReq: 1,
      xpPerHour: 1_670_000,
      xpPerAction: 125,
      materials: '1 dagannoth bone',
      tags: ['clicky', 'buyable'],
    },
    {
      name: 'Superior dragon bones at the chaos altar',
      levelReq: 70,
      xpPerHour: 2_000_000,
      xpPerAction: 245,
      materials: '1 superior dragon bone',
      tags: ['clicky', 'buyable'],
    },
    {
      name: 'Dragon bones at the gilded altar (no Wilderness risk)',
      levelReq: 1,
      xpPerHour: 643_000,
      materials: '1 dragon bone',
      tags: ['clicky', 'buyable'],
    },
    {
      name: 'Superior dragon bones at the gilded altar (no Wilderness risk)',
      levelReq: 70,
      xpPerHour: 1_340_000,
      xpPerAction: 245,
      materials: '1 superior dragon bone',
      tags: ['clicky', 'buyable'],
    },
  ],
  cooking: [
    {
      name: '1t poison karambwan',
      levelReq: 1,
      xpPerHour: 172_800,
      xpPerAction: 190,
      materials: '1 raw poison karambwan',
      tags: ['clicky', 'buyable', 'profit'],
    },
    {
      name: '1t karambwan',
      levelReq: 30,
      xpPerHour: 519_100,
      xpPerAction: 190,
      materials: '1 raw karambwan',
      tags: ['clicky', 'buyable', 'profit'],
    },
    { name: '1t karambwan', levelReq: 40, xpPerHour: 591_600, xpPerAction: 190, materials: '1 raw karambwan', tags: ['clicky', 'buyable', 'profit'] },
    { name: '1t karambwan', levelReq: 50, xpPerHour: 663_600, xpPerAction: 190, materials: '1 raw karambwan', tags: ['clicky', 'buyable', 'profit'] },
    { name: '1t karambwan', levelReq: 60, xpPerHour: 735_700, xpPerAction: 190, materials: '1 raw karambwan', tags: ['clicky', 'buyable', 'profit'] },
    { name: '1t karambwan', levelReq: 70, xpPerHour: 808_000, xpPerAction: 190, materials: '1 raw karambwan', tags: ['clicky', 'buyable', 'profit'] },
    { name: '1t karambwan', levelReq: 80, xpPerHour: 880_400, xpPerAction: 190, materials: '1 raw karambwan', tags: ['clicky', 'buyable', 'profit'] },
    { name: '1t karambwan', levelReq: 90, xpPerHour: 948_100, xpPerAction: 190, materials: '1 raw karambwan', tags: ['clicky', 'buyable', 'profit'] },
    { name: '1t karambwan', levelReq: 99, xpPerHour: 980_000, xpPerAction: 190, materials: '1 raw karambwan', tags: ['clicky', 'buyable', 'profit'] },
    {
      name: 'Jugs of wine',
      levelReq: 35,
      xpPerHour: 480_000,
      xpPerAction: 200,
      materials: '1 grapes + 1 jug of water',
      tags: ['clicky', 'buyable'],
    },
    {
      name: 'Cooking with gauntlets (tuna)',
      levelReq: 30,
      xpPerHour: 92_500,
      materials: '1 raw tuna + cooking gauntlets',
      tags: ['clicky', 'buyable'],
    },
    {
      name: 'Cooking with gauntlets (anglerfish)',
      levelReq: 84,
      xpPerHour: 317_500,
      materials: '1 raw anglerfish + cooking gauntlets',
      tags: ['clicky', 'buyable', 'profit'],
    },
  ],
  woodcutting: [
    { name: 'Regular trees', levelReq: 1, xpPerHour: 15_000, xpPerAction: 25, materials: '1 log', tags: ['afk'] },
    { name: 'Oak trees', levelReq: 15, xpPerHour: 40_000, xpPerAction: 37.5, materials: '1 oak log', tags: ['afk'] },
    { name: 'Willow trees', levelReq: 30, xpPerHour: 74_000, xpPerAction: 67.5, materials: '1 willow log', tags: ['afk'] },
    { name: 'Teak trees', levelReq: 35, xpPerHour: 60_000, materials: '1 teak log', tags: ['afk', 'profit'] },
    {
      name: 'Teak trees with Forestry events',
      levelReq: 35,
      xpPerHour: 80_000,
      materials: '1 teak log',
      tags: ['afk', 'profit'],
    },
    { name: 'Maple trees', levelReq: 45, xpPerHour: 50_000, xpPerAction: 100, materials: '1 maple log', tags: ['afk'] },
    { name: 'Yew trees', levelReq: 60, xpPerHour: 47_000, xpPerAction: 175, materials: '1 yew log', tags: ['afk', 'profit'] },
    {
      name: 'Yew trees with Forestry events',
      levelReq: 60,
      xpPerHour: 85_000,
      materials: '1 yew log',
      tags: ['afk', 'profit'],
    },
    { name: 'Blisterwood trees', levelReq: 62, xpPerHour: 70_000, xpPerAction: 76, materials: '1 blisterwood log', tags: ['afk'] },
    { name: 'Sulliuscep', levelReq: 65, xpPerHour: 90_000, materials: '1 sulliuscep cap', tags: ['afk', 'profit'] },
    { name: 'Magic trees', levelReq: 75, xpPerHour: 27_500, xpPerAction: 250, materials: '1 magic log', tags: ['afk', 'profit'] },
    { name: 'Bloodwood trees', levelReq: 77, xpPerHour: 150_000, materials: '1 bloodwood log', tags: ['afk', 'profit'] },
    { name: 'Ironwood trees', levelReq: 80, xpPerHour: 90_000, materials: '1 ironwood log', tags: ['afk', 'profit'] },
    { name: 'Redwood trees', levelReq: 90, xpPerHour: 65_000, xpPerAction: 380, materials: '1 redwood log', tags: ['afk', 'profit'] },
    { name: 'Rosewood trees', levelReq: 92, xpPerHour: 87_000, xpPerAction: 212.5, materials: '1 rosewood log', tags: ['afk', 'profit'] },
    { name: 'Quests (Monk\'s Friend, Enlightened Journey, Icthlarin\'s Little Helper) and regular/oak trees (efficient)', levelReq: 1, xpPerHour: 29_000, tags: ['clicky'] },
    { name: '2t oaks (average rate) (efficient)', levelReq: 15, xpPerHour: 56_000, xpPerAction: 37.5, materials: '1 oak log', tags: ['clicky'] },
    { name: '1.5t teaks (efficient)', levelReq: 35, xpPerHour: 93_174, materials: '1 teak log', tags: ['clicky', 'profit'] },
    { name: '1.5t teaks (efficient)', levelReq: 41, xpPerHour: 114_728, materials: '1 teak log', tags: ['clicky', 'profit'] },
    { name: '1.5t teaks (efficient)', levelReq: 51, xpPerHour: 127_339, materials: '1 teak log', tags: ['clicky', 'profit'] },
    { name: '1.5t teaks (efficient)', levelReq: 61, xpPerHour: 172_507, materials: '1 teak log', tags: ['clicky', 'profit'] },
    { name: '1.5t teaks (efficient)', levelReq: 71, xpPerHour: 194_022, materials: '1 teak log', tags: ['clicky', 'profit'] },
    { name: '1.5t teaks (efficient)', levelReq: 80, xpPerHour: 207_636, materials: '1 teak log', tags: ['clicky', 'profit'] },
    { name: '1.5t teaks (efficient)', levelReq: 90, xpPerHour: 221_977, materials: '1 teak log', tags: ['clicky', 'profit'] },
    { name: '1.5t teaks (efficient)', levelReq: 99, xpPerHour: 235_000, materials: '1 teak log', tags: ['clicky', 'profit'] },
  ],
  fletching: [
    { name: 'Arrow shafts', levelReq: 1, xpPerHour: 10_000, materials: '1 log → 15 shafts', tags: ['afk', 'buyable'] },
    {
      name: 'Headless arrows',
      levelReq: 1,
      xpPerHour: 45_000,
      xpPerAction: 1,
      materials: '1 arrow shaft + 1 feather',
      tags: ['clicky', 'buyable'],
    },
    { name: 'Shortbow (u)', levelReq: 5, xpPerHour: 13_500, xpPerAction: 5, materials: '1 log', tags: ['afk', 'buyable'] },
    {
      name: 'Bronze bolts',
      levelReq: 9,
      xpPerHour: 15_000,
      xpPerAction: 0.5,
      materials: '1 unfinished bolt + 1 feather',
      tags: ['clicky', 'buyable'],
    },
    { name: 'Longbow (u)', levelReq: 10, xpPerHour: 27_000, xpPerAction: 10, materials: '1 log', tags: ['afk', 'buyable'] },
    {
      name: 'Bronze arrows',
      levelReq: 15,
      xpPerHour: 58_500,
      xpPerAction: 1.3,
      materials: '1 headless arrow + 1 bronze arrowtip',
      tags: ['clicky', 'buyable'],
    },
    {
      name: 'Steel arrows',
      levelReq: 30,
      xpPerHour: 112_500,
      xpPerAction: 5,
      materials: '1 headless arrow + 1 steel arrowtip',
      tags: ['clicky', 'buyable'],
    },
    { name: 'Battlestaves', levelReq: 40, xpPerHour: 143_000, xpPerAction: 80, materials: '1 celastrus bark', tags: ['buyable', 'profit'] },
    {
      name: 'Vale Totems (Oak)',
      levelReq: 20,
      xpPerHour: 37_568,
      materials: '5 oak logs per totem (full loop of 8 totems)',
      tags: ['clicky', 'buyable'],
    },
    {
      name: 'Vale Totems (Willow)',
      levelReq: 35,
      xpPerHour: 85_983,
      materials: '5 willow logs per totem (full loop of 8 totems)',
      tags: ['clicky', 'buyable'],
    },
    {
      name: 'Vale Totems (Maple)',
      levelReq: 50,
      xpPerHour: 132_941,
      materials: '5 maple logs per totem (full loop of 8 totems)',
      tags: ['clicky', 'buyable'],
    },
    {
      name: 'Vale Totems (Yew)',
      levelReq: 65,
      xpPerHour: 209_023,
      materials: '5 yew logs per totem (full loop of 8 totems)',
      tags: ['clicky', 'buyable'],
    },
    {
      name: 'Vale Totems (Magic)',
      levelReq: 80,
      xpPerHour: 367_610,
      materials: '5 magic logs per totem (full loop of 8 totems)',
      tags: ['clicky', 'buyable'],
    },
    {
      name: 'Vale Totems (Redwood)',
      levelReq: 90,
      xpPerHour: 424_786,
      materials: '5 redwood logs per totem (full loop of 8 totems)',
      tags: ['clicky', 'buyable'],
    },
  ],
  fishing: [
    { name: 'Quests (Sea Slug, Fishing Contest, Fremennik Trials, Tai Bwo Wannai Trio, Freeing Pirate Pete)', levelReq: 1, xpPerHour: 29_200, tags: ['afk'] },
    { name: 'Fishing Trawler', levelReq: 15, xpPerHour: 13_000, tags: ['clicky'] },
    { name: '3t fly fishing', levelReq: 30, xpPerHour: 46_592, materials: '1 feather', tags: ['clicky', 'buyable'] },
    { name: 'Tempoross', levelReq: 35, xpPerHour: 30_000, tags: ['afk', 'profit'] },
    { name: 'Drift net fishing (67.7k hunter & 58k fishing xp/h)', levelReq: 47, xpPerHour: 84_686, tags: ['afk', 'profit'] },
    { name: 'Drift net fishing (84.7k hunter & 67k fishing xp/h)', levelReq: 50, xpPerHour: 97_867, tags: ['afk', 'profit'] },
    { name: 'Drift net fishing (98.7k hunter & 74.9k fishing xp/h)', levelReq: 58, xpPerHour: 112_877, tags: ['afk', 'profit'] },
    { name: 'Drift net fishing (112.8k hunter & 83.3k fishing xp/h)', levelReq: 61, xpPerHour: 128_082, tags: ['afk', 'profit'] },
    { name: 'Drift net fishing (123k hunter & 90.5k fishing xp/h)', levelReq: 67, xpPerHour: 139_313, tags: ['afk', 'profit'] },
    {
      name: 'Drift net fishing (123k hunter & 93.3k fishing xp/h) + 2t swordfish & tuna',
      levelReq: 70,
      xpPerHour: 132_800,
      tags: ['clicky', 'profit'],
    },
    { name: 'Tempoross', levelReq: 70, xpPerHour: 64_000, tags: ['afk', 'profit'] },
    { name: 'Tempoross', levelReq: 80, xpPerHour: 75_000, tags: ['afk', 'profit'] },
    { name: 'Tempoross', levelReq: 90, xpPerHour: 80_000, tags: ['afk', 'profit'] },
    { name: 'Tempoross', levelReq: 99, xpPerHour: 85_000, tags: ['afk', 'profit'] },
    { name: 'Barbarian fishing (3t, AFK)', levelReq: 58, xpPerHour: 37_000, tags: ['afk', 'buyable'] },
    { name: 'Barbarian fishing (3t, cut-eat)', levelReq: 99, xpPerHour: 108_000, tags: ['clicky', 'buyable'] },
    { name: '2t swordfish & tuna', levelReq: 71, xpPerHour: 101_800, materials: '1 swordfish or tuna', tags: ['clicky', 'buyable'] },
    { name: '2t swordfish & tuna', levelReq: 99, xpPerHour: 132_800, materials: '1 swordfish or tuna', tags: ['clicky', 'buyable'] },
    { name: 'Monkfish', levelReq: 62, xpPerHour: 35_800, materials: '1 monkfish', tags: ['afk', 'buyable'] },
    { name: 'Monkfish', levelReq: 99, xpPerHour: 42_000, materials: '1 monkfish', tags: ['afk', 'buyable'] },
    { name: 'Infernal eel', levelReq: 80, xpPerHour: 29_700, materials: '1 infernal eel', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Infernal eel', levelReq: 99, xpPerHour: 34_000, materials: '1 infernal eel', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Leechfin fishing', levelReq: 78, xpPerHour: 109_000, tags: ['clicky', 'buyable'] },
    { name: 'Leechfin fishing', levelReq: 99, xpPerHour: 130_000, tags: ['clicky', 'buyable'] },
    { name: 'Minnows (Molch Isle)', levelReq: 82, xpPerHour: 40_000, tags: ['clicky', 'profit'] },
    { name: 'Minnows (Molch Isle)', levelReq: 99, xpPerHour: 56_000, tags: ['clicky', 'profit'] },
    { name: 'Anglerfish', levelReq: 82, xpPerHour: 15_000, tags: ['afk', 'profit'] },
    { name: 'Anglerfish', levelReq: 90, xpPerHour: 23_000, tags: ['afk', 'profit'] },
    { name: 'Karambwan', levelReq: 99, xpPerHour: 42_000, tags: ['afk', 'profit'] },
    { name: 'Aerial fishing', levelReq: 99, xpPerHour: 93_890, tags: ['afk', 'profit'] },
  ],
  firemaking: [
    { name: 'Colored logs', levelReq: 1, xpPerHour: 73_700, xpPerAction: 40, materials: '1 log', tags: ['clicky', 'buyable'] },
    { name: 'Teak logs', levelReq: 35, xpPerHour: 138_900, xpPerAction: 105, materials: '1 teak log', tags: ['clicky', 'buyable'] },
    { name: 'Arctic pine logs', levelReq: 42, xpPerHour: 184_250, xpPerAction: 125, materials: '1 arctic pine log', tags: ['clicky', 'buyable'] },
    { name: 'Maple logs', levelReq: 45, xpPerHour: 198_990, xpPerAction: 135, materials: '1 maple log', tags: ['clicky', 'buyable'] },
    { name: 'Wintertodt', levelReq: 50, xpPerHour: 161_000, tags: ['afk', 'profit'] },
    { name: 'Wintertodt', levelReq: 90, xpPerHour: 290_000, tags: ['afk', 'profit'] },
    { name: 'Artefacts with firemaking (160.5k thieving & 135.9k firemaking xp/h)', levelReq: 50, xpPerHour: 403_745, tags: ['clicky', 'profit'] },
    { name: 'Artefacts with firemaking (191k thieving & 174.7k firemaking xp/h)', levelReq: 60, xpPerHour: 551_169, tags: ['clicky', 'profit'] },
    {
      name: 'Artefacts with firemaking (220.6k thieving & 262.1k firemaking xp/h)',
      levelReq: 75,
      xpPerHour: 775_388,
      tags: ['clicky', 'profit'],
    },
    { name: 'Artefacts with firemaking (242.2k thieving & 302k firemaking xp/h)', levelReq: 90, xpPerHour: 872_198, tags: ['clicky', 'profit'] },
  ],
  crafting: [
    { name: 'Leather items', levelReq: 1, xpPerHour: 37_000, materials: '1 leather', tags: ['afk', 'buyable'] },
    { name: 'Sapphires', levelReq: 20, xpPerHour: 139_000, xpPerAction: 50, materials: '1 uncut sapphire + chisel', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Emeralds', levelReq: 27, xpPerHour: 187_650, xpPerAction: 67.5, materials: '1 uncut emerald + chisel', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Rubies', levelReq: 34, xpPerHour: 236_300, xpPerAction: 85, materials: '1 uncut ruby + chisel', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Diamonds', levelReq: 43, xpPerHour: 298_850, xpPerAction: 107.5, materials: '1 uncut diamond + chisel', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Golem crafting', levelReq: 60, xpPerHour: 150_000, tags: ['afk'] },
    { name: "Green d'hide bodies", levelReq: 63, xpPerHour: 335_230, xpPerAction: 186, materials: '1 green dragonhide + needle & thread', tags: ['clicky', 'buyable'] },
    { name: "Blue d'hide bodies", levelReq: 71, xpPerHour: 378_490, xpPerAction: 210, materials: '1 blue dragonhide + needle & thread', tags: ['clicky', 'buyable'] },
    { name: "Red d'hide bodies", levelReq: 77, xpPerHour: 421_740, xpPerAction: 234, materials: '1 red dragonhide + needle & thread', tags: ['clicky', 'buyable'] },
    { name: "Black d'hide bodies", levelReq: 84, xpPerHour: 465_000, xpPerAction: 258, materials: '1 black dragonhide + needle & thread', tags: ['clicky', 'buyable'] },
    {
      name: 'Spinning flax into bow strings',
      levelReq: 10,
      xpPerHour: 22_000,
      xpPerAction: 15,
      materials: '1 flax',
      tags: ['afk', 'buyable', 'profit'],
    },
    {
      name: 'Glassblowing (beer glasses)',
      levelReq: 1,
      xpPerHour: 30_625,
      xpPerAction: 17.5,
      materials: '1 molten glass',
      tags: ['clicky', 'buyable'],
    },
    {
      name: 'Glassblowing (unpowered orbs)',
      levelReq: 46,
      xpPerHour: 91_875,
      xpPerAction: 52.5,
      materials: '1 molten glass',
      tags: ['clicky', 'buyable', 'profit'],
    },
    {
      name: 'Glassblowing (empty light orbs)',
      levelReq: 87,
      xpPerHour: 122_500,
      xpPerAction: 70,
      materials: '1 molten glass',
      tags: ['clicky', 'buyable'],
    },
  ],
  smithing: [
    { name: 'Quests (The Knight\'s Sword, Sleeping Giants, Elemental Workshop I & II, The Giant Dwarf, Heroes\' Quest, Freeing Pirate Pete)', levelReq: 1, xpPerHour: 46_500, tags: ['afk'] },
    { name: "Giants' Foundry (bronze)", levelReq: 30, xpPerHour: 48_000, tags: ['clicky', 'profit'] },
    { name: "Giants' Foundry (iron-steel)", levelReq: 30, xpPerHour: 85_000, tags: ['clicky', 'profit'] },
    { name: 'Dolo Blast Furnace gold', levelReq: 40, xpPerHour: 475_000, materials: '1 gold ore', tags: ['clicky', 'buyable', 'profit'] },
    { name: "Giants' Foundry (mithril-adamant)", levelReq: 50, xpPerHour: 135_000, tags: ['clicky', 'profit'] },
    { name: "Giants' Foundry (adamant-rune)", levelReq: 85, xpPerHour: 195_000, tags: ['clicky', 'profit'] },
    { name: "Giants' Foundry (rune)", levelReq: 85, xpPerHour: 276_000, tags: ['clicky', 'profit'] },
    { name: 'Dolo Blast Furnace gold', levelReq: 99, xpPerHour: 505_000, materials: '1 gold ore', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Blast Furnace (iron bars)', levelReq: 15, xpPerHour: 75_000, materials: '1 iron ore', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Blast Furnace (steel bars)', levelReq: 30, xpPerHour: 94_500, materials: '1 iron ore + coal', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Blast Furnace (mithril bars)', levelReq: 50, xpPerHour: 108_000, materials: '1 mithril ore + coal', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Blast Furnace (adamantite bars)', levelReq: 70, xpPerHour: 101_250, materials: '1 adamantite ore + coal', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Blast Furnace (runite bars)', levelReq: 85, xpPerHour: 107_500, materials: '1 runite ore + coal', tags: ['clicky', 'buyable', 'profit'] },
    {
      name: 'Steel cannonballs',
      levelReq: 35,
      xpPerHour: 13_824,
      xpPerAction: 2.5,
      materials: '1 steel bar → 4 cannonballs',
      tags: ['clicky', 'buyable', 'profit'],
    },
    {
      name: 'Steel cannonballs (double ammo mould)',
      levelReq: 35,
      xpPerHour: 27_648,
      materials: '2 steel bars → 8 cannonballs',
      tags: ['clicky', 'buyable', 'profit'],
    },
    {
      name: 'Bronze dart tips at the Blast Furnace (Foreman uniform)',
      levelReq: 4,
      xpPerHour: 16_250,
      materials: '1 bronze bar → 10 dart tips',
      tags: ['clicky', 'buyable'],
    },
    {
      name: 'Steel dart tips at the Blast Furnace (Foreman uniform)',
      levelReq: 34,
      xpPerHour: 48_750,
      materials: '1 steel bar → 10 dart tips',
      tags: ['clicky', 'buyable'],
    },
    {
      name: 'Rune nails at the Blast Furnace (Foreman uniform)',
      levelReq: 89,
      xpPerHour: 97_500,
      materials: '1 runite bar → 15 nails',
      tags: ['clicky', 'buyable'],
    },
    { name: 'Steel platebodies (anvil)', levelReq: 48, xpPerHour: 144_000, materials: '5 steel bars', tags: ['clicky', 'buyable'] },
    { name: 'Mithril platebodies (anvil)', levelReq: 68, xpPerHour: 200_000, materials: '5 mithril bars', tags: ['clicky', 'buyable'] },
    { name: 'Adamant platebodies (anvil)', levelReq: 88, xpPerHour: 275_000, materials: '5 adamantite bars', tags: ['clicky', 'buyable'] },
  ],
  mining: [
    { name: 'Quests (Doric\'s Quest, The Dig Site, Plague City, The Giant Dwarf, The Lost Tribe, Another Slice of H.A.M.)', levelReq: 1, xpPerHour: 20_000, tags: ['afk'] },
    {
      name: 'Motherlode Mine for the prospector kit and Shooting Stars for the celestial ring',
      levelReq: 39,
      xpPerHour: 50_600,
      tags: ['afk', 'profit'],
    },
    { name: 'Volcanic Mine', levelReq: 50, xpPerHour: 87_000, tags: ['clicky', 'profit'] },
    { name: 'Blast Mine', levelReq: 75, xpPerHour: 94_000, tags: ['clicky', 'profit'] },
    { name: '3t granite', levelReq: 63, xpPerHour: 106_540, materials: '1 granite (500g)', tags: ['clicky'] },
    { name: '3t granite', levelReq: 75, xpPerHour: 112_166, materials: '1 granite (500g)', tags: ['clicky'] },
    { name: '3t granite', levelReq: 85, xpPerHour: 116_760, materials: '1 granite (500g)', tags: ['clicky'] },
    { name: '3t granite', levelReq: 95, xpPerHour: 119_438, materials: '1 granite (500g)', tags: ['clicky'] },
    { name: '3t granite', levelReq: 99, xpPerHour: 126_000, materials: '1 granite (500g)', tags: ['clicky'] },
    { name: 'Iron ore', levelReq: 15, xpPerHour: 50_000, materials: '1 iron ore', tags: ['clicky', 'profit'] },
    { name: 'Iron ore', levelReq: 60, xpPerHour: 75_000, materials: '1 iron ore', tags: ['clicky', 'profit'] },
    { name: 'Amethyst', levelReq: 92, xpPerHour: 22_500, materials: '1 amethyst', tags: ['afk', 'profit'] },
    { name: 'Gem rocks', levelReq: 40, xpPerHour: 60_500, tags: ['clicky', 'profit'] },
    { name: 'Gem rocks (3-tick)', levelReq: 50, xpPerHour: 101_500, tags: ['clicky', 'profit'] },
    { name: 'Calcified rocks', levelReq: 41, xpPerHour: 36_000, tags: ['clicky', 'profit'] },
    { name: 'Rubium rocks', levelReq: 48, xpPerHour: 39_000, tags: ['afk', 'profit'] },
    { name: 'Rubium rocks', levelReq: 99, xpPerHour: 64_000, tags: ['afk', 'profit'] },
    { name: 'Crashed stars', levelReq: 60, xpPerHour: 27_500, tags: ['afk', 'profit'] },
    { name: 'Infernal shale (tick manipulation)', levelReq: 78, xpPerHour: 73_500, tags: ['clicky', 'profit'] },
  ],
  herblore: [
    { name: 'Quests (Druidic Ritual, Jungle Potion, Recruitment Drive, The Dig Site)', levelReq: 1, xpPerHour: 11_100, tags: ['afk'] },
    { name: "Serum 207's", levelReq: 25, xpPerHour: 218_750, xpPerAction: 50, materials: 'Tarromin potion (unf) + ashes', tags: ['clicky', 'buyable'] },
    { name: 'Super energies', levelReq: 52, xpPerHour: 293_750, xpPerAction: 117.5, materials: 'Avantoe potion (unf) + mort myre fungus', tags: ['clicky', 'buyable'] },
    { name: 'Super strengths', levelReq: 55, xpPerHour: 312_500, xpPerAction: 125, materials: 'Kwuarm potion (unf) + limpwurt root', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Super restores', levelReq: 63, xpPerHour: 356_250, xpPerAction: 142.5, materials: "Snapdragon potion (unf) + red spiders' eggs", tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Super defences', levelReq: 66, xpPerHour: 375_000, xpPerAction: 150, materials: 'Cadantine potion (unf) + white berries', tags: ['clicky', 'buyable'] },
    { name: 'Antifire potions', levelReq: 69, xpPerHour: 393_750, xpPerAction: 157.5, materials: 'Lantadyme potion (unf) + dragon scale dust', tags: ['clicky', 'buyable'] },
    { name: 'Ranging potions', levelReq: 72, xpPerHour: 406_250, xpPerAction: 162.5, materials: 'Dwarf weed potion (unf) + wine of Zamorak', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Magic potions', levelReq: 76, xpPerHour: 431_250, xpPerAction: 172.5, materials: 'Lantadyme potion (unf) + potato cactus', tags: ['clicky', 'buyable'] },
    { name: '1t stamina potions', levelReq: 77, xpPerHour: 535_500, xpPerAction: 102, materials: 'Super energy(4) + amylase crystal', tags: ['clicky', 'buyable', 'profit'] },
    { name: '1t extended antifires', levelReq: 84, xpPerHour: 577_500, xpPerAction: 110, materials: 'Antifire potion(4) + lava scale shard', tags: ['clicky', 'buyable'] },
    { name: '1t anti-venoms', levelReq: 87, xpPerHour: 630_000, xpPerAction: 120, materials: "Antidote++(4) + Zulrah's scales", tags: ['clicky', 'buyable', 'profit'] },
    { name: '1t extended super antifires', levelReq: 98, xpPerHour: 840_000, xpPerAction: 160, materials: 'Super antifire potion(4) + lava scale shard', tags: ['clicky', 'buyable'] },
    { name: 'Mastering Mixology', levelReq: 60, xpPerHour: 105_000, tags: ['clicky', 'profit'] },
  ],
  agility: [
    { name: 'Quests (The Tourist Trap, Recruitment Drive, The Depths of Despair, The Grand Tree)', levelReq: 1, xpPerHour: 15_100, tags: ['afk'] },
    { name: 'Brimhaven Agility Arena', levelReq: 40, xpPerHour: 30_000, tags: ['clicky', 'profit'] },
    { name: 'Wilderness Agility Course', levelReq: 47, xpPerHour: 35_000, tags: ['clicky'] },
    { name: 'Hallowed Sepulchre', levelReq: 52, xpPerHour: 45_000, tags: ['clicky', 'profit'] },
    { name: 'Brimhaven Agility Arena', levelReq: 80, xpPerHour: 37_000, tags: ['clicky', 'profit'] },
    { name: 'Hallowed Sepulchre', levelReq: 62, xpPerHour: 56_300, tags: ['clicky', 'profit'] },
    { name: 'Hallowed Sepulchre', levelReq: 72, xpPerHour: 68_900, tags: ['clicky', 'profit'] },
    { name: 'Hallowed Sepulchre', levelReq: 82, xpPerHour: 79_700, tags: ['clicky', 'profit'] },
    { name: 'Hallowed Sepulchre with ancient & forgotten brews', levelReq: 92, xpPerHour: 102_000, tags: ['clicky', 'profit'] },
    { name: 'Brimhaven Agility Arena (floor spikes)', levelReq: 99, xpPerHour: 68_000, tags: ['clicky', 'profit'] },
    { name: 'Ape Atoll Agility Course', levelReq: 48, xpPerHour: 32_500, tags: ['clicky', 'profit'] },
    { name: 'Ape Atoll Agility Course', levelReq: 75, xpPerHour: 55_000, tags: ['clicky', 'profit'] },
    { name: 'Colossal Wyrm Agility Course (basic)', levelReq: 50, xpPerHour: 31_000, tags: ['clicky', 'profit'] },
    { name: 'Colossal Wyrm Agility Course (advanced)', levelReq: 62, xpPerHour: 42_000, tags: ['clicky', 'profit'] },
    { name: 'Werewolf Agility Course', levelReq: 60, xpPerHour: 52_500, tags: ['clicky', 'profit'] },
    { name: 'Werewolf Agility Course', levelReq: 80, xpPerHour: 67_500, tags: ['clicky', 'profit'] },
    { name: 'Prifddinas Agility Course', levelReq: 75, xpPerHour: 60_000, tags: ['clicky', 'profit'] },
    { name: 'Prifddinas Agility Course', levelReq: 90, xpPerHour: 65_000, tags: ['clicky', 'profit'] },
    { name: 'Draynor Village Rooftop Course', levelReq: 10, xpPerHour: 9_500, tags: ['clicky', 'profit'] },
    { name: 'Al Kharid Rooftop Course', levelReq: 20, xpPerHour: 11_500, tags: ['clicky', 'profit'] },
    { name: 'Varrock Rooftop Course', levelReq: 30, xpPerHour: 12_500, tags: ['clicky', 'profit'] },
    { name: 'Canifis Rooftop Course', levelReq: 40, xpPerHour: 15_500, tags: ['clicky', 'profit'] },
    { name: 'Falador Rooftop Course', levelReq: 50, xpPerHour: 31_500, tags: ['clicky', 'profit'] },
    { name: 'Seers\' Village Rooftop Course', levelReq: 60, xpPerHour: 48_000, tags: ['clicky', 'profit'] },
    { name: 'Pollnivneach Rooftop Course', levelReq: 70, xpPerHour: 52_500, tags: ['clicky', 'profit'] },
    { name: 'Rellekka Rooftop Course', levelReq: 80, xpPerHour: 56_500, tags: ['clicky', 'profit'] },
    { name: 'Ardougne Rooftop Course', levelReq: 90, xpPerHour: 68_000, tags: ['clicky', 'profit'] },
  ],
  thieving: [
    { name: 'Quests (Biohazard, Hazeel Cult, Fight Arena, Tower of Life, Tribal Totem) and Hosidius fruit stalls', levelReq: 1, xpPerHour: 15_000, tags: ['clicky', 'profit'] },
    { name: 'Blackjacking', levelReq: 45, xpPerHour: 80_000, tags: ['clicky', 'profit'] },
    { name: 'Artefacts with firemaking (160.5k thieving & 135.9k firemaking xp/h)', levelReq: 49, xpPerHour: 241_906, tags: ['clicky', 'profit'] },
    { name: 'Pyramid Plunder', levelReq: 71, xpPerHour: 120_000, tags: ['clicky', 'profit'] },
    { name: 'Pyramid Plunder', levelReq: 91, xpPerHour: 275_000, tags: ['clicky', 'profit'] },
    { name: 'Artefacts with firemaking (191k thieving & 174.7k firemaking xp/h)', levelReq: 60, xpPerHour: 279_597, tags: ['clicky', 'profit'] },
    {
      name: 'Artefacts with firemaking (220.6k thieving & 262.1k firemaking xp/h)',
      levelReq: 75,
      xpPerHour: 333_283,
      tags: ['clicky', 'profit'],
    },
    { name: 'Artefacts with firemaking (242.2k thieving & 302k firemaking xp/h)', levelReq: 88, xpPerHour: 370_532, tags: ['clicky', 'profit'] },
    { name: 'Artefacts with ancient brews (255.6k thieving & 250k herblore xp/h)', levelReq: 97, xpPerHour: 363_882, tags: ['clicky', 'profit'] },
    {
      name: 'Artefacts with ancient brews after 200m firemaking (260k thieving & 250k herblore xp/h)',
      levelReq: 99,
      xpPerHour: 370_169,
      tags: ['clicky', 'profit'],
    },
    { name: 'Aldarin villa chests', levelReq: 36, xpPerHour: 60_000, tags: ['clicky', 'profit'] },
    { name: 'Aldarin villa chests', levelReq: 60, xpPerHour: 80_000, tags: ['clicky', 'profit'] },
    { name: 'Pickpocketing elves (Prifddinas)', levelReq: 85, xpPerHour: 150_000, tags: ['clicky', 'profit'] },
    { name: "Rogues' Castle chests", levelReq: 84, xpPerHour: 285_000, tags: ['clicky', 'profit'] },
    { name: 'Pickpocketing TzHaar-Hur', levelReq: 99, xpPerHour: 255_000, tags: ['clicky', 'profit'] },
    { name: 'Bakery stalls (East Ardougne)', levelReq: 5, xpPerHour: 19_200, tags: ['clicky', 'profit'] },
    { name: 'Fruit stalls (Hosidius)', levelReq: 25, xpPerHour: 42_750, tags: ['clicky', 'profit'] },
    { name: 'Wealthy citizens (Varlamore)', levelReq: 50, xpPerHour: 72_000, tags: ['clicky', 'profit'] },
    { name: 'Wealthy citizens (Varlamore)', levelReq: 99, xpPerHour: 105_000, tags: ['clicky', 'profit'] },
    { name: 'Knights of Ardougne', levelReq: 55, xpPerHour: 86_000, tags: ['clicky', 'profit'] },
    { name: 'Knights of Ardougne', levelReq: 99, xpPerHour: 240_000, tags: ['clicky', 'profit'] },
    { name: 'Pickpocketing vyres', levelReq: 82, xpPerHour: 120_000, tags: ['clicky', 'profit'] },
    { name: 'Pickpocketing vyres', levelReq: 99, xpPerHour: 180_000, tags: ['clicky', 'profit'] },
    { name: 'Master Farmers', levelReq: 94, xpPerHour: 117_500, tags: ['clicky', 'profit'] },
  ],
  magic: [
    { name: 'Lvl-1 Enchant', levelReq: 7, xpPerHour: 32_000, xpPerAction: 18, materials: '1 sapphire jewellery + 1 water rune + 1 air rune', tags: ['clicky', 'buyable'] },
    { name: 'Low Level Alchemy', levelReq: 21, xpPerHour: 60_000, xpPerAction: 31, materials: '1 item + 1 fire rune + 3 nature runes', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Superheat Item', levelReq: 43, xpPerHour: 97_000, xpPerAction: 53, materials: 'Ore + 4 fire runes + 1 nature rune', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Camelot Teleport', levelReq: 45, xpPerHour: 80_000, xpPerAction: 55.5, materials: '5 law runes + 1 air rune', tags: ['clicky', 'buyable'] },
    { name: 'High Level Alchemy', levelReq: 55, xpPerHour: 78_000, xpPerAction: 65, materials: '1 item + 5 fire runes + 1 nature rune', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Bake Pie (passive)', levelReq: 65, xpPerHour: 113_000, xpPerAction: 60, materials: 'Cast alongside another activity', tags: ['passive', 'afk'] },
    { name: 'Ice Burst (Maniacal Monkeys)', levelReq: 70, xpPerHour: 310_000, xpPerAction: 34, materials: '2 water runes + 4 chaos runes + 2 death runes', tags: ['clicky', 'buyable'] },
    { name: 'Cure Me (Lunar, passive)', levelReq: 71, xpPerHour: 414_000, xpPerAction: 57, materials: 'Cast alongside another activity', tags: ['passive', 'afk'] },
    { name: 'String Jewellery (Lunar)', levelReq: 80, xpPerHour: 150_000, xpPerAction: 70, materials: '1 unstrung jewellery + runes', tags: ['clicky', 'buyable'] },
    { name: 'Potion Share (Lunar)', levelReq: 81, xpPerHour: 140_000, xpPerAction: 55, materials: 'Cast alongside potion drinking', tags: ['passive'] },
    { name: 'Magic Imbue (passive)', levelReq: 82, xpPerHour: 22_000, xpPerAction: 91, materials: 'Cast alongside runecrafting', tags: ['passive', 'afk'] },
    { name: 'Plank Make (Lunar)', levelReq: 86, xpPerHour: 166_000, xpPerAction: 90, materials: '1 plank + runes', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Ice Barrage (Maniacal Monkeys)', levelReq: 94, xpPerHour: 400_000, xpPerAction: 42.4, materials: '2 water runes + 4 blood runes + 2 death runes', tags: ['clicky', 'buyable'] },
  ],
  farming: [
    { name: 'Quests (Goblin Generals, Fairytale I, Forgettable Tale, Garden of Death, Garden of Tranquillity, Enlightened Journey, My Arm\'s Big Adventure)', levelReq: 1, xpPerHour: 16_000, tags: ['afk'] },
    { name: 'Tree runs (willow, banana, teak)', levelReq: 38, xpPerHour: 304_000, tags: ['afk', 'buyable', 'profit'] },
    { name: 'Tree runs (maple, curry, teak)', levelReq: 45, xpPerHour: 506_000, tags: ['afk', 'buyable', 'profit'] },
    { name: 'Tree runs (maple, pineapple, mahogany)', levelReq: 55, xpPerHour: 719_000, tags: ['afk', 'buyable', 'profit'] },
    { name: 'Tree runs (yew, papaya, mahogany)', levelReq: 60, xpPerHour: 1_083_000, tags: ['afk', 'buyable', 'profit'] },
    { name: 'Tree runs (yew, palm, mahogany)', levelReq: 68, xpPerHour: 1_362_000, tags: ['afk', 'buyable', 'profit'] },
    { name: 'Tree runs (magic, palm, mahogany, calquat, crystal)', levelReq: 75, xpPerHour: 1_896_000, tags: ['afk', 'buyable', 'profit'] },
    { name: 'Tree runs (magic, dragonfruit, mahogany, calquat, crystal)', levelReq: 81, xpPerHour: 2_314_000, tags: ['afk', 'buyable', 'profit'] },
    { name: 'Tree runs (magic, dragonfruit, mahogany, calquat, celastrus, crystal)', levelReq: 85, xpPerHour: 2_475_000, tags: ['afk', 'buyable', 'profit'] },
    { name: 'Tree runs (magic, dragonfruit, mahogany, calquat, celastrus, crystal, redwood)', levelReq: 90, xpPerHour: 2_500_000, tags: ['afk', 'buyable', 'profit'] },
    { name: 'Tithe Farm', levelReq: 74, xpPerHour: 95_000, tags: ['clicky', 'profit'] },
  ],
  runecrafting: [
    { name: 'Quests (Client of Kourend, Enter the Abyss, Temple of the Eye, The Eyes of Glouphrie, The Slug Menace)', levelReq: 1, xpPerHour: 13_600, tags: ['afk'] },
    { name: 'Guardians of the Rift (reward-point rewards)', levelReq: 38, xpPerHour: 45_000, tags: ['clicky', 'profit'] },
    { name: 'Ourania Altar', levelReq: 1, xpPerHour: 20_423, materials: 'Pure essence', tags: ['afk', 'buyable'] },
    { name: 'Ourania Altar', levelReq: 50, xpPerHour: 42_077, materials: 'Pure essence', tags: ['afk', 'buyable'] },
    { name: 'Ourania Altar', levelReq: 90, xpPerHour: 74_716, materials: 'Pure essence', tags: ['afk', 'buyable'] },
    { name: 'Ourania Altar', levelReq: 99, xpPerHour: 77_121, materials: 'Pure essence', tags: ['afk', 'buyable'] },
    { name: 'Solo mud runes', levelReq: 75, xpPerHour: 75_400, materials: 'Pure essence + binding necklace', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Solo mud runes', levelReq: 85, xpPerHour: 106_100, materials: 'Pure essence + binding necklace', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Duo lava runes', levelReq: 99, xpPerHour: 162_000, materials: 'Pure essence + binding necklace', tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Guardians of the Rift', levelReq: 40, xpPerHour: 25_000, tags: ['clicky', 'profit'] },
    { name: 'Guardians of the Rift', levelReq: 50, xpPerHour: 40_000, tags: ['clicky', 'profit'] },
    { name: 'Guardians of the Rift', levelReq: 75, xpPerHour: 50_000, tags: ['clicky', 'profit'] },
    { name: 'Guardians of the Rift', levelReq: 85, xpPerHour: 65_000, tags: ['clicky', 'profit'] },
    { name: 'Guardians of the Rift', levelReq: 99, xpPerHour: 70_000, tags: ['clicky', 'profit'] },
    { name: 'Solo lava runes', levelReq: 23, xpPerHour: 43_200, tags: ['clicky', 'profit'] },
    { name: 'Solo lava runes', levelReq: 50, xpPerHour: 63_500, tags: ['clicky', 'profit'] },
    { name: 'Solo lava runes', levelReq: 75, xpPerHour: 78_800, tags: ['clicky', 'profit'] },
    { name: 'Solo lava runes', levelReq: 85, xpPerHour: 101_400, tags: ['clicky', 'profit'] },
    { name: 'Blood runes (Arceuus)', levelReq: 77, xpPerHour: 36_000, tags: ['clicky', 'profit'] },
    { name: 'Astral runes (double)', levelReq: 82, xpPerHour: 42_000, tags: ['clicky', 'buyable'] },
    { name: 'Astral runes (double)', levelReq: 85, xpPerHour: 53_000, tags: ['clicky', 'buyable'] },
    { name: 'Astral runes (double)', levelReq: 99, xpPerHour: 55_000, tags: ['clicky', 'buyable'] },
    { name: 'Soul runes (Arceuus)', levelReq: 90, xpPerHour: 44_000, tags: ['clicky', 'profit'] },
    { name: 'Aether runes (duo)', levelReq: 90, xpPerHour: 165_000, tags: ['clicky', 'profit'] },
    { name: 'Aether runes (6 runners, max efficiency)', levelReq: 90, xpPerHour: 345_000, tags: ['clicky', 'profit'] },
  ],
  hunter: [
    { name: 'Varrock Museum Natural History Quiz and birdhouses', levelReq: 1, xpPerHour: 30_000, tags: ['afk', 'passive'] },
    { name: 'Oak birdhouses', levelReq: 14, xpPerHour: 83_000, tags: ['afk', 'passive', 'buyable', 'profit'] },
    { name: 'Willow birdhouses', levelReq: 24, xpPerHour: 110_000, tags: ['afk', 'passive', 'buyable', 'profit'] },
    { name: 'Teak birdhouses', levelReq: 34, xpPerHour: 138_000, tags: ['afk', 'passive', 'buyable', 'profit'] },
    { name: 'Drift net fishing (67.7k hunter & 58.0k fishing xp/h)', levelReq: 44, xpPerHour: 215_112, tags: ['afk', 'profit'] },
    { name: 'Drift net fishing (84.7k hunter & 67.0k fishing xp/h)', levelReq: 49, xpPerHour: 268_770, tags: ['afk', 'profit'] },
    { name: 'Drift net fishing (98.7k hunter & 74.9k fishing xp/h)', levelReq: 36, xpPerHour: 293_310, tags: ['afk', 'profit'] },
    { name: 'Drift net fishing (112.8k hunter & 83.3k fishing xp/h)', levelReq: 62, xpPerHour: 322_424, tags: ['afk', 'profit'] },
    { name: 'Drift net fishing (123.0k hunter & 90.5k fishing xp/h)', levelReq: 70, xpPerHour: 350_697, tags: ['afk', 'profit'] },
    { name: 'Herbiboar', levelReq: 80, xpPerHour: 137_000, tags: ['profit'] },
    { name: 'Herbiboar', levelReq: 99, xpPerHour: 171_000, tags: ['profit'] },
    { name: 'Black chinchompas', levelReq: 73, xpPerHour: 145_000, tags: ['clicky', 'profit'] },
    { name: 'Black chinchompas', levelReq: 99, xpPerHour: 225_000, tags: ['clicky', 'profit'] },
    { name: 'Feldip weasels', levelReq: 9, xpPerHour: 13_000, tags: ['clicky'] },
    { name: 'Ruby harvests', levelReq: 15, xpPerHour: 20_000, tags: ['clicky'] },
    { name: 'Red crabs', levelReq: 21, xpPerHour: 31_000, tags: ['clicky'] },
    { name: 'Sapphire glacialis', levelReq: 25, xpPerHour: 28_500, tags: ['clicky'] },
    { name: 'Swamp lizards', levelReq: 29, xpPerHour: 24_000, tags: ['clicky'] },
    { name: 'Embertailed jerboas', levelReq: 39, xpPerHour: 50_000, tags: ['clicky'] },
    { name: 'Falconry (spotted kebbits)', levelReq: 43, xpPerHour: 65_000, tags: ['clicky', 'profit'] },
    { name: 'Orange salamanders', levelReq: 47, xpPerHour: 45_000, tags: ['clicky', 'profit'] },
    { name: 'Razor-backed kebbits', levelReq: 49, xpPerHour: 130_000, tags: ['clicky'] },
    { name: 'Maniacal monkeys', levelReq: 60, xpPerHour: 51_000, tags: ['clicky'] },
    { name: 'Maniacal monkeys', levelReq: 99, xpPerHour: 110_000, tags: ['clicky'] },
    { name: 'Red salamanders', levelReq: 60, xpPerHour: 82_500, tags: ['clicky', 'profit'] },
    { name: 'Black salamanders', levelReq: 67, xpPerHour: 102_500, tags: ['clicky', 'profit'] },
    { name: 'Hunters\' Rumours', levelReq: 72, xpPerHour: 160_000, tags: ['clicky', 'profit'] },
    { name: 'Hunters\' Rumours', levelReq: 91, xpPerHour: 195_000, tags: ['clicky', 'profit'] },
    { name: 'Hunters\' Rumours', levelReq: 99, xpPerHour: 250_000, tags: ['clicky', 'profit'] },
    { name: 'Moonlight moths', levelReq: 75, xpPerHour: 100_000, tags: ['clicky', 'profit'] },
    { name: 'Rainbow crabs', levelReq: 77, xpPerHour: 122_000, tags: ['clicky', 'profit'] },
    { name: 'Carnivorous chinchompas (tick manipulation)', levelReq: 80, xpPerHour: 163_000, tags: ['clicky', 'profit'] },
    { name: 'Carnivorous chinchompas (tick manipulation)', levelReq: 99, xpPerHour: 220_000, tags: ['clicky', 'profit'] },
  ],
  construction: [
    { name: 'Low-level furniture', levelReq: 1, xpPerHour: 54_700, materials: 'Planks + nails', tags: ['clicky', 'buyable'] },
    { name: 'Mahogany Homes (Beginner contracts)', levelReq: 1, xpPerHour: 32_500, tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Mahogany Homes (Novice contracts)', levelReq: 20, xpPerHour: 70_000, tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Oak larders', levelReq: 33, xpPerHour: 450_000, materials: 'Oak planks', tags: ['clicky', 'buyable'] },
    { name: 'Mahogany Homes (Adept contracts)', levelReq: 50, xpPerHour: 140_000, tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Mahogany tables', levelReq: 52, xpPerHour: 950_000, materials: 'Mahogany planks', tags: ['clicky', 'buyable'] },
    { name: 'Mahogany Homes (Expert contracts)', levelReq: 70, xpPerHour: 177_500, tags: ['clicky', 'buyable', 'profit'] },
    { name: 'Mahogany benches', levelReq: 77, xpPerHour: 1_070_000, materials: 'Mahogany planks', tags: ['clicky', 'buyable'] },
    { name: 'Mounted mythical capes', levelReq: 50, xpPerHour: 430_000, tags: ['clicky', 'buyable'] },
    { name: 'Teak garden benches', levelReq: 66, xpPerHour: 700_000, materials: 'Teak planks', tags: ['clicky', 'buyable'] },
    { name: 'Oak dungeon doors', levelReq: 74, xpPerHour: 550_000, materials: 'Oak planks', tags: ['clicky', 'buyable'] },
  ],
  sailing: [
    { name: 'Sea charting & quests', levelReq: 1, xpPerHour: 10_000, tags: ['afk'] },
    { name: 'Barracuda trials (The Tempor Tantrum)', levelReq: 30, xpPerHour: 25_000, tags: ['clicky'] },
    { name: 'Shipwreck salvaging (large wrecks, with boost)', levelReq: 50, xpPerHour: 35_000, tags: ['afk', 'profit'] },
    { name: 'Barracuda Trials (The Jubbly Jive)', levelReq: 55, xpPerHour: 85_000, tags: ['clicky'] },
    { name: 'Barracuda Trials (The Gwenith Glide) - Camphor hull', levelReq: 72, xpPerHour: 205_000, tags: ['clicky'] },
    { name: 'Barracuda Trials (The Gwenith Glide) - Rosewood hull', levelReq: 90, xpPerHour: 240_000, tags: ['clicky'] },
    { name: 'Courier tasks (Summer Shore)', levelReq: 45, xpPerHour: 20_000, tags: ['clicky'] },
    { name: 'Courier tasks (Rellekka)', levelReq: 62, xpPerHour: 82_500, tags: ['clicky'] },
    { name: 'Courier tasks (Prifddinas)', levelReq: 70, xpPerHour: 74_000, tags: ['clicky'] },
    { name: 'Courier tasks (Lunar Isle)', levelReq: 76, xpPerHour: 145_000, tags: ['clicky'] },
    { name: 'Shipwreck salvaging (active)', levelReq: 42, xpPerHour: 97_500, tags: ['clicky', 'profit'] },
    { name: 'Deep sea trawling (cotton nets)', levelReq: 56, xpPerHour: 51_500, tags: ['afk', 'profit'] },
  ],
};
