const audioBuffer = await Bun.file("yt_2.mp3").arrayBuffer();
const form = new FormData();
form.append('model', 'whisper-1');
form.append('file', new Blob([audioBuffer], { type: "audio/mpeg" }), "yt_2.mp3");


const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: form
});

const output = (await response.json()) as any;
console.log(output);
console.log(output.text);
