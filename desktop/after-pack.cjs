const { spawnSync } = require("node:child_process");
const path = require("node:path");

/**
 * electron-builder skips macOS signing when no Developer ID certificate is
 * available. The bundled JRE changes Electron.app after its upstream
 * signature, which makes macOS report a downloaded build as damaged. An ad
 * hoc signature keeps the bundle internally consistent. It is deliberately
 * not a substitute for Apple Developer ID signing and notarization.
 */
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") return;

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  const sign = spawnSync("codesign", ["--force", "--deep", "--sign", "-", "--timestamp=none", appPath], {
    encoding: "utf8",
  });
  if (sign.status !== 0) {
    throw new Error(`Ad hoc macOS signing failed: ${sign.stderr || sign.stdout}`);
  }

  const verify = spawnSync("codesign", ["--verify", "--deep", "--strict", appPath], {
    encoding: "utf8",
  });
  if (verify.status !== 0) {
    throw new Error(`Ad hoc macOS signature verification failed: ${verify.stderr || verify.stdout}`);
  }
};
