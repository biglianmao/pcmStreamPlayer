// Int8: 128,
// Int16: 32768,
// Int32: 2147483648,
// Float32: 1,
const convertValue = 32768; // Int16
const sampleRate = 8000; // 采样率
const numberOfChannels = 2; // 声道数
const typedArray = Int16Array;

self.addEventListener(
  'message',
  function (e) {
    const { trunk, index } = e.data;
    const trunkData =
      trunk instanceof ArrayBuffer ? new typedArray(trunk) : new typedArray(trunk.buffer);
    const length = trunkData.length / numberOfChannels;
    const duration = length / sampleRate;
    const channelData = Array.from({ length: numberOfChannels }).map(
      () => new Float32Array(length),
    );
    let channelPeaks = Array.from({ length: numberOfChannels }).map(() => [0, 0]);
    for (let i = 0; i < trunkData.length; i++) {
      const val = trunkData[i] / convertValue;
      channelData[i % numberOfChannels][i / numberOfChannels] = val;

      const peak = channelPeaks[i % numberOfChannels];
      if (val < peak[0]) peak[0] = val;
      if (val > peak[1]) peak[1] = val;
    }
    self.postMessage(
      { channelData, channelPeaks, length, duration },
      channelData.map((v) => v.buffer),
    );
  },
  false,
);
