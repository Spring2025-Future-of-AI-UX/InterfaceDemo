// resample.js
async function resample(audioData, originalSampleRate, targetSampleRate) {
  const audioContext = new OfflineAudioContext({
    numberOfChannels: 1,
    length: audioData.length * (targetSampleRate / originalSampleRate),
    sampleRate: targetSampleRate,
  });

  const audioBuffer = audioContext.createBuffer(
    1,
    audioData.length,
    originalSampleRate
  );

  const channelData = audioBuffer.getChannelData(0);
  channelData.set(audioData);

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();

  const resampledBuffer = await audioContext.startRendering();
  return resampledBuffer.getChannelData(0);
}

async function resample(audioData, originalSampleRate, targetSampleRate) {
  const context = new OfflineAudioContext({
    numberOfChannels: 1,
    length: audioData.length * (targetSampleRate / originalSampleRate),
    sampleRate: targetSampleRate,
  });

  const buffer = context.createBuffer(1, audioData.length, originalSampleRate);
  buffer.copyToChannel(audioData, 0);

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start();

  const rendered = await context.startRendering();
  return rendered.getChannelData(0);
}
