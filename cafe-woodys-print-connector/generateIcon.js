const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPngIcon(filePath) {
  const width = 32;
  const height = 32;
  
  // Create 32x32 RGBA buffer
  const rowSize = 1 + width * 4;
  const buffer = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    buffer[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Draw a sleek coffee cup / printer icon:
      // Background rounded circle (Coffee Brown #6B3F2A)
      const dx = x - 15.5;
      const dy = y - 15.5;
      const distSq = dx * dx + dy * dy;

      if (distSq <= 14 * 14) {
        // Inside brown circle background
        buffer[pxOffset] = 0x6B;     // R
        buffer[pxOffset + 1] = 0x3F; // G
        buffer[pxOffset + 2] = 0x2A; // B
        buffer[pxOffset + 3] = 0xFF; // A

        // Draw white coffee cup shape in center
        const isCupBody = (x >= 9 && x <= 20 && y >= 14 && y <= 23);
        const isCupHandle = (x >= 21 && x <= 23 && y >= 15 && y <= 21) && !(x === 22 && y >= 17 && y <= 19);
        const isSteam = (y >= 8 && y <= 11) && ((x === 11 || x === 15 || x === 18) && (y % 2 === 0));

        if (isCupBody || isCupHandle || isSteam) {
          buffer[pxOffset] = 0xFF;     // R
          buffer[pxOffset + 1] = 0xFF; // G
          buffer[pxOffset + 2] = 0xFF; // B
          buffer[pxOffset + 3] = 0xFF; // A
        }
      } else {
        // Transparent outside
        buffer[pxOffset] = 0;
        buffer[pxOffset + 1] = 0;
        buffer[pxOffset + 2] = 0;
        buffer[pxOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(buffer);

  // Helper CRC32 calculation
  function crc32(buf) {
    let c = 0xFFFFFFFF;
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let k = n;
      for (let m = 0; m < 8; m++) {
        k = (k & 1) ? (0xEDB88320 ^ (k >>> 1)) : (k >>> 1);
      }
      table[n] = k;
    }
    for (let i = 0; i < buf.length; i++) {
      c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function makeChunk(type, data) {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  // PNG Header
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT Chunk
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const pngBuffer = Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(filePath, pngBuffer);
  console.log('✅ Generated 32x32 PNG icon at:', filePath);
}

createPngIcon(path.join(__dirname, 'icon.png'));
