const { execSync } = require('child_process');
const cmd = `node_modules\\ffmpeg-static\\ffmpeg.exe -f lavfi -i color=red:s=640x480:r=30:d=1 -f lavfi -i color=blue:s=640x480:r=30:d=1 -filter_complex "color=black:s=640x480:r=30:d=2.000,format=yuv420p[base0];[0:v]trim=start=0.000:end=1.000,setpts=PTS-STARTPTS+0.000/TB,scale=640:480:force_original_aspect_ratio=decrease,pad=640:480:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=30,format=yuv420p[v0];[base0][v0]overlay=eof_action=pass:enable='between(t,0.000,1.000)'[base1];[1:v]trim=start=0.000:end=1.000,setpts=PTS-STARTPTS+1.000/TB,scale=640:480:force_original_aspect_ratio=decrease,pad=640:480:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=30,format=yuv420p[v1];[base1][v1]overlay=eof_action=pass:enable='between(t,1.000,2.000)'[base2];aevalsrc=0:d=2.000[aout]" -map "[base2]" -map "[aout]" -c:v h264_qsv -global_quality 23 -preset medium -c:a aac -b:a 192k -movflags +faststart -y test_final_qsv.mp4`;
try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('SUCCESS');
} catch (e) {
  console.log('FAILED');
}
