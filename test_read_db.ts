import Database from 'better-sqlite3';
import { compileTimeline } from './src/services/timeline-compiler';
import fs from 'fs';

const db = new Database('db/veltrix.db');
const row = db.prepare('SELECT timeline_data, settings FROM projects ORDER BY updated_at DESC LIMIT 1').get() as any;

const timeline = JSON.parse(row.timeline_data);
const settingsRaw = JSON.parse(row.settings);

const settings = {
  outputPath: 'test.mp4',
  resolution: settingsRaw.resolution || '1920x1080',
  fps: settingsRaw.fps || 30,
  quality: 'high',
  format: 'mp4'
};

const cmd = compileTimeline(timeline, settings as any);
console.log('INPUTS:');
console.log(cmd.inputs);
console.log('\nFILTER_COMPLEX:');
console.log(cmd.filterComplex);
console.log('\nOUTPUTOPTS:');
console.log(cmd.outputOptions.join(' '));

fs.writeFileSync('db/DEBUG_OUTPUT.txt', cmd.filterComplex);
