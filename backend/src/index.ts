import { execSync } from "node:child_process";
import { app } from "@/app";
import { env } from "@/config/env";

// Applying migrations here (rather than only in package.json's "start" script)
// guarantees they run no matter how the host invokes the entrypoint file.
if (env.nodeEnv === "production") {
  try {
    // eslint-disable-next-line no-console
    console.log("Prisma migraties toepassen...");
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Prisma migrate deploy is mislukt:", error);
    process.exit(1);
  }
}

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API luistert op poort ${env.port}`);
});
