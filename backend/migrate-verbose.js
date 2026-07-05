const { exec } = require('child_process');

function runCommand(command) {
  return new Promise((resolve) => {
    console.log(`Executing: ${command}`);
    const child = exec(command, { env: process.env });
    
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    child.on('close', (code) => {
      console.log(`Command finished with code ${code}\n`);
      resolve(code);
    });
  });
}

async function main() {
  console.log('--- START VERBOSE MIGRATION RESET RUNNER ---');
  
  // 1. Prisma Generate
  await runCommand('npx prisma generate');
  
  // 2. Perform migrate reset to clear conflicting/half-applied schemas
  console.log('Resetting database and running migrations from scratch...');
  const resetCode = await runCommand('npx prisma migrate reset --force');
  
  if (resetCode !== 0) {
    console.error('Migration reset failed. Exiting with code 1.');
    process.exit(1);
  }
  
  console.log('--- MIGRATION RESET COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error in runner:', err);
  process.exit(1);
});
