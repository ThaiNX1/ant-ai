export interface AdapterConfig {
  provider: string;
  model: string;
  apiKey: string;
}

export interface NamedAdapterConfig extends AdapterConfig {
  /** Unique name for this adapter instance, used as injection token suffix */
  name: string;
}

export interface AiCoreOptions {
  llm?: NamedAdapterConfig | NamedAdapterConfig[];
  tts?: NamedAdapterConfig | NamedAdapterConfig[];
  stt?: NamedAdapterConfig | NamedAdapterConfig[];
  realtime?: NamedAdapterConfig | NamedAdapterConfig[];
}
