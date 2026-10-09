/**
 * One completion from the translation model. `claude-*` models use the
 * Anthropic API (ANTHROPIC_API_KEY); any other model goes to an
 * OpenAI-compatible endpoint (TRANSLATE_BASE_URL, TRANSLATE_API_KEY), which
 * Gemini, DeepSeek and Qwen all offer, so models can be compared.
 */
import Anthropic from '@anthropic-ai/sdk';

let anthropic;

/**
 * @param {{ model: string, system: string, messages: { role: 'user' | 'assistant', content: string }[] }} request
 * @returns {Promise<{ text: string, usage: { input: number, output: number } }>}
 */
export async function complete(request) {
  return request.model.startsWith('claude-') ?
      completeAnthropic(request)
    : completeOpenAICompatible(request);
}

async function completeAnthropic({ model, system, messages }) {
  anthropic ??= new Anthropic();
  const message = await anthropic.messages
    .stream({
      model,
      max_tokens: 64000,
      // translation needs little reasoning; the system prompt repeats per file
      output_config: { effort: 'low' },
      system: [
        { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
      ],
      messages,
    })
    .finalMessage();
  if (message.stop_reason !== 'end_turn')
    throw new Error(`${model} stopped early: ${message.stop_reason}`);
  return {
    text: message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join(''),
    usage: {
      input:
        message.usage.input_tokens +
        (message.usage.cache_read_input_tokens ?? 0) +
        (message.usage.cache_creation_input_tokens ?? 0),
      output: message.usage.output_tokens,
    },
  };
}

async function completeOpenAICompatible({ model, system, messages }) {
  const baseURL = process.env.TRANSLATE_BASE_URL;
  if (!baseURL)
    throw new Error(
      `${model} needs TRANSLATE_BASE_URL (an OpenAI-compatible API)`,
    );
  const response = await fetch(
    `${baseURL.replace(/\/$/, '')}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.TRANSLATE_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    },
  );
  if (!response.ok)
    throw new Error(`${model}: ${response.status} ${await response.text()}`);
  const { choices, usage } = await response.json();
  if (choices[0].finish_reason !== 'stop')
    throw new Error(`${model} stopped early: ${choices[0].finish_reason}`);
  return {
    text: choices[0].message.content,
    usage: { input: usage.prompt_tokens, output: usage.completion_tokens },
  };
}
