import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline';

const PACKAGES = ['range-kit', 'range-kit-react', 'range-kit-vue'];

const readline = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => readline.question(query, resolve));

async function main() {
  try {
    console.log('Unified Deprecation Tool');
    console.log('------------------------');

    const version = await question('Enter version to deprecate (e.g., 1.0.0): ');
    if (!version.trim()) {
      console.error('Version is required.');
      process.exit(1);
    }

    const message = await question('Enter deprecation message: ');
    if (!message.trim()) {
      console.error('Message is required.');
      process.exit(1);
    }

    console.log(`\nGoing to deprecate version ${version} for:`);
    PACKAGES.forEach(p => console.log(`- ${p}`));
    console.log(`Message: "${message}"`);

    const confirm = await question('\nAre you sure? (y/N) ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('Aborted.');
      process.exit(0);
    }

    console.log('\nDeprecating packages...');
    for (const pkg of PACKAGES) {
      try {
        console.log(`Deprecating ${pkg}@${version}...`);
        execSync(`npm deprecate ${pkg}@${version} "${message}"`, { stdio: 'inherit' });
      } catch (e) {
        console.error(`Failed to deprecate ${pkg}. Continuing...`);
      }
    }

    console.log('\nDone.');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    readline.close();
  }
}

main();
