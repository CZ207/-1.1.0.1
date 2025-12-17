import { Message, Role } from '../types';

const API_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL_NAME = 'qwen-plus';

// Use the specific DashScope API key provided
const API_KEY = 'sk-43e1a31ca84d423fa8b3bab58e05732e';

export const sendMessageStream = async (
  messages: Message[],
  onChunk: (content: string) => void
): Promise<void> => {
  if (!API_KEY) {
    throw new Error('API Key is missing.');
  }

  // Filter out messages to only send role and content, stripping internal IDs
  const apiMessages = messages.map(({ role, content }) => ({ role, content }));

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Extract detailed error message from DashScope response if available
      const errorMessage = errorData.error?.message || errorData.message || `Status ${response.status}`;
      throw new Error(`API Error: ${errorMessage}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

        if (trimmedLine.startsWith('data: ')) {
          try {
            const jsonStr = trimmedLine.slice(6);
            const data = JSON.parse(jsonStr);
            
            // Compatible mode (OpenAI style) response structure
            const content = data.choices?.[0]?.delta?.content;
            
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            console.warn('Failed to parse stream line', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};