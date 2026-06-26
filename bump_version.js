const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const packagePaths = [
  path.join(rootDir, 'package.json'),
  path.join(rootDir, 'packages/app/package.json'),
  path.join(rootDir, 'packages/core/package.json'),
  path.join(rootDir, 'packages/electron/package.json')
];
const gradlePath = path.join(rootDir, 'packages/app/android/app/build.gradle');

function bumpVersion() {
  let newVersion = process.argv[2];

  if (!newVersion) {
    const rootPkgPath = packagePaths[0];
    if (!fs.existsSync(rootPkgPath)) {
      console.error(`Error: Root package.json not found at ${rootPkgPath}`);
      process.exit(1);
    }
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
    const currentVersion = rootPkg.version;

    if (!currentVersion) {
      console.error('Error: No version field found in root package.json');
      process.exit(1);
    }

    const parts = currentVersion.split('.');
    if (parts.length >= 3) {
      const lastIndex = parts.length - 1;
      const lastPart = parts[lastIndex];
      const match = lastPart.match(/^(\d+)(.*)$/);
      if (match) {
        const num = parseInt(match[1], 10) + 1;
        parts[lastIndex] = `${num}${match[2]}`;
        newVersion = parts.join('.');
      } else {
        console.error(`Error: Cannot auto-increment version "${currentVersion}"`);
        process.exit(1);
      }
    } else {
      console.error(`Error: Invalid semver format in root package.json version "${currentVersion}"`);
      process.exit(1);
    }
    console.log(`Auto-incrementing version: ${currentVersion} -> ${newVersion}`);
  } else {
    console.log(`Using provided version: ${newVersion}`);
  }

  // 1. Update all package.json files
  packagePaths.forEach(pkgPath => {
    if (fs.existsSync(pkgPath)) {
      const pkgContent = fs.readFileSync(pkgPath, 'utf8');
      const pkgJson = JSON.parse(pkgContent);
      const oldVersion = pkgJson.version;
      pkgJson.version = newVersion;
      // Stringify with 4 spaces formatting and trailing newline
      fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 4) + '\n', 'utf8');
      console.log(`✅ Updated ${path.relative(rootDir, pkgPath)}: ${oldVersion} -> ${newVersion}`);
    } else {
      console.warn(`Warning: File not found at ${pkgPath}`);
    }
  });

  // 2. Update Android build.gradle
  if (fs.existsSync(gradlePath)) {
    const gradleContent = fs.readFileSync(gradlePath, 'utf8');
    let updatedContent = gradleContent;

    // Increment versionCode
    const versionCodeMatch = gradleContent.match(/versionCode\s+(\d+)/);
    if (versionCodeMatch) {
      const currentCode = parseInt(versionCodeMatch[1], 10);
      const newCode = currentCode + 1;
      updatedContent = updatedContent.replace(/(versionCode\s+)\d+/, `$1${newCode}`);
      console.log(`✅ Updated ${path.relative(rootDir, gradlePath)} versionCode: ${currentCode} -> ${newCode}`);
    } else {
      console.warn(`Warning: Could not find versionCode in ${gradlePath}`);
    }

    // Update versionName
    const versionNameMatch = gradleContent.match(/versionName\s+["']([^"']+)["']/);
    if (versionNameMatch) {
      const currentName = versionNameMatch[1];
      updatedContent = updatedContent.replace(/(versionName\s+["'])[^"']+(["'])/, `$1${newVersion}$2`);
      console.log(`✅ Updated ${path.relative(rootDir, gradlePath)} versionName: ${currentName} -> ${newVersion}`);
    } else {
      console.warn(`Warning: Could not find versionName in ${gradlePath}`);
    }

    fs.writeFileSync(gradlePath, updatedContent, 'utf8');
  } else {
    console.warn(`Warning: Android build.gradle not found at ${gradlePath}`);
  }

  console.log('Bump version complete.');
}

bumpVersion();
