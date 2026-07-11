function drawNote(note, octave, clef) {
    const div = document.getElementById("output");
    div.innerHTML = "";
    if (typeof Vex === 'undefined') {
        div.innerText = "Error: VexFlow library failed to load.";
        return;
    }
    const { Renderer, Stave, StaveNote, Voice, Formatter } = Vex.Flow;
    
    // 1. Made the canvas larger (360x220) to fit giant note structures
    const renderer = new Renderer(div, Renderer.Backends.SVG);
    renderer.resize(360, 220);
    const context = renderer.getContext();
    
    // 2. MAGNIFY EVERYTHING: Boost the scale factor by 1.5x for children's readability
    context.scale(1.5, 1.5);
    
    // 3. Widen the staff line paths to give the larger notes plenty of room
    const stave = new Stave(15, 30, 200);
    stave.setContext(context).draw();
    stave.addClef(clef).setContext(context).draw();
    
    const vexNoteKey = `${note.toLowerCase()}/${octave}`;
    const staveNote = new StaveNote({ clef: clef, keys: [vexNoteKey], duration: "q" });
    
    if (note.includes("#")) {
        staveNote.addModifier(new Vex.Flow.Accidental("#"), 0);
    }
    
    // 4. Stretch the note structure width so formatting doesn't squeeze it
    const voice = new Voice({ num_beats: 1, beat_value: 4 });
    voice.addTickables([staveNote]);
    new Formatter().joinVoices([voice]).format([voice], 120);
    voice.draw(context, stave);
}
