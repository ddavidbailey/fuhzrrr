import { z } from "zod";
import { readFileSync } from "fs";

const DB_PATH = "fuzzer.db";

const DataConfigSchema = z.object({
  dbPath: z.string().default(DB_PATH),
  httpPort: z.number().int().min(1).max(65535).default(3001),
  wsPort: z.number().int().min(1).max(65535).default(3002),
});

export type DataConfig = z.infer<typeof DataConfigSchema>;

export function loadConfig(filePath: string): DataConfig {
  const raw = JSON.parse(readFileSync(filePath, "utf8"));
  return DataConfigSchema.parse(raw);
}
