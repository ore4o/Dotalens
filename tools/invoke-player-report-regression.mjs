import { createHash, randomUUID } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const option = (name, fallback = "") => { const i = args.indexOf(name); return i < 0 ? fallback : String(args[i + 1] || fallback); };
const flag = (name) => args.includes(name);
const mode = option("--mode", "ValidateExisting");
if (!new Set(["ValidateExisting", "ReparseChanged", "ReparseAll"]).has(mode)) throw new Error("--mode must be ValidateExisting, ReparseChanged, or ReparseAll");
const root = resolve(process.env.PLAYER_REPORT_REGRESSION_PROJECT_ROOT || process.cwd());
const manifestPath = resolve(option("--manifest", join(root, "tests/player-report-regression/manifest.json")));
const apiBase = (process.env.PLAYER_REPORT_REGRESSION_API_BASE || "http://127.0.0.1:5600/api").replace(/\/$/, "");
const timeoutSeconds = Number(option("--timeout-seconds", "1200"));
const selectedId = option("--selected-match-id");
const maxMatches = Number(option("--max-matches", "0"));
const dataRoot = join(root, "tools/runtime/dota-lens-data");
const runtimeRoot = join(root, "tools/runtime/player-report-regression");
const checkpoints = join(runtimeRoot, "checkpoints");
const runRoot = join(runtimeRoot, "runs", new Date().toISOString().replace(/[-:.]/g, ""));
const model = "player-report-base-components/1.0";
let owned = null;

