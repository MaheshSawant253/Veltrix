const fs = require('fs');
const { compileTimeline } = require('./src/services/timeline-compiler.ts');

const txt = fs.readFileSync('db_extract.txt', 'utf16le');
if (txt.trim() === '') {
  console.log('No data');
  process.exit(1);
}

const parts = txt.split('|'); // Assuming default sqlite separator?
// Wait, sqlite3 output defaults to | separator. I'll just parse the first column which is timeline_data.
// Since sqlite might output multiple lines if JSON has newlines.
// It's safer to just eval regex. Let's just print the exact DB data.
console.log(txt.substring(0, 2000));
