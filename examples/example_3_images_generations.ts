const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
        model: 'gpt-image-1.5',
        prompt: 'Crie uma imagem com cenário futurista, estilo matrix, que reflita algo moderno e que fale sobre inteligência artificial. Quero também que tenha o texto: Será que o RAG morreu?',
        n: 1,
        size: "1024x1024"
    })
});

const output = (await response.json()) as any;
const base64 = output.data[0].b64_json;
await Bun.write("image_1.png", Buffer.from(base64, "base64"));
console.log("Imagem salva com sucesso");