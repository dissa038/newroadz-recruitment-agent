import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/ai/gemini';

const geminiService = new GeminiService();

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const result = await geminiService.generateChatResponse(prompt, {});
        return NextResponse.json({ response: result.response });

    } catch (error) {
        console.error('AI API Error:', error);
        return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
    }
}