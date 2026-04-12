const imageBuffer = await Bun.file("rodrigo_branas.jpg").arrayBuffer();
const form = new FormData();
form.append('model', 'gpt-image-1.5');
form.append('image', new Blob([imageBuffer], { type: "image/jpeg" }), "rodrigo_branas.jpg");
form.append("prompt", "Coloque camisa de turista e oculos escuro estilo neo do Matrix na pessoa da foto e troque o fundo por uma praia tropical paradisiaca, com um mar cristalino");
form.append("size", "1024x1024");


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
await Bun.write("image_2.png", Buffer.from(base64, "base64"));
console.log("Imagem salva com sucesso");