const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const atomicJson = (path, value) => { mkdirSync(dirname(path), { recursive: true }); const tmp = `${path}.${randomUUID()}.tmp`; writeFileSync(tmp, JSON.stringify(value, null, 2)); renameSync(tmp, path); };
const safeId = (value) => { if (!/^\d+$/.test(String(value))) throw new Error("Manifest match_id must be numeric."); return String(value); };
const within = (value) => { const path = resolve(root, value); if (isAbsolute(value) || relative(root, path).startsWith("..")) throw new Error("Path escapes the project root."); return path; };
const request = async (path, init) => { const response = await fetch(`${apiBase}${path}`, init); if (!response.ok) throw new Error(`HTTP ${response.status} ${path}`); return response.json(); };
const status = async () => { try { return await request("/status"); } catch { return null; } };
async function ready() {
  let current = await status();
  if (current) return current;
  const launch = process.env.PLAYER_REPORT_REGRESSION_TEST_PARSER_LAUNCH_SCRIPT;
  if (!launch) throw new Error("Parser is unavailable and this Node runner only starts an explicit test parser.");
  owned = spawn(process.execPath, [launch], { detached: true, stdio: "ignore" }); owned.unref();
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) { await new Promise((r) => setTimeout(r, 250)); current = await status(); if (current?.status === "ready") return current; }
  throw new Error("Parser did not become ready within 30 seconds.");
}
function analysisExists(id) { try { const base = json(join(dataRoot, "analyses", id, "summary.json")).analysis_storage?.module_base; return Boolean(base && existsSync(join(dataRoot, "analyses", id, base, "players.json.gz"))); } catch { return false; } }
async function parse(id, replay) {
  await ready(); const extension = replay.endsWith(".bz2") ? ".dem.bz2" : ".dem"; const cached = join(dataRoot, "replays", `${id}${extension}`); let upload = replay;
  if (resolve(cached) === resolve(replay)) { const directory = join(runtimeRoot, "uploads"); mkdirSync(directory, { recursive: true }); upload = join(directory, `${id}.${randomUUID()}${extension}`); copyFileSync(replay, upload); }
  try { const body = createReadStream(upload); const job = await request(`/replays/${id}/import`, { method: "POST", body, duplex: "half", headers: { "Content-Type": "application/octet-stream", "X-Dota-Lens-File-Name": replay.split("/").at(-1) } }); const deadline = Date.now() + timeoutSeconds * 1000; let current = job;
    while (Date.now() < deadline) { current = await request(`/jobs/${job.id}`); if (["completed", "failed", "canceled"].includes(current.status)) break; await new Promise((r) => setTimeout(r, 1000)); }
    if (current.status !== "completed") { await request(`/jobs/${job.id}`, { method: "DELETE" }).catch(() => {}); throw new Error(`Replay job ended as '${current.status}': ${current.error || "no parser error detail"}`); }
  } finally { if (upload !== replay) rmSync(upload, { force: true }); }
}
function validate(id, goldenPath, slot) { const result = spawnSync(process.execPath, [join(root, "tools/Validate-PlayerReportV4.mjs"), id, root, ...(goldenPath ? [goldenPath, String(slot)] : [])], { encoding: "utf8" }); const payload = JSON.parse(result.stdout); if (result.status || !payload.valid) throw new Error(`Task 8 validation failed: ${(payload.errors || []).join("; ")}`); return payload; }
const manifest = json(manifestPath); if (manifest.schema !== "player-report-regression-manifest/1.0") throw new Error("Unsupported player report regression manifest schema.");
let matches = manifest.matches.filter((row) => flag("--include-candidates") || row.matrix_enabled === true); if (selectedId) matches = matches.filter((row) => safeId(row.match_id) === safeId(selectedId)); if (maxMatches > 0) matches = matches.slice(0, maxMatches); mkdirSync(checkpoints, { recursive: true }); mkdirSync(runRoot, { recursive: true });
const results = [];
try { for (const row of matches) { const id = safeId(row.match_id); const result = { match_id: id, status: "failed", reports_total: 0, reports_valid: 0, golden_total: 0, golden_passed: 0, aggregate_fallback_count: 0, duplicate_applied_key_count: 0, max_root_negative_overall: 0, error: null }; let replay;
  try { replay = within(row.replay_path); if (!existsSync(replay)) throw new Error(`Replay was not found: ${row.replay_path}`); const hash = createHash("sha256").update(readFileSync(replay)).digest("hex"); const checkpointPath = join(checkpoints, `${id}.json`); const checkpoint = existsSync(checkpointPath) ? json(checkpointPath) : null; const parser = mode === "ValidateExisting" ? null : await ready(); const changed = !checkpoint || checkpoint.status !== "validated" || checkpoint.replay_sha256 !== hash || checkpoint.parser_version !== parser?.version || checkpoint.base_component_model !== model || !analysisExists(id); if (mode === "ReparseAll" || (mode === "ReparseChanged" && changed)) await parse(id, replay); const golden = row.golden_subject; const output = validate(id, golden ? join(dirname(manifestPath), "expected", `${id}-slot-${golden.player_slot}.json`) : "", golden?.player_slot); Object.assign(result, { status: "validated", reports_total: output.player_reports, reports_valid: output.valid_reports, golden_total: output.golden_total, golden_passed: output.golden_passed, aggregate_fallback_count: output.aggregate_fallback_count, duplicate_applied_key_count: output.duplicate_applied_key_count, max_root_negative_overall: output.max_root_negative_overall }); atomicJson(checkpointPath, { schema: "player-report-regression-checkpoint/1.0", match_id: id, replay_sha256: hash, parser_version: parser?.version || checkpoint?.parser_version || null, base_component_model: model, status: result.status });
  } catch (error) { result.error = error.message.replace(root, "<project>"); } results.push(result); } } finally { if (owned && !flag("--keep-parser")) await request("/shutdown", { method: "POST" }).catch(() => {}); }
const aggregate = { schema: "player-report-regression-run/1.0", mode, matches_total: results.length, matches_passed: results.filter((x) => x.status === "validated").length, reports_total: results.reduce((n, x) => n + x.reports_total, 0), reports_valid: results.reduce((n, x) => n + x.reports_valid, 0), golden_total: results.reduce((n, x) => n + x.golden_total, 0), golden_passed: results.reduce((n, x) => n + x.golden_passed, 0), failures: results.filter((x) => x.status !== "validated").map(({ match_id, error }) => ({ match_id, error })) }; atomicJson(join(runRoot, "aggregate.json"), aggregate); atomicJson(join(runtimeRoot, "latest-progress.json"), { schema: "player-report-regression-progress/1.0", mode, phase: "completed", matches_total: results.length, matches_completed: results.length, last_match_status: aggregate.failures.length ? "failed" : "validated" }); writeFileSync(join(runRoot, "aggregate.md"), `# Player Report Regression Run\n\n- Mode: ${mode}\n- Matches: ${aggregate.matches_passed}/${aggregate.matches_total}\n`); console.log(JSON.stringify(aggregate)); if (aggregate.failures.length) process.exitCode = 1;
