import { readFileSync } from "fs";

const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
        model: 'gpt-4.1-nano',
        input: 'Qual é a versão do typescript?',
        tools: [
            {
                type: 'function',
                name: 'read_file',
                description: 'Lê o conteúdo de um arquivo do projeto',
                parameters: {
                    type: 'object',
                    properties: {
                        filename: {
                            type: 'string',
                            description: 'O nome do arquivo a ser lido'
                        }
                    },
                    required: ['filename']
                }
            }
        ]
    })
});

const output = await response.json();
console.log(JSON.stringify(output, undefined, "  "));

const toolCall = output.output?.find((item: any) => item.type === 'function_call');
if (toolCall) {
    console.log(`\nTool call detectado: ${toolCall.name}`);
    const args = JSON.parse(toolCall.call_id ? toolCall.arguments : '{}');
    console.log(`Argumentos: ${JSON.stringify(args)}`);
    const fileContent = readFileSync(args.filename, 'utf-8');
    console.log(`\nConteúdo do arquivo:\n${fileContent}`);
    const followUp = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4.1-nano',
            input: [
                { type: 'message', role: 'user', content: 'Qual é a versão do typescript?' },
                {
                    type: 'function_call',
                    name: toolCall.name,
                    call_id: toolCall.call_id,
                    arguments: toolCall.arguments
                },
                {
                    type: 'function_call_output',
                    call_id: toolCall.call_id,
                    output: fileContent
                }
            ],
            tools: [
                {
                    type: 'function',
                    name: 'read_file',
                    description: 'Lê o conteúdo de um arquivo do projeto',
                    parameters: {
                        type: 'object',
                        properties: {
                            filename: {
                                type: 'string',
                                description: 'O nome do arquivo a ser lido'
                            }
                        },
                        required: ['filename']
                    }
                }
            ]
        })
    });
    const finalOutput = await followUp.json();
    console.log(`\nResposta final:`);
    const textOutput = finalOutput.output?.find((item: any) => item.type === 'message');
    if (textOutput) {
        console.log(textOutput.content?.[0]?.text);
    } else {
        console.log(JSON.stringify(finalOutput, undefined, "  "));
    }
}
