import "server-only";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { getTransportDiagnostics } from "../application/get-transport-diagnostics.ts";

async function canRead(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export function getServerTransportDiagnostics() {
  return getTransportDiagnostics(process.env, canRead);
}
