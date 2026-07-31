import { spawnSync } from "node:child_process";

const powerShell = spawnSync("pwsh", ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.Major"], {
  encoding: "utf8",
});

if (powerShell.error?.code === "ENOENT") {
  console.log("Skipping PowerShell regression orchestration tests: pwsh 7+ is not installed.");
  console.log("Install it on macOS with: brew install powershell");
  process.exit(0);
}

if (powerShell.status !== 0 || Number(powerShell.stdout.trim()) < 7) {
  console.error(powerShell.stderr || "PowerShell 7 or newer is required for regression orchestration tests.");
  process.exit(1);
}

const tests = spawnSync(process.execPath, ["--test", "tests/tools/player-report-regression.test.js"], {
  encoding: "utf8",
});
process.stdout.write(tests.stdout || "");
process.stderr.write(tests.stderr || "");
process.exit(tests.status ?? 1);
