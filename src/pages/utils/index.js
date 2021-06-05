function hex(buf, start, length) {
  const ubuf = new Uint8Array(ArrayBuffer.isView(buf) ? buf.buffer : buf, start, length);
  return ubuf.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}

function text(buf, start, length) {
  const ubuf = new Uint8Array(ArrayBuffer.isView(buf) ? buf.buffer : buf, start, length);
  return ubuf.reduce((str, byte) => str + String.fromCharCode(byte), '');
}

function num(buf, start, length) {
  const ubuf = new Uint8Array(ArrayBuffer.isView(buf) ? buf.buffer : buf, start, length);
  return ubuf.reduceRight((sum, byte) => sum * 256 + byte, 0);
}

/*
PCM文件格式:
  Nc 表示channels，声道数
  Ns 表示文件中包含的实际采样块数目，每个采样块包括Nc 个独立采样
  采样率为 F (blocks per second，单位Hz)
  每个采样的长度为M字节。

  ------
+-----------------+-------------+--------------------------------------------------+
|      Field      |    Length   |                     Contents                     |
+-----------------+-------------+--------------------------------------------------+
|      ckID       |      4      |                 Chunk ID: "RIFF"                 |
+-----------------+-------------+--------------------------------------------------+
|     cksize      |      4      | Chunk size: 4 + 24 +(8 + M * Nc * Ns + (0 or 1)) |
+-----------------+-------------+--------------------------------------------------+
|     WAVEID      |      4      |                  WAVE ID: "WAVE"                 |
+-----------------+-------------+--------------------------------------------------+
|      ckID       |      4      |                 Chunk ID: "fmt "                 |
+-----------------+-------------+--------------------------------------------------+
|     cksize      |      4      |                  Chunk size: 16                  |
+-----------------+-------------+--------------------------------------------------+
|   wFormatTag    |      2      |                  WAVE_FORMAT_PCM                 |
+-----------------+-------------+--------------------------------------------------+
|    nChannels    |      2      |                        Nc                        |
+-----------------+-------------+--------------------------------------------------+
| nSamplesPerSec  |      4      |                         F                        |
+-----------------+-------------+--------------------------------------------------+
| nAvgBytesPerSec |      4      |                    F * M * Nc                    |
+-----------------+-------------+--------------------------------------------------+
|   nBlockAlign   |      2      |                      M * Nc                      |
+-----------------+-------------+--------------------------------------------------+
| wBitsPerSample  |      2      |                rounds up to 8 * M                |
+-----------------+-------------+--------------------------------------------------+
|      ckID       |      4      |                 Chunk ID: "data"                 |
+-----------------+-------------+--------------------------------------------------+
|     cksize      |      4      |              Chunk size: M * Nc* Ns              |
+-----------------+-------------+--------------------------------------------------+
|  sampled data   | M * Nc * Ns |    Nc * Ns channel-interleaved M-byte samples    |
+-----------------+-------------+--------------------------------------------------+
|       pad       |    0 or 1   |        Padding byte if M * Nc * Ns is odd        |
+-----------------+-------------+--------------------------------------------------+

*/
export function decodeHeader(buf) {
  console.log('ChunkID\t', hex(buf, 0, 4), '\t', text(buf, 0, 4));
  console.log('ChunkSize\t', hex(buf, 4, 4), '\t', num(buf, 4, 4));
  console.log('Format\t', hex(buf, 8, 4), '\t', text(buf, 8, 4));
  console.log('SubChunk1ID\t', hex(buf, 12, 4), '\t', text(buf, 12, 4));
  console.log('SubChunk1Size\t', hex(buf, 16, 4), '\t', num(buf, 16, 4));
  console.log('AudioFormat\t', hex(buf, 20, 2), '\t');
  console.log('NumChannels\t', hex(buf, 22, 2), '\t');
  console.log('SampleRate\t', hex(buf, 24, 4), '\t', num(buf, 24, 4));
  console.log('ByteRate\t', hex(buf, 28, 4), '\t', num(buf, 28, 4));
  console.log('BlockAlign\t', hex(buf, 30, 2), '\t', num(buf, 30, 2));
  console.log('BitsPerSample\t', hex(buf, 32, 2), '\t', num(buf, 32, 2));
  console.log('SubChunk2ID\t', hex(buf, 36, 4), '\t', text(buf, 36, 4));
  console.log('SubChunk2Size\t', hex(buf, 40, 4), '\t', num(buf, 40, 4));
}

export const concat = (buffer1, buffer2) => {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);

  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);

  return tmp.buffer;
};

export const genWavifyHeader = (length, numberOfChannels, sampleRate, bytesPerSample = 2) => {
  const header = new ArrayBuffer(44);

  const d = new DataView(header);
  length = length % 2 ? length + 1 : length;

  d.setUint8(0, 'R'.charCodeAt(0));
  d.setUint8(1, 'I'.charCodeAt(0));
  d.setUint8(2, 'F'.charCodeAt(0));
  d.setUint8(3, 'F'.charCodeAt(0));

  d.setUint32(4, length + 36, true);

  d.setUint8(8, 'W'.charCodeAt(0));
  d.setUint8(9, 'A'.charCodeAt(0));
  d.setUint8(10, 'V'.charCodeAt(0));
  d.setUint8(11, 'E'.charCodeAt(0));
  d.setUint8(12, 'f'.charCodeAt(0));
  d.setUint8(13, 'm'.charCodeAt(0));
  d.setUint8(14, 't'.charCodeAt(0));
  d.setUint8(15, ' '.charCodeAt(0));

  d.setUint32(16, 16, true);
  d.setUint16(20, 1, true);
  d.setUint16(22, numberOfChannels, true);
  d.setUint32(24, sampleRate, true);
  d.setUint32(28, sampleRate * numberOfChannels * bytesPerSample);
  d.setUint16(32, numberOfChannels * bytesPerSample);
  d.setUint16(34, bytesPerSample * 8, true);

  d.setUint8(36, 'd'.charCodeAt(0));
  d.setUint8(37, 'a'.charCodeAt(0));
  d.setUint8(38, 't'.charCodeAt(0));
  d.setUint8(39, 'a'.charCodeAt(0));
  d.setUint32(40, length, true);

  return header;
};

export const wavify = (data, numberOfChannels, sampleRate, bytesPerSample = 2) => {
  const header = genWavifyHeader(data.byteLength, numberOfChannels, sampleRate, bytesPerSample);
  return concat(header, data);
};
