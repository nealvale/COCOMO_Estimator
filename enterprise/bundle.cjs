// enterprise/bundle.cjs
// Produces an enterprise-friendly deployment bundle from /dist.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const outDir = path.join(root, "enterprise", "bundle");
fs.mkdirSync(outDir, { recursive: true });

if (!fs.existsSync(dist)) {
  console.error("dist/ not found. Run `npm run build` first.");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const zipName = `COCOMO_II_Modernization_Estimator_V3_dist_${stamp}.zip`;
const zipPath = path.join(outDir, zipName);

// Use OS-native zip if available (mac/linux). On Windows, use PowerShell Compress-Archive.
try {
  run(`zip -r "${zipPath}" dist`);
} catch (e) {
  try {
    run(`powershell -NoProfile -Command "Compress-Archive -Path '${dist}\*' -DestinationPath '${zipPath}' -Force"`);
  } catch (e2) {
    console.error("Unable to create zip automatically. You can zip the dist/ folder manually.");
    process.exit(2);
  }
}

fs.writeFileSync(
  path.join(outDir, "DEPLOYMENT.md"),
  `# Enterprise Deployment Bundle\n\nThis folder contains a zipped static build of the app.\n\n## Host as static site\n- Upload the contents of the zip (or dist/) to your static hosting platform.\n- For SharePoint, place files in a Site Assets library and reference index.html.\n\n## Notes\n- Vite base is set to ./ so relative assets work from subpaths.\n`
);

console.log("Enterprise bundle created:", zipPath);
