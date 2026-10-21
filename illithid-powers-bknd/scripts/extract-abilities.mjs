import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(process.argv[2] ?? resolve(here, "../../illithid_powers/src/assets/data.js"));
const out = resolve(here, "../src/db/abilities.seed.json");

let text = readFileSync(src, "utf8").replace(/\r/g, "");
text = text.split("// Helper function")[0]; // drop isUnlockable & co.
text = text
  .split("\n")
  .filter((l) => !/^\s*import\s/.test(l) && !/^\s*imgPath:/.test(l))
  .join("\n")
  .replace("export const mindData", "const mindData");

const mindData = new Function(`${text}\nreturn mindData;`)();

// Same rule the frontend uses to derive a power key from a name.
const toKey = (name) => name.replaceAll(" ", "").replaceAll("'", "");

const entries = Object.entries(mindData.abilities);
const keys = new Set(entries.map(([k]) => k));

const abilities = entries.map(([key, a]) => {
  if (toKey(a.name) !== key) {
    throw new Error(`Key mismatch: object key "${key}" vs name "${a.name}"`);
  }
  const req = a.cntrl.req;
  const requires = req === "Illithid Tadpole" ? [] : req.split(" or ").map((r) => toKey(r.trim()));
  for (const r of requires) {
    if (!keys.has(r)) throw new Error(`${key}: unknown requirement "${r}"`);
  }
  return {
    key,
    name: a.name,
    description: a.desc,
    vialCost: a.cntrl.cost,
    requires,
  };
});

writeFileSync(out, JSON.stringify(abilities, null, 2) + "\n");
console.log(`Wrote ${abilities.length} abilities to ${out}`);
