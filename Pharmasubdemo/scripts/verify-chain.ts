import { verifyAudit } from "../src/domain/hashchain";

verifyAudit().then(async (result) => {
  console.log(JSON.stringify(result));
  if (result.brokenAt !== null) process.exitCode = 1;
  const { pool } = await import("../src/db");
  await pool.end();
});
