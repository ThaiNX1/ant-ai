import { DeepgramSttAdapter } from './deepgram-stt.adapter';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';

describe('DeepgramSttAdapter', () => {
  const config: AdapterConfig = {
    provider: 'deepgram',
    model: 'nova-3',
    apiKey: 'test-key',
  };

  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        results: {
          channels: [
            {
              alternatives: [{ transcript: 'hello' }],
            },
          ],
        },
      }),
    });
    global.fetch = fetchMock;
  });

  it('sets Content-Type when a supported format is provided', async () => {
    const adapter = new DeepgramSttAdapter(config);

    await adapter.transcribeAudio(Buffer.from('audio'), { format: 'webm' });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'audio/webm',
        }),
      }),
    );
  });

  it('omits Content-Type when the format is unknown', async () => {
    const adapter = new DeepgramSttAdapter(config);

    await adapter.transcribeAudio(Buffer.from('audio'), { format: undefined });

    const init = fetchMock.mock.calls[0][1] as { headers: Record<string, string> };
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('sends the original audio buffer without conversion', async () => {
    const adapter = new DeepgramSttAdapter(config);
    const audio = Buffer.from('audio');

    await adapter.transcribeAudio(audio, { format: 'webm' });

    const init = fetchMock.mock.calls[0][1] as { body: Buffer };

    expect(init.body).toBe(audio);
  });

  it('sets language when a fixed language is provided', async () => {
    const adapter = new DeepgramSttAdapter(config);

    await adapter.transcribeAudio(Buffer.from('audio'), { language: 'vi' });

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.searchParams.get('language')).toBe('vi');
    expect(url.searchParams.get('detect_language')).toBeNull();
  });

  it('enables language detection when requested', async () => {
    const adapter = new DeepgramSttAdapter(config);

    await adapter.transcribeAudio(Buffer.from('audio'), {
      language: 'vi',
      detectLanguage: true,
    });

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.searchParams.get('detect_language')).toBe('true');
    expect(url.searchParams.get('language')).toBeNull();
  });

  it('restricts language detection to candidate languages when provided', async () => {
    const adapter = new DeepgramSttAdapter(config);

    await adapter.transcribeAudio(Buffer.from('audio'), {
      detectLanguage: true,
      detectLanguages: ['vi', 'en'],
    });

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.searchParams.getAll('detect_language')).toEqual(['vi', 'en']);
    expect(url.searchParams.get('language')).toBeNull();
  });

  it('returns transcript with detected language metadata when present', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        results: {
          channels: [
            {
              alternatives: [{ transcript: 'xin chao' }],
              detected_language: 'vi',
              language_confidence: 0.98,
            },
          ],
        },
      }),
    });
    const adapter = new DeepgramSttAdapter(config);

    const result = await adapter.transcribeAudio(Buffer.from('audio'));

    expect(result).toEqual({
      text: 'xin chao',
      detectedLanguage: 'vi',
      languageConfidence: 0.98,
    });
  });
});
