import fs from 'node:fs/promises'
import path from 'node:path'

const outDir = path.join(process.cwd(), 'public', 'audio', 'songs')
const years = [1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022]

function clamp16(value) {
  const v = Math.max(-1, Math.min(1, value))
  return Math.floor(v * 32767)
}

function createToneWav({ sampleRate = 22050, durationSec = 8, baseFreq = 220 }) {
  const totalSamples = Math.floor(sampleRate * durationSec)
  const channels = 1
  const bitsPerSample = 16
  const blockAlign = channels * bitsPerSample / 8
  const byteRate = sampleRate * blockAlign
  const dataSize = totalSamples * blockAlign
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(channels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(byteRate, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(bitsPerSample, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  const melody = [1, 1.25, 1.5, 2, 1.5, 1.25, 1]
  const noteLen = Math.floor(totalSamples / melody.length)

  for (let i = 0; i < totalSamples; i += 1) {
    const noteIndex = Math.min(melody.length - 1, Math.floor(i / noteLen))
    const f = baseFreq * melody[noteIndex]
    const t = i / sampleRate
    const envelope = Math.exp(-2.2 * (i % noteLen) / noteLen)
    const sample = 0.33 * envelope * Math.sin(2 * Math.PI * f * t)
    buffer.writeInt16LE(clamp16(sample), 44 + i * 2)
  }

  return buffer
}

async function main() {
  await fs.mkdir(outDir, { recursive: true })

  for (const year of years) {
    const base = 180 + ((year % 13) * 11)
    const wav = createToneWav({ baseFreq: base })
    const filePath = path.join(outDir, `${year}-preview.wav`)
    await fs.writeFile(filePath, wav)
    console.log(`Created ${filePath}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
