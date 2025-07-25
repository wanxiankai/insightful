#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Running Instant Recording Tests...\n');

// Test files to run
const testFiles = [
  'components/__tests__/RecordingTimer.test.tsx',
  'components/__tests__/AudioRecorder.test.tsx', 
  'components/__tests__/RecordingControls.test.tsx',
  'components/__tests__/PermissionHandler.test.tsx',
  'components/__tests__/InstantRecording.integration.test.tsx'
];

console.log('📋 Test Files:');
testFiles.forEach((file, index) => {
  console.log(`  ${index + 1}. ${file}`);
});
console.log('');

// Run vitest with specific test files
const vitestArgs = [
  'run',
  '--reporter=verbose',
  '--coverage',
  ...testFiles
];

const vitest = spawn('npx', ['vitest', ...vitestArgs], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

vitest.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log(`\n❌ Tests failed with exit code ${code}`);
  }
  process.exit(code);
});

vitest.on('error', (error) => {
  console.error('❌ Failed to run tests:', error);
  process.exit(1);
});