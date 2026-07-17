import { mkdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const sourceUrl = process.env.TISSEO_GTFS_URL ?? "https://data.toulouse-metropole.fr/explore/dataset/tisseo-gtfs/files/fc1dda89077cf37e4f7521760e0ef4e9/download/";
const cacheDirectory = resolve(process.env.TISSEO_GTFS_CACHE ?? ".cache/gtfs/tisseo");
const archivePath = resolve(cacheDirectory, "..", "tisseo.zip");

await mkdir(cacheDirectory, { recursive: true });
const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(30_000) });
if (!response.ok) throw new Error(`GTFS download failed with HTTP ${response.status}.`);
await writeFile(archivePath, Buffer.from(await response.arrayBuffer()));

await new Promise((accept, reject) => {
  const extraction = spawn("tar", ["-xf", archivePath, "-C", cacheDirectory], { stdio: "inherit" });
  extraction.once("error", reject);
  extraction.once("exit", (code) => (code === 0 ? accept() : reject(new Error(`tar exited with code ${code}.`))));
});

await rm(archivePath, { force: true });
console.log(`Tisséo GTFS extracted to ${cacheDirectory}`);
