const imageBuffer1 = await Bun.file("rodrigo_branas.jpg").arrayBuffer();
const imageBuffer2 = await Bun.file("pedronauck.jpeg").arrayBuffer();
const form = new FormData();
form.append('model', 'gpt-image-1.5');
form.append('image[]', new Blob([imageBuffer1], { type: "image/jpeg" }), "rodrigo_branas.jpg");
form.append('image[]', new Blob([imageBuffer2], { type: "image/jpeg" }), "pedronauck.jpeg");
form.append("prompt", "Transfira as tatuagens de uma pessoa para a outra e coloque ambas em um jogo de poker com mais 2 pessoas aleatórias");
form.append("size", "1536x1024");


const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: form
});

const output = (await response.json()) as any;
console.log(output);
const base64 = output.data[0].b64_json;
await Bun.write("image_3.png", Buffer.from(base64, "base64"));
console.log("Imagem salva com sucesso");