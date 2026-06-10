import { loadConfig } from "./config.js";
import { NoopEngine } from "./noopEngineInterface.js";
import { createApp } from "./app.js";
import { createLogger } from "./logger.js";

const indexLogger = createLogger("index");

// Load and validate config from the JSON file specified by the CONFIG_PATH
// environment variable, falling back to fuzzer.config.json in the working directory
const configPath = "fuzzer.config.json";
const config = loadConfig(configPath);

const engine = new NoopEngine();
const app = createApp(config, engine);

app.listen(config.proxyPort, () => {
  indexLogger.info(
    { port: config.proxyPort, target: config.targetUrl, level: config.level },
    "proxy started",
  );
});
