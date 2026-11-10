import { readProjectFile } from "@/lib/project-files";

export type DictionaryEntry = { label: string; description: string };

export function readDictionary(heading: string) {
  const entries = new Map<string, DictionaryEntry>();
  let inside = false;
  for (const line of readProjectFile("docs/data_dictionary.md").split(/\r?\n/)) {
    if (line.startsWith("# ")) inside = line.slice(2).trim() === heading;
    if (!inside || !line.startsWith("|")) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    if (cells.length < 5 || cells[1].startsWith("-") || cells[2] === "label") continue;
    entries.set(cells[1], { label: cells[2], description: cells[3] });
  }
  return entries;
}
