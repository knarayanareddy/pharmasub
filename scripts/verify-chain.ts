import { verifyAudit } from "../src/domain/hashchain";

const result = verifyAudit();
console.log(JSON.stringify(result));
if (result.brokenAt !== null) process.exitCode = 1;
