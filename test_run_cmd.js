const fs = require('fs');
const { compileTimeline } = require('./src/services/timeline-compiler.ts');

const timelineRaw = `{"tracks":[{"id":"92ceb985-33f2-4c1f-9789-09a048603a43","type":"video","label":"Video 1","clips":[{"id":"31f0f090-e540-489b-b8d2-ada85ee82b45","type":"video","trackIndex":0,"startTime":0,"duration":5,"trimIn":0,"trimOut":0,"filePath":"C:\\\\Users\\\\mahesh.sawant\\\\Downloads\\\\video_20260306_122337.mp4","name":"video_20260306_122337.mp4"},{"id":"10c34126-75f7-4c1b-98a0-df91d8a992e4","type":"video","trackIndex":0,"startTime":5,"duration":5,"trimIn":0,"trimOut":0,"filePath":"C:\\\\Users\\\\mahesh.sawant\\\\Pictures\\\\Generated Image September 10, 2025 - 3_13PM.png","name":"Generated Image September 10, 2025 - 3_13PM.png"}],"isMuted":false,"isLocked":false,"height":64},{"id":"3432f138-0c66-4e57-9152-0964d244bf9a","type":"audio","label":"Audio 1","clips":[{"id":"514eef6d-f1d7-47d3-ab5d-2241b1a7ab72","type":"audio","trackIndex":1,"startTime":0,"duration":25.425,"trimIn":0,"trimOut":0,"filePath":"C:\\\\Users\\\\mahesh.sawant\\\\Downloads\\\\fassounds-lofi-study-calm-peaceful-chill-hop-112191.mp3","name":"fassounds-lofi-study-calm-peaceful-chill-hop-112191.mp3"}],"isMuted":true,"isLocked":false,"height":48},{"id":"e8034e5d-8ba9-4996-a4f8-ed2d51f8a6a2","type":"text","label":"Text / Subtitles","clips":[{"id":"da0ceec6-6ff4-4ea1-97c4-5afcfe509142","type":"text","trackIndex":2,"startTime":1.95,"duration":5,"trimIn":0,"trimOut":0,"filePath":"","name":"Tit","content":"Tit"}],"isMuted":false,"isLocked":false,"height":40}],"totalDuration":25.425,"playheadPosition":0}`;

const settings = {
  outputPath: 'test_ultimate.mp4',
  resolution: '1920x1080',
  fps: 30,
  quality: 'high',
  format: 'mp4'
};

const cmd = compileTimeline(JSON.parse(timelineRaw), settings);

const inputArgs = [];
cmd.inputs.forEach(input => {
  if (input.type === 'image') {
    inputArgs.push('-loop', '1');
    inputArgs.push('-framerate', '30');
  }
  inputArgs.push('-i', `"${input.filePath}"`);
});

const fullCmd = [
  `node_modules\\ffmpeg-static\\ffmpeg.exe`,
  inputArgs.join(' '),
  `-filter_complex "${cmd.filterComplex}"`,
  cmd.outputOptions.join(' '),
  `"test_ultimate.mp4"`
].filter(Boolean).join(' ');

console.log("RUNNING CMD:\n" + fullCmd);

const { execSync } = require('child_process');
try {
  execSync(fullCmd, { stdio: 'inherit' });
} catch (e) {
  console.log("EXEC FAILED");
}
