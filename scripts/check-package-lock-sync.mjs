import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const lock = JSON.parse(
  fs.readFileSync(path.join(root, "package-lock.json"), "utf8"),
);
const lockRoot = lock.packages?.[""];
const failures = [];

if (!lockRoot) {
  failures.push("package-lock.json 缺少 packages[''] 根记录");
} else {
  for (const field of ["dependencies", "devDependencies", "engines"]) {
    const manifestValues = manifest[field] || {};
    const lockValues = lockRoot[field] || {};
    const names = new Set([
      ...Object.keys(manifestValues),
      ...Object.keys(lockValues),
    ]);

    for (const name of [...names].sort()) {
      if (manifestValues[name] !== lockValues[name]) {
        failures.push(
          `${field}.${name}: package.json=${JSON.stringify(manifestValues[name])}, package-lock.json=${JSON.stringify(lockValues[name])}`,
        );
      }
    }
  }
}

if (manifest.name !== lock.name || manifest.version !== lock.version) {
  failures.push(
    `根名称或版本不一致：package.json ${manifest.name}@${manifest.version}, package-lock.json ${lock.name}@${lock.version}`,
  );
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`ERROR: ${failure}`);
  }
  console.error(`\n依赖清单同步检查失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `依赖清单同步检查通过：package.json 与 package-lock.json 根依赖、开发依赖、Node 引擎及包版本完全一致。`,
);
