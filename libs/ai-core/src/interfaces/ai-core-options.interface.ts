export interface AdapterConfig {
  provider: string;
  model: string;
  apiKey: string;
}

export interface AiCoreOptions {
  llm?: AdapterConfig;
  tts?: AdapterConfig;
  stt?: AdapterConfig;
  realtime?: AdapterConfig;
}
