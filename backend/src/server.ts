import { buildApp, serverConfig } from "./app";

async function main() {
  const app = await buildApp();
  await app.listen(serverConfig);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
