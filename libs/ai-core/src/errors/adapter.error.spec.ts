import { AdapterError } from './adapter.error';

describe('AdapterError', () => {
  it('should contain code, message, and provider', () => {
    const error = new AdapterError('404', 'Not found', 'gemini');
    expect(error.code).toBe('404');
    expect(error.message).toBe('Not found');
    expect(error.provider).toBe('gemini');
    expect(error.name).toBe('AdapterError');
  });

  it('should be an instance of Error', () => {
    const error = new AdapterError('500', 'Server error', 'openai');
    expect(error).toBeInstanceOf(Error);
  });
});
