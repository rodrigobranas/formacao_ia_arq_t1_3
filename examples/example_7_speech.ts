const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
        model: 'tts-1',
        voice: 'onyx',
        input: 'Fala galera, estão abertas as inscrições para a próxima turma do curso de Inteligência Artificial para Devs, que é uma parceria minha com o Pedro Nauk. Atualmente, muito mais de 70% do código que eu escrevo já é por meio de AI e não é mais uma questão de se é possível, quando vai ser possível, isso já é realidade e eu aposto que muita gente ao seu redor que já está aumentando a produtividade, a qualidade das entregas, então você não vai perder o seu emprego para a Inteligência Artificial, mas com certeza vai perder para alguém que sabe utilizar o modelo e a ferramenta certa para cada tipo de atividade. Esse é muito mais que um curso, é uma mentoria, as aulas são ao vivo, a gente troca muita experiência e você também ganha acesso a nossa comunidade, que tem milhares de pessoas trocando informações o tempo todo, exemplos de prontes, comandos, agentes, MCPs, análise de curso de ferramenta e muito mais. Então não perca tempo, se atualize, não fique de fora dessa revolução, clica no link que vai aparecer em algum lugar, vem com a gente e até lá.'
    })
});

const audioBuffer = await response.arrayBuffer();
await Bun.write("speech.mp3", audioBuffer);
console.log("Audio salvo com sucesso");
