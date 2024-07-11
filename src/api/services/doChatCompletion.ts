import OpenAI from "openai";


export default async function doChatCompletion(
    messageChain: any[]
) {
    const openai = new OpenAI({
        organization: `${process.env.OPENAI_ORGANIZATION}`,
        project: `${process.env.OPENAI_PROJECT}`
    });

    const completion = await openai.chat.completions.create({
        messages: messageChain,
        model: "gpt-4o",
    });

    return completion;
}