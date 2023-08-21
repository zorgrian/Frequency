const { spawn } = require('child_process');
const fft = require('fft-js').fft;
const fftUtil = require('fft-js').util;

const SAMPLE_RATE = 32000;  // Changed to 32000 as per your request
const BUFFER_SIZE = 65536;
const BYTE_PER_SAMPLE = 2;
const CHANNELS = 2;

let chunkBuffer = Buffer.alloc(0);
let arecord;

function startRecording(device) {
    arecord = spawn('arecord', ['-D', device, '-f', 'S16_LE', '-r', `${SAMPLE_RATE}`, '-c', '2', '-t', 'wav', '-']);

    arecord.stdout.on('data', processAudioData);
    arecord.stderr.on('data', (data) => console.error(`arecord stderr: ${data}`));
    arecord.on('close', (code) => console.log(`arecord process exited with code ${code}`));
}

function stopRecording() {
    if (arecord) {
        arecord.kill();
    }
}

function processAudioData(data) {
    chunkBuffer = Buffer.concat([chunkBuffer, data]);

    while (chunkBuffer.length >= BUFFER_SIZE * BYTE_PER_SAMPLE * CHANNELS) {
        const chunk = chunkBuffer.slice(0, BUFFER_SIZE * BYTE_PER_SAMPLE * CHANNELS);
        chunkBuffer = chunkBuffer.slice(BUFFER_SIZE * BYTE_PER_SAMPLE * CHANNELS);

        const leftChannel = [];
        for (let i = 0; i < chunk.length; i += BYTE_PER_SAMPLE * CHANNELS) {
            const sample = chunk.readInt16LE(i);
            leftChannel.push(sample);
        }

        const phasors = fft(leftChannel);
        const frequencies = fftUtil.fftFreq(phasors, SAMPLE_RATE);
        const magnitudes = fftUtil.fftMag(phasors);

        let max = -Infinity;
        let idx = -1;
        for (let i = 0; i < magnitudes.length; i++) {
            if (magnitudes[i] > max) {
                max = magnitudes[i];
                idx = i;
            }
        }

        if (idx !== -1) {
            console.log(`Dominant Frequency: ${frequencies[idx].toFixed(2)} Hz`);
        } else {
            console.log(`Dominant Frequency: 0.00 Hz`);
        }
    }
}

module.exports = {
    startRecording,
    stopRecording
};
