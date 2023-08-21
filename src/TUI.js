const readline = require('readline');
const functionality = require('./functionality');
const { exec } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let audioDevices = [];

function initialize() {
    listAudioDevices();
    setupKeypressListener();
}

function setupKeypressListener() {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', (str, key) => {
        if (key.name === 'escape') {
            console.log('\nExiting application...');
            functionality.stopRecording();
            rl.close();
            process.exit();
        }
    });
}

function listAudioDevices() {
    exec('arecord -l', (error, stdout, stderr) => {
        if (error) {
            console.error("Error fetching audio devices:", error);
            return;
        }

        const deviceLines = stdout.split("\n").filter(line => line.trim().startsWith('card'));
        audioDevices = deviceLines.map(line => {
            const match = line.match(/card (\d+):.*\[(.*)\], device (\d+):/);
            return {
                card: match[1],
                name: match[2],
                device: match[3]
            };
        });

        if (audioDevices.length === 0) {
            console.error("No audio devices found.");
            process.exit(1);
        }

        promptUserForDevice();
    });
}

function promptUserForDevice() {
    const question = audioDevices.map((device, idx) => `${idx + 1}) ${device.name}`).join(' ') + '\n';
    rl.question(question, (answer) => {
        const deviceIndex = parseInt(answer) - 1;
        if (audioDevices[deviceIndex]) {
            const deviceString = `hw:${audioDevices[deviceIndex].card},${audioDevices[deviceIndex].device}`;
            functionality.startRecording(deviceString);
        } else {
            console.log("Invalid choice. Please select from the given options.");
            promptUserForDevice();
        }
    });
}

module.exports = {
    initialize
};
