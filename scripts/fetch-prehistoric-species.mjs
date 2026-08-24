import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const groups = [
  ["Pterosauria", null],
  ["Ichthyosauria", null],
  ["Plesiosauria", null],
  ["Mosasauridae", null],
  ["Crocodylomorpha", null],
  ["Eurypterida", null],
  ["Placodermi", null],
  ["Trilobita", 3000],
  ["Ammonoidea", 3000],
  ["Synapsida", 2500],
];

const endpoint = "https://paleobiodb.org/data1.2/taxa/list.json";
const featuredSpecies = new Set([
  "Dimetrodon grandis",
  "Edaphosaurus pogonias",
  "Lystrosaurus murrayi",
  "Mammuthus primigenius",
  "Smilodon fatalis",
  "Megatherium americanum",
  "Elrathia kingi",
  "Dunkleosteus terrelli",
  "Jaekelopterus rhenaniae",
  "Pteranodon longiceps",
  "Quetzalcoatlus northropi",
  "Ichthyosaurus communis",
  "Plesiosaurus dolichodeirus",
  "Liopleurodon ferox",
  "Mosasaurus hoffmannii",
]);
const output = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src-tauri/data/prehistoric_species.json",
);

const cleanTaxon = (value) =>
  value && !value.startsWith("NO_") ? value : undefined;

const evenlySample = (records, limit) => {
  if (!limit || records.length <= limit) return records;
  return Array.from({ length: limit }, (_, index) =>
    records[Math.floor((index * (records.length - 1)) / (limit - 1))],
  );
};

const speciesByName = new Map();

for (const [group, limit] of groups) {
  const params = new URLSearchParams({
    base_name: group,
    rel: "all_children",
    rank: "species",
    taxon_status: "valid",
    extant: "no",
    show: "class,common",
  });
  const response = await fetch(`${endpoint}?${params}`);
  if (!response.ok) {
    throw new Error(`${group}: PBDB returned HTTP ${response.status}`);
  }

  const payload = await response.json();
  const validRecords = payload.records
    .filter((record) => !record.tdf && !record.flg && record.nam)
    .sort((a, b) => a.nam.localeCompare(b.nam));
  const recordsByName = new Map(
    evenlySample(validRecords, limit).map((record) => [record.nam, record]),
  );
  for (const record of validRecords) {
    if (featuredSpecies.has(record.nam)) recordsByName.set(record.nam, record);
  }
  const records = [...recordsByName.values()];

  for (const record of records) {
    if (speciesByName.has(record.nam)) continue;
    speciesByName.set(record.nam, {
      name: record.nam,
      group,
      ...(cleanTaxon(record.phl) && { phylum: cleanTaxon(record.phl) }),
      ...(cleanTaxon(record.cll) && { class: cleanTaxon(record.cll) }),
      ...(cleanTaxon(record.odl) && { order: cleanTaxon(record.odl) }),
      ...(cleanTaxon(record.fml) && { family: cleanTaxon(record.fml) }),
    });
  }

  console.log(`${group}: ${records.length} usable species`);
}

const species = [...speciesByName.values()].sort((a, b) =>
  a.name.localeCompare(b.name),
);
await writeFile(output, `${JSON.stringify(species, null, 2)}\n`, "utf8");
console.log(`Wrote ${species.length} unique prehistoric species to ${output}`);
