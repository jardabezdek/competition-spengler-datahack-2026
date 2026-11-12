import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export function readProjectFile(name: string) {
  const fromWeb = path.join(process.cwd(), "..", name);
  return readFileSync(existsSync(fromWeb) ? fromWeb : path.join(process.cwd(), name), "utf8");
}

export function dataset() {
  return process.env.DATASET ?? "synthetic";
}

export function processedFile(name: string) {
  return `data/${dataset()}/processed/${name}`;
}

export function csvNumber(value: string) {
  return value === "" ? null : Number(value);
}

export function readCsv(name: string) {
  const [header, ...lines] = readProjectFile(name).trim().split(/\r?\n/);
  const keys = header.split(",");
  return lines.filter(Boolean).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(keys.map((key, index) => [key, cells[index] ?? ""]));
  });
}
