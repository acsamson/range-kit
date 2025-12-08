import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline';

const PACKAGES_DIR = path.resolve(process.cwd(), 'packages');
const TARGET_PACKAGES = ['core', 'react', 'vue'];

// Parse arguments
const args = process.argv.slice(2);
const autoYes = args.includes('--yes') || args.includes('-y');
const skipPublish = args.includes('--skip-publish');
const specifiedVersion = args.find(arg => !arg.startsWith('-'));

const readline = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  if (autoYes) return Promise.resolve('y');
  return new Promise((resolve) => readline.question(query, resolve));
};

async function main() {
  try {
    // 1. Get current version from core
    const corePkgPath = path.join(PACKAGES_DIR, 'core', 'package.json');
    const corePkg = JSON.parse(fs.readFileSync(corePkgPath, 'utf-8'));
    const currentVersion = corePkg.version;

    console.log(`Current version: ${currentVersion}`);

    // 2. Ask for bump type or specific version
    let newVersion = specifiedVersion;
    if (!newVersion) {
        if (autoYes) {
            newVersion = 'patch';
        } else {
            const answer = await question('Enter new version (or "patch", "minor", "major"): ');
            newVersion = answer.trim();
        }
    }

    if (!newVersion) {
      newVersion = 'patch';
    }

    if (['patch', 'minor', 'major'].includes(newVersion)) {
      const parts = currentVersion.split('.').map(Number);
      if (newVersion === 'major') {
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
      } else if (newVersion === 'minor') {
        parts[1]++;
        parts[2] = 0;
      } else {
        parts[2]++;
      }
      newVersion = parts.join('.');
    }

    console.log(`\nTarget version: ${newVersion}`);
    
    if (!autoYes) {
        const confirm = await question('Are you sure you want to release this version? (y/N) ');
        if (confirm.toLowerCase() !== 'y') {
            console.log('Aborted.');
            process.exit(0);
        }
    }

    // 3. Update package.json files
    console.log('\nUpdating package.json files...');
    for (const pkgDir of TARGET_PACKAGES) {
      const pkgPath = path.join(PACKAGES_DIR, pkgDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      pkg.version = newVersion;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`Updated ${pkg.name} to ${newVersion}`);
    }

    // 4. Build
    console.log('\nBuilding packages...');
    execSync('pnpm -r build', { stdio: 'inherit' });

    // 5. Publish
    if (skipPublish) {
        console.log('\nSkipping publish as requested.');
    } else {
        console.log('\nPublishing packages...');
        let publishConfirm = 'y';
        if (!autoYes) {
            publishConfirm = await question('Ready to publish to npm? (y/N) ');
        }
        
        if (publishConfirm.toLowerCase() === 'y') {
            // Using --no-git-checks because we might be in a dirty state or not want to commit yet
            try {
                execSync(`pnpm -r publish --no-git-checks --access public`, { stdio: 'inherit' });
                console.log('\nPublished successfully!');
            } catch (e) {
                console.error('\nPublish failed. Please check the logs.');
                process.exit(1);
            }
        } else {
            console.log('\nSkipping publish. You can publish manually later.');
        }
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    readline.close();
  }
}

main();
