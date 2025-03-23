import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await fetch(`${process.env.NILLION_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NILLION_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.1-8B-Instruct',
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        stream: false
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API Error:', error);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({
      message: data.choices[0].message,
      signature: data.signature
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
