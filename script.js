const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const SOLFEGE = {
    "C": "Do", "C#": "Do di", "D": "Re", "D#": "Re ri", "E": "Mi",
    "F": "Fa", "F#": "Fa fi", "G": "Sol", "G#": "Sol si", "A": "La", "A#": "La li", "B": "Ti"
};

function getFrequency(note, octave) {
    const keyNumber = NOTE_NAMES.indexOf(note) + (octave - 4) * 12;
    return 440 * Math.pow(2, (keyNumber - 9) / 12);
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(frequency) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1);
}

function speakNote(noteName) {
    const baseName = noteName.replace(/[0-9]/g, '');
    const solfegeName = SOLFEGE[baseName] || "";
    const textToSpeak = `${baseName}... ${solfegeName}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
}

let currentClef = "treble";
let startOctave = 4;
let targetNote = "";
let targetOctave = 4;

function generatePiano() {
    const pianoContainer = document.getElementById("piano");
    pianoContainer.innerHTML = "";
    
    let whiteKeyCount = 0;
    const keyElements = [];

    for (let oct = startOctave; oct <= startOctave + 2; oct++) {
        for (let i = 0; i < 12; i++) {
            // Cap it off neatly at the root note of the 3rd octave boundary
            if (oct === startOctave + 2 && i > 0) break; 
            
            const noteName = NOTE_NAMES[i];
            const isBlack = noteName.includes("#");
            const key = document.createElement("div");
            
            key.dataset.note = noteName;
            key.dataset.octave = oct;
            
            if (isBlack) {
                key.classList.add("black-key");
                // Calculate position relative to how many white keys came before it
                // Width of white key (40px) * count + 10px padding - half of black key width (12px)
                const leftPosition = (whiteKeyCount * 40) + 10 - 12;
                key.style.left = `${leftPosition}px`;
            } else {
                key.classList.add("white-key");
                whiteKeyCount++;
            }
            
            key.addEventListener("mousedown", () => handleKeyPress(noteName, oct, key));
            keyElements.push(key);
        }
    }

    // Set absolute width container constraints to bound the key array perfectly
    pianoContainer.style.width = `${(whiteKeyCount * 40)}px`;

    // Append white keys first, then black keys so overlay order is consistent
    keyElements.forEach(k => {
        if (!k.classList.contains("black-key")) pianoContainer.appendChild(k);
    });
    keyElements.forEach(k => {
        if (k.classList.contains("black-key")) pianoContainer.appendChild(k);
    });
}

function drawNote(note, octave, clef) {
    const div = document.getElementById("output");
    div.innerHTML = "";
    if (typeof Vex === 'undefined') {
        div.innerText = "Error: VexFlow library failed to load.";
        return;
    }
    const { Renderer, Stave, StaveNote, Voice, Formatter } = Vex.Flow;
    const renderer = new Renderer(div, Renderer.Backends.SVG);
    renderer.resize(250, 200);
    const context = renderer.getContext();
    const stave = new Stave(10, 40, 200);
    stave.addClef(clef).setContext(context).draw();
    
    const vexNoteKey = `${note.toLowerCase()}/${octave}`;
    const staveNote = new StaveNote({ clef: clef, keys: [vexNoteKey], duration: "q" });
    
    if (note.includes("#")) {
        staveNote.addModifier(new Vex.Flow.Accidental("#"), 0);
    }
    
    const voice = new Voice({ num_beats: 1, beat_value: 4 });
    voice.addTickables([staveNote]);
    new Formatter().joinVoices([voice]).format([voice], 150);
    voice.draw(context, stave);
}

function generateNewNote() {
    const possibleNotes = ["C", "D", "E", "F", "G", "A", "B"];
    const randomNoteIndex = Math.floor(Math.random() * possibleNotes.length);
    const randomOctaveOffset = Math.floor(Math.random() * 2);
    
    targetNote = possibleNotes[randomNoteIndex];
    targetOctave = startOctave + randomOctaveOffset;
    
    if (targetOctave === startOctave + 2) { 
        targetNote = "C"; 
    }
    
    drawNote(targetNote, targetOctave, currentClef);
}

function handleKeyPress(note, octave, keyElement) {
    const freq = getFrequency(note, octave);
    playTone(freq);
    const feedback = document.getElementById("feedback");
    
    if (note === targetNote && octave === targetOctave) {
        feedback.style.color = "green";
        feedback.innerText = `Correct! It is ${note} (${SOLFEGE[note]})`;
        speakNote(`${note}${octave}`);
        setTimeout(() => {
            feedback.style.color = "#333";
            feedback.innerText = "Find the next note...";
            generateNewNote();
        }, 1500);
    } else {
        feedback.style.color = "red";
        feedback.innerText = `Try again! You played ${note}${octave}`;
    }
}

document.getElementById("start-btn").addEventListener("click", () => {
    currentClef = document.getElementById("clef-select").value;
    startOctave = parseInt(document.getElementById("octave-select").value.split("-")[0]);
    generatePiano();
    generateNewNote();
    document.getElementById("feedback").innerText = "Game started! Find the note.";
});

// Build initial keyboard layout on boot
generatePiano();