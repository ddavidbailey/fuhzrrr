import { z } from 'zod';
import { readFileSync } from 'node:fs';

const ProxyConfigSchema = z.object({
  targetUrl: z.string().url(),
  proxyPort: z.number().int().min(1).max(65535),
  level: z.enum(['safe', 'standard', 'aggressive']).default('safe'),
  writeGuardAck: z.boolean().default(false),
  openApiSpecPath: z.string().optional(),
});

export type ProxyConfig = z.infer<typeof ProxyConfigSchema>;

export function loadConfig(filePath: string): ProxyConfig {
  const raw = JSON.parse(readFileSync(filePath, 'utf8'));
  return ProxyConfigSchema.parse(raw);
}
