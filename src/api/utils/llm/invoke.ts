import OpenAI, { ClientOptions } from "openai";

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

export default async function invoke(prompt: string) {
    const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
    })
    return chatCompletion.choices[0].message.content;
}