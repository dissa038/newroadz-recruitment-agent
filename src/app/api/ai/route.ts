import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const response = await generateText(prompt);
        return NextResponse.json({ response });

    } catch (error) {
        console.error('AI API Error:', error);
        return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
    }
}