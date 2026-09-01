import { runEvalSuite } from "./fixtures";

const suite = runEvalSuite();
for (const result of suite.results) {
  const mark = result.ok ? "PASS" : "FAIL";
  const errors = result.report.checks
    .filter((item) => !item.pass)
    .map((item) => `    - [${item.severity}] ${item.id}: ${item.detail}`)
    .join("\n");
  console.log(`${mark}  ${result.id}  score ${result.report.score}  errors ${result.report.errorCount}`);
  if (!result.ok) {
    if (result.missingFails.length) {
      console.log(`    expected to fail: ${result.missingFails.join(", ")}`);
    }
    if (errors) console.log(errors);
  }
}

if (!suite.passed) {
  process.exitCode = 1;
}
