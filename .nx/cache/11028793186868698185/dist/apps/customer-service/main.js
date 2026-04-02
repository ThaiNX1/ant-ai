/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("@nestjs/platform-fastify");

/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("nestjs-pino");

/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(7);
const nestjs_pino_1 = __webpack_require__(4);
const ai_core_1 = __webpack_require__(8);
const database_1 = __webpack_require__(36);
const common_2 = __webpack_require__(50);
const app_controller_1 = __webpack_require__(60);
const app_service_1 = __webpack_require__(61);
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: common_2.envConfigSchema,
            }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    transport: process.env['NODE_ENV'] !== 'production'
                        ? { target: 'pino-pretty', options: { colorize: true } }
                        : undefined,
                    level: process.env['LOG_LEVEL'] || 'info',
                    autoLogging: true,
                    serializers: {
                        req(req) {
                            return {
                                id: req['id'],
                                method: req['method'],
                                url: req['url'],
                            };
                        },
                        res(res) {
                            return {
                                statusCode: res['statusCode'],
                            };
                        },
                    },
                },
            }),
            ai_core_1.AiCoreModule.register({
                llm: {
                    provider: process.env['LLM_PROVIDER'] || 'gemini',
                    model: process.env['LLM_MODEL'] || 'gemini-2.0-flash',
                    apiKey: process.env['GEMINI_API_KEY'] || '',
                },
            }),
            database_1.DatabaseModule.register({
                host: process.env['DB_HOST'] || 'localhost',
                port: parseInt(process.env['DB_PORT'] || '5432', 10),
                username: process.env['DB_USERNAME'] || 'postgres',
                password: process.env['DB_PASSWORD'] || '',
                database: process.env['DB_DATABASE'] || 'customer_service',
            }),
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);


/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TextToVoiceService = exports.VoiceToVoiceService = exports.RealtimeVoiceService = exports.SttService = exports.TtsService = exports.LlmService = exports.OpenAiRealtimeAdapter = exports.OpenAiSttAdapter = exports.ElevenLabsTtsAdapter = exports.GeminiLlmAdapter = exports.AdapterFactory = exports.REALTIME_ADAPTER = exports.STT_ADAPTER = exports.TTS_ADAPTER = exports.LLM_ADAPTER = exports.AdapterError = exports.AiCoreModule = void 0;
// Module
var ai_core_module_1 = __webpack_require__(9);
Object.defineProperty(exports, "AiCoreModule", ({ enumerable: true, get: function () { return ai_core_module_1.AiCoreModule; } }));
// Errors
var errors_1 = __webpack_require__(32);
Object.defineProperty(exports, "AdapterError", ({ enumerable: true, get: function () { return errors_1.AdapterError; } }));
// Constants
var constants_1 = __webpack_require__(33);
Object.defineProperty(exports, "LLM_ADAPTER", ({ enumerable: true, get: function () { return constants_1.LLM_ADAPTER; } }));
Object.defineProperty(exports, "TTS_ADAPTER", ({ enumerable: true, get: function () { return constants_1.TTS_ADAPTER; } }));
Object.defineProperty(exports, "STT_ADAPTER", ({ enumerable: true, get: function () { return constants_1.STT_ADAPTER; } }));
Object.defineProperty(exports, "REALTIME_ADAPTER", ({ enumerable: true, get: function () { return constants_1.REALTIME_ADAPTER; } }));
// Adapters
var adapters_1 = __webpack_require__(34);
Object.defineProperty(exports, "AdapterFactory", ({ enumerable: true, get: function () { return adapters_1.AdapterFactory; } }));
Object.defineProperty(exports, "GeminiLlmAdapter", ({ enumerable: true, get: function () { return adapters_1.GeminiLlmAdapter; } }));
Object.defineProperty(exports, "ElevenLabsTtsAdapter", ({ enumerable: true, get: function () { return adapters_1.ElevenLabsTtsAdapter; } }));
Object.defineProperty(exports, "OpenAiSttAdapter", ({ enumerable: true, get: function () { return adapters_1.OpenAiSttAdapter; } }));
Object.defineProperty(exports, "OpenAiRealtimeAdapter", ({ enumerable: true, get: function () { return adapters_1.OpenAiRealtimeAdapter; } }));
// Services
var services_1 = __webpack_require__(35);
Object.defineProperty(exports, "LlmService", ({ enumerable: true, get: function () { return services_1.LlmService; } }));
Object.defineProperty(exports, "TtsService", ({ enumerable: true, get: function () { return services_1.TtsService; } }));
Object.defineProperty(exports, "SttService", ({ enumerable: true, get: function () { return services_1.SttService; } }));
Object.defineProperty(exports, "RealtimeVoiceService", ({ enumerable: true, get: function () { return services_1.RealtimeVoiceService; } }));
Object.defineProperty(exports, "VoiceToVoiceService", ({ enumerable: true, get: function () { return services_1.VoiceToVoiceService; } }));
Object.defineProperty(exports, "TextToVoiceService", ({ enumerable: true, get: function () { return services_1.TextToVoiceService; } }));


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var AiCoreModule_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AiCoreModule = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const injection_tokens_1 = __webpack_require__(10);
const adapter_factory_1 = __webpack_require__(11);
const llm_service_1 = __webpack_require__(22);
const tts_service_1 = __webpack_require__(24);
const stt_service_1 = __webpack_require__(26);
const realtime_voice_service_1 = __webpack_require__(28);
const voice_to_voice_service_1 = __webpack_require__(30);
const text_to_voice_service_1 = __webpack_require__(31);
let AiCoreModule = AiCoreModule_1 = class AiCoreModule {
    static register(options) {
        const providers = [];
        const exports = [];
        if (options.llm) {
            providers.push({
                provide: injection_tokens_1.LLM_ADAPTER,
                useFactory: () => adapter_factory_1.AdapterFactory.createLlm(options.llm),
            });
            providers.push(llm_service_1.LlmService);
            exports.push(injection_tokens_1.LLM_ADAPTER, llm_service_1.LlmService);
        }
        if (options.tts) {
            providers.push({
                provide: injection_tokens_1.TTS_ADAPTER,
                useFactory: () => adapter_factory_1.AdapterFactory.createTts(options.tts),
            });
            providers.push(tts_service_1.TtsService);
            exports.push(injection_tokens_1.TTS_ADAPTER, tts_service_1.TtsService);
        }
        if (options.stt) {
            providers.push({
                provide: injection_tokens_1.STT_ADAPTER,
                useFactory: () => adapter_factory_1.AdapterFactory.createStt(options.stt),
            });
            providers.push(stt_service_1.SttService);
            exports.push(injection_tokens_1.STT_ADAPTER, stt_service_1.SttService);
        }
        if (options.realtime) {
            providers.push({
                provide: injection_tokens_1.REALTIME_ADAPTER,
                useFactory: () => adapter_factory_1.AdapterFactory.createRealtime(options.realtime),
            });
            providers.push(realtime_voice_service_1.RealtimeVoiceService);
            exports.push(injection_tokens_1.REALTIME_ADAPTER, realtime_voice_service_1.RealtimeVoiceService);
        }
        // Pipeline: TextToVoiceService requires both LLM and TTS adapters
        if (options.llm && options.tts) {
            providers.push(text_to_voice_service_1.TextToVoiceService);
            exports.push(text_to_voice_service_1.TextToVoiceService);
        }
        // Pipeline: VoiceToVoiceService requires both Realtime and TTS adapters
        if (options.realtime && options.tts) {
            providers.push(voice_to_voice_service_1.VoiceToVoiceService);
            exports.push(voice_to_voice_service_1.VoiceToVoiceService);
        }
        return {
            module: AiCoreModule_1,
            providers,
            exports,
        };
    }
};
exports.AiCoreModule = AiCoreModule;
exports.AiCoreModule = AiCoreModule = AiCoreModule_1 = tslib_1.__decorate([
    (0, common_1.Module)({})
], AiCoreModule);


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.REALTIME_ADAPTER = exports.STT_ADAPTER = exports.TTS_ADAPTER = exports.LLM_ADAPTER = void 0;
exports.LLM_ADAPTER = Symbol('LLM_ADAPTER');
exports.TTS_ADAPTER = Symbol('TTS_ADAPTER');
exports.STT_ADAPTER = Symbol('STT_ADAPTER');
exports.REALTIME_ADAPTER = Symbol('REALTIME_ADAPTER');


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AdapterFactory = void 0;
const gemini_llm_adapter_1 = __webpack_require__(12);
const elevenlabs_tts_adapter_1 = __webpack_require__(15);
const openai_stt_adapter_1 = __webpack_require__(17);
const openai_realtime_adapter_1 = __webpack_require__(20);
class AdapterFactory {
    static createLlm(config) {
        switch (config.provider) {
            case 'gemini':
                return new gemini_llm_adapter_1.GeminiLlmAdapter(config);
            default:
                throw new Error(`Unknown LLM provider: ${config.provider}`);
        }
    }
    static createTts(config) {
        switch (config.provider) {
            case 'elevenlabs':
                return new elevenlabs_tts_adapter_1.ElevenLabsTtsAdapter(config);
            default:
                throw new Error(`Unknown TTS provider: ${config.provider}`);
        }
    }
    static createStt(config) {
        switch (config.provider) {
            case 'openai':
                return new openai_stt_adapter_1.OpenAiSttAdapter(config);
            default:
                throw new Error(`Unknown STT provider: ${config.provider}`);
        }
    }
    static createRealtime(config) {
        switch (config.provider) {
            case 'openai':
                return new openai_realtime_adapter_1.OpenAiRealtimeAdapter(config);
            default:
                throw new Error(`Unknown Realtime provider: ${config.provider}`);
        }
    }
}
exports.AdapterFactory = AdapterFactory;


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GeminiLlmAdapter = void 0;
const generative_ai_1 = __webpack_require__(13);
const adapter_error_1 = __webpack_require__(14);
/**
 * Gemini LLM Adapter — uses @google/generative-ai SDK.
 */
class GeminiLlmAdapter {
    constructor(config) {
        this.config = config;
        this.client = new generative_ai_1.GoogleGenerativeAI(config.apiKey);
        this.model = this.client.getGenerativeModel({ model: config.model });
    }
    async generate(prompt, options) {
        try {
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: options?.temperature,
                    maxOutputTokens: options?.maxTokens,
                    topP: options?.topP,
                    stopSequences: options?.stopSequences,
                },
            });
            return result.response.text();
        }
        catch (error) {
            throw this.wrapError(error);
        }
    }
    async *generateStream(prompt, options) {
        try {
            const result = await this.model.generateContentStream({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: options?.temperature,
                    maxOutputTokens: options?.maxTokens,
                    topP: options?.topP,
                    stopSequences: options?.stopSequences,
                },
            });
            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                    yield text;
                }
            }
        }
        catch (error) {
            throw this.wrapError(error);
        }
    }
    wrapError(error) {
        const message = error instanceof Error ? error.message : 'Unknown Gemini error';
        const code = error?.status?.toString() ?? 'GEMINI_ERROR';
        return new adapter_error_1.AdapterError(code, message, 'gemini');
    }
}
exports.GeminiLlmAdapter = GeminiLlmAdapter;


/***/ }),
/* 13 */
/***/ ((module) => {

module.exports = require("@google/generative-ai");

/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AdapterError = void 0;
/**
 * Structured error class for AI adapter failures.
 * Contains error code, message, and provider name for traceability.
 */
class AdapterError extends Error {
    constructor(code, message, provider) {
        super(message);
        this.name = 'AdapterError';
        this.code = code;
        this.provider = provider;
    }
}
exports.AdapterError = AdapterError;


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ElevenLabsTtsAdapter = void 0;
const elevenlabs_1 = __webpack_require__(16);
const adapter_error_1 = __webpack_require__(14);
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel
/**
 * ElevenLabs TTS Adapter — uses the elevenlabs SDK.
 */
class ElevenLabsTtsAdapter {
    constructor(config) {
        this.config = config;
        this.client = new elevenlabs_1.ElevenLabsClient({ apiKey: config.apiKey });
    }
    async synthesize(text, options) {
        try {
            const voiceId = options?.voiceId ?? DEFAULT_VOICE_ID;
            const audioStream = await this.client.textToSpeech.convert(voiceId, {
                text,
                model_id: this.config.model,
                output_format: options?.format ?? 'mp3_44100_128',
            });
            return await this.streamToBuffer(audioStream);
        }
        catch (error) {
            throw this.wrapError(error);
        }
    }
    async *streamSynthesize(text, options) {
        try {
            const voiceId = options?.voiceId ?? DEFAULT_VOICE_ID;
            const audioStream = await this.client.textToSpeech.convertAsStream(voiceId, {
                text,
                model_id: this.config.model,
                output_format: options?.format ?? 'mp3_44100_128',
            });
            for await (const chunk of audioStream) {
                yield Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            }
        }
        catch (error) {
            throw this.wrapError(error);
        }
    }
    async streamToBuffer(stream) {
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }
    wrapError(error) {
        const message = error instanceof Error ? error.message : 'Unknown ElevenLabs error';
        const code = error?.statusCode?.toString() ??
            'ELEVENLABS_ERROR';
        return new adapter_error_1.AdapterError(code, message, 'elevenlabs');
    }
}
exports.ElevenLabsTtsAdapter = ElevenLabsTtsAdapter;


/***/ }),
/* 16 */
/***/ ((module) => {

module.exports = require("elevenlabs");

/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OpenAiSttAdapter = void 0;
const openai_1 = __webpack_require__(18);
const buffer_1 = __webpack_require__(19);
const adapter_error_1 = __webpack_require__(14);
/**
 * OpenAI STT Adapter — uses the openai SDK (Whisper).
 */
class OpenAiSttAdapter {
    constructor(config) {
        this.config = config;
        this.client = new openai_1.OpenAI({ apiKey: config.apiKey });
    }
    async transcribeAudio(audio, options) {
        try {
            const file = new buffer_1.File([audio], 'audio.wav', { type: 'audio/wav' });
            const transcription = await this.client.audio.transcriptions.create({
                file,
                model: this.config.model || 'whisper-1',
                language: options?.language,
                response_format: 'text',
            });
            return transcription;
        }
        catch (error) {
            throw this.wrapError(error);
        }
    }
    wrapError(error) {
        const message = error instanceof Error ? error.message : 'Unknown OpenAI STT error';
        const code = error?.status?.toString() ?? 'OPENAI_STT_ERROR';
        return new adapter_error_1.AdapterError(code, message, 'openai');
    }
}
exports.OpenAiSttAdapter = OpenAiSttAdapter;


/***/ }),
/* 18 */
/***/ ((module) => {

module.exports = require("openai");

/***/ }),
/* 19 */
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OpenAiRealtimeAdapter = void 0;
const WebSocket = __webpack_require__(21);
const adapter_error_1 = __webpack_require__(14);
const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime';
/**
 * OpenAI Realtime Adapter — uses ws WebSocket to connect to OpenAI Realtime API.
 */
class OpenAiRealtimeAdapter {
    constructor(config) {
        this.config = config;
        this.ws = null;
        this.responseQueue = [];
        this.waitResolve = null;
        this.closed = false;
    }
    async connect(sessionConfig) {
        const model = sessionConfig.model ?? this.config.model;
        const url = `${OPENAI_REALTIME_URL}?model=${encodeURIComponent(model)}`;
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(url, {
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                    'OpenAI-Beta': 'realtime=v1',
                },
            });
            this.ws.on('open', () => {
                // Send session.update with config
                const sessionUpdate = {
                    type: 'session.update',
                    session: {
                        voice: sessionConfig.voice,
                        instructions: sessionConfig.instructions,
                    },
                };
                this.ws.send(JSON.stringify(sessionUpdate));
                resolve();
            });
            this.ws.on('message', (data) => {
                try {
                    const parsed = JSON.parse(data.toString());
                    this.responseQueue.push({
                        type: parsed.type ?? 'unknown',
                        data: parsed,
                    });
                    if (this.waitResolve) {
                        this.waitResolve();
                        this.waitResolve = null;
                    }
                }
                catch {
                    // ignore non-JSON messages
                }
            });
            this.ws.on('close', () => {
                this.closed = true;
                if (this.waitResolve) {
                    this.waitResolve();
                    this.waitResolve = null;
                }
            });
            this.ws.on('error', (err) => {
                const adapterErr = this.wrapError(err);
                reject(adapterErr);
            });
        });
    }
    feedAudio(audioChunk) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new adapter_error_1.AdapterError('WS_NOT_CONNECTED', 'WebSocket is not connected', 'openai');
        }
        const event = {
            type: 'input_audio_buffer.append',
            audio: audioChunk.toString('base64'),
        };
        this.ws.send(JSON.stringify(event));
    }
    async *getResponseStream() {
        while (!this.closed || this.responseQueue.length > 0) {
            if (this.responseQueue.length > 0) {
                yield this.responseQueue.shift();
            }
            else {
                await new Promise((resolve) => {
                    this.waitResolve = resolve;
                });
            }
        }
    }
    async disconnect() {
        if (this.ws) {
            this.closed = true;
            this.ws.close();
            this.ws = null;
        }
    }
    wrapError(error) {
        const message = error instanceof Error
            ? error.message
            : 'Unknown OpenAI Realtime error';
        const code = error?.code ?? 'OPENAI_REALTIME_ERROR';
        return new adapter_error_1.AdapterError(code, message, 'openai');
    }
}
exports.OpenAiRealtimeAdapter = OpenAiRealtimeAdapter;


/***/ }),
/* 21 */
/***/ ((module) => {

module.exports = require("ws");

/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LlmService = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const injection_tokens_1 = __webpack_require__(10);
const llm_interface_1 = __webpack_require__(23);
let LlmService = class LlmService {
    constructor(llmAdapter) {
        this.llmAdapter = llmAdapter;
    }
    async generate(prompt, options) {
        return this.llmAdapter.generate(prompt, options);
    }
    generateStream(prompt, options) {
        return this.llmAdapter.generateStream(prompt, options);
    }
};
exports.LlmService = LlmService;
exports.LlmService = LlmService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(injection_tokens_1.LLM_ADAPTER)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof llm_interface_1.ILlmAdapter !== "undefined" && llm_interface_1.ILlmAdapter) === "function" ? _a : Object])
], LlmService);


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TtsService = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const injection_tokens_1 = __webpack_require__(10);
const tts_interface_1 = __webpack_require__(25);
let TtsService = class TtsService {
    constructor(ttsAdapter) {
        this.ttsAdapter = ttsAdapter;
    }
    async synthesize(text, options) {
        return this.ttsAdapter.synthesize(text, options);
    }
    streamSynthesize(text, options) {
        return this.ttsAdapter.streamSynthesize(text, options);
    }
};
exports.TtsService = TtsService;
exports.TtsService = TtsService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(injection_tokens_1.TTS_ADAPTER)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof tts_interface_1.ITtsAdapter !== "undefined" && tts_interface_1.ITtsAdapter) === "function" ? _a : Object])
], TtsService);


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SttService = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const injection_tokens_1 = __webpack_require__(10);
const stt_interface_1 = __webpack_require__(27);
let SttService = class SttService {
    constructor(sttAdapter) {
        this.sttAdapter = sttAdapter;
    }
    async transcribeAudio(audio, options) {
        return this.sttAdapter.transcribeAudio(audio, options);
    }
};
exports.SttService = SttService;
exports.SttService = SttService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(injection_tokens_1.STT_ADAPTER)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof stt_interface_1.ISttAdapter !== "undefined" && stt_interface_1.ISttAdapter) === "function" ? _a : Object])
], SttService);


/***/ }),
/* 27 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),
/* 28 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RealtimeVoiceService = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const injection_tokens_1 = __webpack_require__(10);
const realtime_interface_1 = __webpack_require__(29);
let RealtimeVoiceService = class RealtimeVoiceService {
    constructor(realtimeAdapter) {
        this.realtimeAdapter = realtimeAdapter;
    }
    async connect(sessionConfig) {
        return this.realtimeAdapter.connect(sessionConfig);
    }
    feedAudio(audioChunk) {
        this.realtimeAdapter.feedAudio(audioChunk);
    }
    getResponseStream() {
        return this.realtimeAdapter.getResponseStream();
    }
    async disconnect() {
        return this.realtimeAdapter.disconnect();
    }
};
exports.RealtimeVoiceService = RealtimeVoiceService;
exports.RealtimeVoiceService = RealtimeVoiceService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(injection_tokens_1.REALTIME_ADAPTER)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof realtime_interface_1.IRealtimeAdapter !== "undefined" && realtime_interface_1.IRealtimeAdapter) === "function" ? _a : Object])
], RealtimeVoiceService);


/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),
/* 30 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VoiceToVoiceService = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const injection_tokens_1 = __webpack_require__(10);
const realtime_interface_1 = __webpack_require__(29);
const tts_interface_1 = __webpack_require__(25);
let VoiceToVoiceService = class VoiceToVoiceService {
    constructor(realtimeAdapter, ttsAdapter) {
        this.realtimeAdapter = realtimeAdapter;
        this.ttsAdapter = ttsAdapter;
    }
    async connect(sessionConfig) {
        return this.realtimeAdapter.connect(sessionConfig);
    }
    feedAudio(audioChunk) {
        this.realtimeAdapter.feedAudio(audioChunk);
    }
    getResponseStream() {
        return this.realtimeAdapter.getResponseStream();
    }
    async disconnect() {
        return this.realtimeAdapter.disconnect();
    }
    async *processVoicePipeline(audioChunk, ttsOptions) {
        this.realtimeAdapter.feedAudio(audioChunk);
        for await (const response of this.realtimeAdapter.getResponseStream()) {
            if (response.type === 'transcript' && typeof response.data === 'string') {
                yield* this.ttsAdapter.streamSynthesize(response.data, ttsOptions);
            }
        }
    }
};
exports.VoiceToVoiceService = VoiceToVoiceService;
exports.VoiceToVoiceService = VoiceToVoiceService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(injection_tokens_1.REALTIME_ADAPTER)),
    tslib_1.__param(1, (0, common_1.Inject)(injection_tokens_1.TTS_ADAPTER)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof realtime_interface_1.IRealtimeAdapter !== "undefined" && realtime_interface_1.IRealtimeAdapter) === "function" ? _a : Object, typeof (_b = typeof tts_interface_1.ITtsAdapter !== "undefined" && tts_interface_1.ITtsAdapter) === "function" ? _b : Object])
], VoiceToVoiceService);


/***/ }),
/* 31 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TextToVoiceService = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const injection_tokens_1 = __webpack_require__(10);
const llm_interface_1 = __webpack_require__(23);
const tts_interface_1 = __webpack_require__(25);
let TextToVoiceService = class TextToVoiceService {
    constructor(llmAdapter, ttsAdapter) {
        this.llmAdapter = llmAdapter;
        this.ttsAdapter = ttsAdapter;
    }
    async generateAndSynthesize(prompt, llmOptions, ttsOptions) {
        const text = await this.llmAdapter.generate(prompt, llmOptions);
        return this.ttsAdapter.synthesize(text, ttsOptions);
    }
    async *generateAndStreamSynthesize(prompt, llmOptions, ttsOptions) {
        const text = await this.llmAdapter.generate(prompt, llmOptions);
        yield* this.ttsAdapter.streamSynthesize(text, ttsOptions);
    }
    async *streamGenerateAndSynthesize(prompt, llmOptions, ttsOptions) {
        for await (const chunk of this.llmAdapter.generateStream(prompt, llmOptions)) {
            yield* this.ttsAdapter.streamSynthesize(chunk, ttsOptions);
        }
    }
};
exports.TextToVoiceService = TextToVoiceService;
exports.TextToVoiceService = TextToVoiceService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(injection_tokens_1.LLM_ADAPTER)),
    tslib_1.__param(1, (0, common_1.Inject)(injection_tokens_1.TTS_ADAPTER)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof llm_interface_1.ILlmAdapter !== "undefined" && llm_interface_1.ILlmAdapter) === "function" ? _a : Object, typeof (_b = typeof tts_interface_1.ITtsAdapter !== "undefined" && tts_interface_1.ITtsAdapter) === "function" ? _b : Object])
], TextToVoiceService);


/***/ }),
/* 32 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AdapterError = void 0;
var adapter_error_1 = __webpack_require__(14);
Object.defineProperty(exports, "AdapterError", ({ enumerable: true, get: function () { return adapter_error_1.AdapterError; } }));


/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.REALTIME_ADAPTER = exports.STT_ADAPTER = exports.TTS_ADAPTER = exports.LLM_ADAPTER = void 0;
var injection_tokens_1 = __webpack_require__(10);
Object.defineProperty(exports, "LLM_ADAPTER", ({ enumerable: true, get: function () { return injection_tokens_1.LLM_ADAPTER; } }));
Object.defineProperty(exports, "TTS_ADAPTER", ({ enumerable: true, get: function () { return injection_tokens_1.TTS_ADAPTER; } }));
Object.defineProperty(exports, "STT_ADAPTER", ({ enumerable: true, get: function () { return injection_tokens_1.STT_ADAPTER; } }));
Object.defineProperty(exports, "REALTIME_ADAPTER", ({ enumerable: true, get: function () { return injection_tokens_1.REALTIME_ADAPTER; } }));


/***/ }),
/* 34 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OpenAiRealtimeAdapter = exports.OpenAiSttAdapter = exports.ElevenLabsTtsAdapter = exports.GeminiLlmAdapter = exports.AdapterFactory = void 0;
var adapter_factory_1 = __webpack_require__(11);
Object.defineProperty(exports, "AdapterFactory", ({ enumerable: true, get: function () { return adapter_factory_1.AdapterFactory; } }));
var gemini_llm_adapter_1 = __webpack_require__(12);
Object.defineProperty(exports, "GeminiLlmAdapter", ({ enumerable: true, get: function () { return gemini_llm_adapter_1.GeminiLlmAdapter; } }));
var elevenlabs_tts_adapter_1 = __webpack_require__(15);
Object.defineProperty(exports, "ElevenLabsTtsAdapter", ({ enumerable: true, get: function () { return elevenlabs_tts_adapter_1.ElevenLabsTtsAdapter; } }));
var openai_stt_adapter_1 = __webpack_require__(17);
Object.defineProperty(exports, "OpenAiSttAdapter", ({ enumerable: true, get: function () { return openai_stt_adapter_1.OpenAiSttAdapter; } }));
var openai_realtime_adapter_1 = __webpack_require__(20);
Object.defineProperty(exports, "OpenAiRealtimeAdapter", ({ enumerable: true, get: function () { return openai_realtime_adapter_1.OpenAiRealtimeAdapter; } }));


/***/ }),
/* 35 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TextToVoiceService = exports.VoiceToVoiceService = exports.RealtimeVoiceService = exports.SttService = exports.TtsService = exports.LlmService = void 0;
var llm_service_1 = __webpack_require__(22);
Object.defineProperty(exports, "LlmService", ({ enumerable: true, get: function () { return llm_service_1.LlmService; } }));
var tts_service_1 = __webpack_require__(24);
Object.defineProperty(exports, "TtsService", ({ enumerable: true, get: function () { return tts_service_1.TtsService; } }));
var stt_service_1 = __webpack_require__(26);
Object.defineProperty(exports, "SttService", ({ enumerable: true, get: function () { return stt_service_1.SttService; } }));
var realtime_voice_service_1 = __webpack_require__(28);
Object.defineProperty(exports, "RealtimeVoiceService", ({ enumerable: true, get: function () { return realtime_voice_service_1.RealtimeVoiceService; } }));
var voice_to_voice_service_1 = __webpack_require__(30);
Object.defineProperty(exports, "VoiceToVoiceService", ({ enumerable: true, get: function () { return voice_to_voice_service_1.VoiceToVoiceService; } }));
var text_to_voice_service_1 = __webpack_require__(31);
Object.defineProperty(exports, "TextToVoiceService", ({ enumerable: true, get: function () { return text_to_voice_service_1.TextToVoiceService; } }));


/***/ }),
/* 36 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseOptions = exports.CompanionSessionRepository = exports.LearningSessionRepository = exports.LessonRepository = exports.StudentRepository = exports.CompanionSession = exports.LearningSession = exports.Lesson = exports.Student = exports.DatabaseService = exports.DatabaseModule = void 0;
// Module
var database_module_1 = __webpack_require__(37);
Object.defineProperty(exports, "DatabaseModule", ({ enumerable: true, get: function () { return database_module_1.DatabaseModule; } }));
// Service
var database_service_1 = __webpack_require__(48);
Object.defineProperty(exports, "DatabaseService", ({ enumerable: true, get: function () { return database_service_1.DatabaseService; } }));
// Entities
var student_entity_1 = __webpack_require__(39);
Object.defineProperty(exports, "Student", ({ enumerable: true, get: function () { return student_entity_1.Student; } }));
var lesson_entity_1 = __webpack_require__(42);
Object.defineProperty(exports, "Lesson", ({ enumerable: true, get: function () { return lesson_entity_1.Lesson; } }));
var learning_session_entity_1 = __webpack_require__(41);
Object.defineProperty(exports, "LearningSession", ({ enumerable: true, get: function () { return learning_session_entity_1.LearningSession; } }));
var companion_session_entity_1 = __webpack_require__(43);
Object.defineProperty(exports, "CompanionSession", ({ enumerable: true, get: function () { return companion_session_entity_1.CompanionSession; } }));
// Repositories
var student_repository_1 = __webpack_require__(44);
Object.defineProperty(exports, "StudentRepository", ({ enumerable: true, get: function () { return student_repository_1.StudentRepository; } }));
var lesson_repository_1 = __webpack_require__(45);
Object.defineProperty(exports, "LessonRepository", ({ enumerable: true, get: function () { return lesson_repository_1.LessonRepository; } }));
var learning_session_repository_1 = __webpack_require__(46);
Object.defineProperty(exports, "LearningSessionRepository", ({ enumerable: true, get: function () { return learning_session_repository_1.LearningSessionRepository; } }));
var companion_session_repository_1 = __webpack_require__(47);
Object.defineProperty(exports, "CompanionSessionRepository", ({ enumerable: true, get: function () { return companion_session_repository_1.CompanionSessionRepository; } }));
// Interfaces
var database_options_interface_1 = __webpack_require__(49);
Object.defineProperty(exports, "DatabaseOptions", ({ enumerable: true, get: function () { return database_options_interface_1.DatabaseOptions; } }));


/***/ }),
/* 37 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var DatabaseModule_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseModule = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const typeorm_1 = __webpack_require__(38);
const student_entity_1 = __webpack_require__(39);
const lesson_entity_1 = __webpack_require__(42);
const learning_session_entity_1 = __webpack_require__(41);
const companion_session_entity_1 = __webpack_require__(43);
const student_repository_1 = __webpack_require__(44);
const lesson_repository_1 = __webpack_require__(45);
const learning_session_repository_1 = __webpack_require__(46);
const companion_session_repository_1 = __webpack_require__(47);
const database_service_1 = __webpack_require__(48);
const entities = [student_entity_1.Student, lesson_entity_1.Lesson, learning_session_entity_1.LearningSession, companion_session_entity_1.CompanionSession];
let DatabaseModule = DatabaseModule_1 = class DatabaseModule {
    static register(options) {
        return {
            module: DatabaseModule_1,
            imports: [
                typeorm_1.TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: options.host,
                    port: options.port,
                    username: options.username,
                    password: options.password,
                    database: options.database,
                    entities,
                    synchronize: false,
                }),
                typeorm_1.TypeOrmModule.forFeature(entities),
            ],
            providers: [
                database_service_1.DatabaseService,
                student_repository_1.StudentRepository,
                lesson_repository_1.LessonRepository,
                learning_session_repository_1.LearningSessionRepository,
                companion_session_repository_1.CompanionSessionRepository,
            ],
            exports: [
                database_service_1.DatabaseService,
                student_repository_1.StudentRepository,
                lesson_repository_1.LessonRepository,
                learning_session_repository_1.LearningSessionRepository,
                companion_session_repository_1.CompanionSessionRepository,
            ],
        };
    }
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = DatabaseModule_1 = tslib_1.__decorate([
    (0, common_1.Module)({})
], DatabaseModule);


/***/ }),
/* 38 */
/***/ ((module) => {

module.exports = require("@nestjs/typeorm");

/***/ }),
/* 39 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Student = void 0;
const tslib_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(40);
const learning_session_entity_1 = __webpack_require__(41);
const companion_session_entity_1 = __webpack_require__(43);
let Student = class Student {
};
exports.Student = Student;
tslib_1.__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    tslib_1.__metadata("design:type", String)
], Student.prototype, "id", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", String)
], Student.prototype, "name", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    tslib_1.__metadata("design:type", String)
], Student.prototype, "ssrc", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", String)
], Student.prototype, "accountId", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", String)
], Student.prototype, "deviceId", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    tslib_1.__metadata("design:type", Object)
], Student.prototype, "profile", void 0);
tslib_1.__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    tslib_1.__metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Student.prototype, "createdAt", void 0);
tslib_1.__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    tslib_1.__metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Student.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToMany)(() => learning_session_entity_1.LearningSession, (s) => s.student),
    tslib_1.__metadata("design:type", Array)
], Student.prototype, "learningSessions", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToMany)(() => companion_session_entity_1.CompanionSession, (s) => s.student),
    tslib_1.__metadata("design:type", Array)
], Student.prototype, "companionSessions", void 0);
exports.Student = Student = tslib_1.__decorate([
    (0, typeorm_1.Entity)('students')
], Student);


/***/ }),
/* 40 */
/***/ ((module) => {

module.exports = require("typeorm");

/***/ }),
/* 41 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LearningSession = void 0;
const tslib_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(40);
const student_entity_1 = __webpack_require__(39);
const lesson_entity_1 = __webpack_require__(42);
let LearningSession = class LearningSession {
};
exports.LearningSession = LearningSession;
tslib_1.__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    tslib_1.__metadata("design:type", String)
], LearningSession.prototype, "id", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, (s) => s.learningSessions),
    tslib_1.__metadata("design:type", typeof (_a = typeof student_entity_1.Student !== "undefined" && student_entity_1.Student) === "function" ? _a : Object)
], LearningSession.prototype, "student", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", String)
], LearningSession.prototype, "studentId", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => lesson_entity_1.Lesson, (l) => l.learningSessions),
    tslib_1.__metadata("design:type", typeof (_b = typeof lesson_entity_1.Lesson !== "undefined" && lesson_entity_1.Lesson) === "function" ? _b : Object)
], LearningSession.prototype, "lesson", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", String)
], LearningSession.prototype, "lessonId", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ default: 'active' }),
    tslib_1.__metadata("design:type", String)
], LearningSession.prototype, "status", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    tslib_1.__metadata("design:type", Object)
], LearningSession.prototype, "stateData", void 0);
tslib_1.__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    tslib_1.__metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], LearningSession.prototype, "startedAt", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    tslib_1.__metadata("design:type", Object)
], LearningSession.prototype, "endedAt", void 0);
exports.LearningSession = LearningSession = tslib_1.__decorate([
    (0, typeorm_1.Entity)('learning_sessions')
], LearningSession);


/***/ }),
/* 42 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Lesson = void 0;
const tslib_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(40);
const learning_session_entity_1 = __webpack_require__(41);
let Lesson = class Lesson {
};
exports.Lesson = Lesson;
tslib_1.__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    tslib_1.__metadata("design:type", String)
], Lesson.prototype, "id", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", String)
], Lesson.prototype, "title", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", String)
], Lesson.prototype, "type", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    tslib_1.__metadata("design:type", typeof (_a = typeof Record !== "undefined" && Record) === "function" ? _a : Object)
], Lesson.prototype, "content", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    tslib_1.__metadata("design:type", Object)
], Lesson.prototype, "metadata", void 0);
tslib_1.__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    tslib_1.__metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Lesson.prototype, "createdAt", void 0);
tslib_1.__decorate([
    (0, typeorm_1.OneToMany)(() => learning_session_entity_1.LearningSession, (s) => s.lesson),
    tslib_1.__metadata("design:type", Array)
], Lesson.prototype, "learningSessions", void 0);
exports.Lesson = Lesson = tslib_1.__decorate([
    (0, typeorm_1.Entity)('lessons')
], Lesson);


/***/ }),
/* 43 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CompanionSession = void 0;
const tslib_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(40);
const student_entity_1 = __webpack_require__(39);
let CompanionSession = class CompanionSession {
};
exports.CompanionSession = CompanionSession;
tslib_1.__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    tslib_1.__metadata("design:type", String)
], CompanionSession.prototype, "id", void 0);
tslib_1.__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, (s) => s.companionSessions),
    tslib_1.__metadata("design:type", typeof (_a = typeof student_entity_1.Student !== "undefined" && student_entity_1.Student) === "function" ? _a : Object)
], CompanionSession.prototype, "student", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", String)
], CompanionSession.prototype, "studentId", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", String)
], CompanionSession.prototype, "mode", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    tslib_1.__metadata("design:type", Object)
], CompanionSession.prototype, "conversationHistory", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    tslib_1.__metadata("design:type", Object)
], CompanionSession.prototype, "stateData", void 0);
tslib_1.__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    tslib_1.__metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], CompanionSession.prototype, "startedAt", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    tslib_1.__metadata("design:type", Object)
], CompanionSession.prototype, "endedAt", void 0);
exports.CompanionSession = CompanionSession = tslib_1.__decorate([
    (0, typeorm_1.Entity)('companion_sessions')
], CompanionSession);


/***/ }),
/* 44 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StudentRepository = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const typeorm_1 = __webpack_require__(38);
const typeorm_2 = __webpack_require__(40);
const student_entity_1 = __webpack_require__(39);
let StudentRepository = class StudentRepository {
    constructor(repo) {
        this.repo = repo;
    }
    async findById(id) {
        return this.repo.findOne({ where: { id } });
    }
    async findBySsrc(ssrc) {
        return this.repo.findOne({ where: { ssrc } });
    }
    async findAll() {
        return this.repo.find();
    }
    async create(data) {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findById(id);
    }
    async delete(id) {
        await this.repo.delete(id);
    }
};
exports.StudentRepository = StudentRepository;
exports.StudentRepository = StudentRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], StudentRepository);


/***/ }),
/* 45 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LessonRepository = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const typeorm_1 = __webpack_require__(38);
const typeorm_2 = __webpack_require__(40);
const lesson_entity_1 = __webpack_require__(42);
let LessonRepository = class LessonRepository {
    constructor(repo) {
        this.repo = repo;
    }
    async findById(id) {
        return this.repo.findOne({ where: { id } });
    }
    async findByType(type) {
        return this.repo.find({ where: { type } });
    }
    async findAll() {
        return this.repo.find();
    }
    async create(data) {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findById(id);
    }
    async delete(id) {
        await this.repo.delete(id);
    }
};
exports.LessonRepository = LessonRepository;
exports.LessonRepository = LessonRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, typeorm_1.InjectRepository)(lesson_entity_1.Lesson)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], LessonRepository);


/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LearningSessionRepository = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const typeorm_1 = __webpack_require__(38);
const typeorm_2 = __webpack_require__(40);
const learning_session_entity_1 = __webpack_require__(41);
let LearningSessionRepository = class LearningSessionRepository {
    constructor(repo) {
        this.repo = repo;
    }
    async findById(id) {
        return this.repo.findOne({ where: { id } });
    }
    async findByStudentId(studentId) {
        return this.repo.find({ where: { studentId } });
    }
    async findByLessonId(lessonId) {
        return this.repo.find({ where: { lessonId } });
    }
    async findActive(studentId) {
        return this.repo.findOne({
            where: { studentId, status: 'active' },
        });
    }
    async findAll() {
        return this.repo.find();
    }
    async create(data) {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findById(id);
    }
    async delete(id) {
        await this.repo.delete(id);
    }
};
exports.LearningSessionRepository = LearningSessionRepository;
exports.LearningSessionRepository = LearningSessionRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, typeorm_1.InjectRepository)(learning_session_entity_1.LearningSession)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], LearningSessionRepository);


/***/ }),
/* 47 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CompanionSessionRepository = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const typeorm_1 = __webpack_require__(38);
const typeorm_2 = __webpack_require__(40);
const companion_session_entity_1 = __webpack_require__(43);
let CompanionSessionRepository = class CompanionSessionRepository {
    constructor(repo) {
        this.repo = repo;
    }
    async findById(id) {
        return this.repo.findOne({ where: { id } });
    }
    async findByStudentId(studentId) {
        return this.repo.find({ where: { studentId } });
    }
    async findActive(studentId) {
        return this.repo.findOne({
            where: { studentId, endedAt: undefined },
        });
    }
    async findAll() {
        return this.repo.find();
    }
    async create(data) {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findById(id);
    }
    async delete(id) {
        await this.repo.delete(id);
    }
};
exports.CompanionSessionRepository = CompanionSessionRepository;
exports.CompanionSessionRepository = CompanionSessionRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, typeorm_1.InjectRepository)(companion_session_entity_1.CompanionSession)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], CompanionSessionRepository);


/***/ }),
/* 48 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseService = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const student_repository_1 = __webpack_require__(44);
const lesson_repository_1 = __webpack_require__(45);
const learning_session_repository_1 = __webpack_require__(46);
const companion_session_repository_1 = __webpack_require__(47);
let DatabaseService = class DatabaseService {
    constructor(studentRepo, lessonRepo, learningSessionRepo, companionSessionRepo) {
        this.studentRepo = studentRepo;
        this.lessonRepo = lessonRepo;
        this.learningSessionRepo = learningSessionRepo;
        this.companionSessionRepo = companionSessionRepo;
    }
    // --- Student CRUD ---
    async createStudent(data) {
        return this.studentRepo.create(data);
    }
    async getStudentById(id) {
        return this.studentRepo.findById(id);
    }
    async getStudentBySsrc(ssrc) {
        return this.studentRepo.findBySsrc(ssrc);
    }
    async updateStudent(id, data) {
        return this.studentRepo.update(id, data);
    }
    async deleteStudent(id) {
        return this.studentRepo.delete(id);
    }
    // --- Lesson CRUD ---
    async createLesson(data) {
        return this.lessonRepo.create(data);
    }
    async getLessonById(id) {
        return this.lessonRepo.findById(id);
    }
    async getLessonsByType(type) {
        return this.lessonRepo.findByType(type);
    }
    async updateLesson(id, data) {
        return this.lessonRepo.update(id, data);
    }
    async deleteLesson(id) {
        return this.lessonRepo.delete(id);
    }
    // --- LearningSession CRUD ---
    async createLearningSession(data) {
        return this.learningSessionRepo.create(data);
    }
    async getLearningSessionById(id) {
        return this.learningSessionRepo.findById(id);
    }
    async getActiveLearningSession(studentId) {
        return this.learningSessionRepo.findActive(studentId);
    }
    async updateLearningSession(id, data) {
        return this.learningSessionRepo.update(id, data);
    }
    async deleteLearningSession(id) {
        return this.learningSessionRepo.delete(id);
    }
    // --- CompanionSession CRUD ---
    async createCompanionSession(data) {
        return this.companionSessionRepo.create(data);
    }
    async getCompanionSessionById(id) {
        return this.companionSessionRepo.findById(id);
    }
    async getActiveCompanionSession(studentId) {
        return this.companionSessionRepo.findActive(studentId);
    }
    async updateCompanionSession(id, data) {
        return this.companionSessionRepo.update(id, data);
    }
    async deleteCompanionSession(id) {
        return this.companionSessionRepo.delete(id);
    }
    // --- Bundle / Ensure operations ---
    async ensureStudent(data) {
        if (data.ssrc) {
            const existing = await this.studentRepo.findBySsrc(data.ssrc);
            if (existing) {
                return existing;
            }
        }
        return this.studentRepo.create(data);
    }
    async loadLessonBundle(lessonId) {
        const lesson = await this.lessonRepo.findById(lessonId);
        if (!lesson) {
            return null;
        }
        const sessions = await this.learningSessionRepo.findByLessonId(lessonId);
        return { lesson, sessions };
    }
    async loadStudentBundle(studentId) {
        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            return null;
        }
        const learningSessions = await this.learningSessionRepo.findByStudentId(studentId);
        const companionSessions = await this.companionSessionRepo.findByStudentId(studentId);
        return { student, learningSessions, companionSessions };
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof student_repository_1.StudentRepository !== "undefined" && student_repository_1.StudentRepository) === "function" ? _a : Object, typeof (_b = typeof lesson_repository_1.LessonRepository !== "undefined" && lesson_repository_1.LessonRepository) === "function" ? _b : Object, typeof (_c = typeof learning_session_repository_1.LearningSessionRepository !== "undefined" && learning_session_repository_1.LearningSessionRepository) === "function" ? _c : Object, typeof (_d = typeof companion_session_repository_1.CompanionSessionRepository !== "undefined" && companion_session_repository_1.CompanionSessionRepository) === "function" ? _d : Object])
], DatabaseService);


/***/ }),
/* 49 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),
/* 50 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extractAssistantMessage = exports.normalizeText = exports.parseJsonFromModelOutput = exports.SessionDto = exports.LessonDto = exports.StudentProfileDto = exports.SsrcAuthGuard = exports.validateEnvConfig = exports.envConfigSchema = void 0;
// Config
var env_config_1 = __webpack_require__(51);
Object.defineProperty(exports, "envConfigSchema", ({ enumerable: true, get: function () { return env_config_1.envConfigSchema; } }));
Object.defineProperty(exports, "validateEnvConfig", ({ enumerable: true, get: function () { return env_config_1.validateEnvConfig; } }));
// Auth
var auth_guard_1 = __webpack_require__(53);
Object.defineProperty(exports, "SsrcAuthGuard", ({ enumerable: true, get: function () { return auth_guard_1.SsrcAuthGuard; } }));
// DTOs
var student_profile_dto_1 = __webpack_require__(54);
Object.defineProperty(exports, "StudentProfileDto", ({ enumerable: true, get: function () { return student_profile_dto_1.StudentProfileDto; } }));
var lesson_dto_1 = __webpack_require__(56);
Object.defineProperty(exports, "LessonDto", ({ enumerable: true, get: function () { return lesson_dto_1.LessonDto; } }));
var session_dto_1 = __webpack_require__(57);
Object.defineProperty(exports, "SessionDto", ({ enumerable: true, get: function () { return session_dto_1.SessionDto; } }));
// Utils
var json_parser_util_1 = __webpack_require__(58);
Object.defineProperty(exports, "parseJsonFromModelOutput", ({ enumerable: true, get: function () { return json_parser_util_1.parseJsonFromModelOutput; } }));
var text_util_1 = __webpack_require__(59);
Object.defineProperty(exports, "normalizeText", ({ enumerable: true, get: function () { return text_util_1.normalizeText; } }));
Object.defineProperty(exports, "extractAssistantMessage", ({ enumerable: true, get: function () { return text_util_1.extractAssistantMessage; } }));


/***/ }),
/* 51 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.envConfigSchema = void 0;
exports.validateEnvConfig = validateEnvConfig;
const Joi = __webpack_require__(52);
exports.envConfigSchema = Joi.object({
    GEMINI_API_KEY: Joi.string().required(),
    OPENAI_API_KEY: Joi.string().required(),
    ELEVENLABS_API_KEY: Joi.string().required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().port().default(5432),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_DATABASE: Joi.string().required(),
}).options({ allowUnknown: true });
/**
 * Validates environment variables against the schema.
 * Returns the validated config or throws an error describing invalid/missing vars.
 */
function validateEnvConfig(env) {
    const { error, value } = exports.envConfigSchema.validate(env, {
        abortEarly: false,
    });
    if (error) {
        const missingVars = error.details.map((d) => d.message).join('; ');
        throw new Error(`Config validation error: ${missingVars}`);
    }
    return value;
}


/***/ }),
/* 52 */
/***/ ((module) => {

module.exports = require("joi");

/***/ }),
/* 53 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SsrcAuthGuard = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
let SsrcAuthGuard = class SsrcAuthGuard {
    constructor(ssrcWhitelist) {
        this.whitelist = new Set(ssrcWhitelist);
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const ssrc = request.headers?.['x-ssrc'] ??
            request.query?.ssrc ??
            request.body?.ssrc;
        if (!ssrc || typeof ssrc !== 'string') {
            return false;
        }
        return this.whitelist.has(ssrc);
    }
};
exports.SsrcAuthGuard = SsrcAuthGuard;
exports.SsrcAuthGuard = SsrcAuthGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [Array])
], SsrcAuthGuard);


/***/ }),
/* 54 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StudentProfileDto = void 0;
const tslib_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(55);
class StudentProfileDto {
}
exports.StudentProfileDto = StudentProfileDto;
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], StudentProfileDto.prototype, "name", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], StudentProfileDto.prototype, "ssrc", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], StudentProfileDto.prototype, "accountId", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], StudentProfileDto.prototype, "deviceId", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    tslib_1.__metadata("design:type", typeof (_a = typeof Record !== "undefined" && Record) === "function" ? _a : Object)
], StudentProfileDto.prototype, "profile", void 0);


/***/ }),
/* 55 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 56 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LessonDto = void 0;
const tslib_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(55);
class LessonDto {
}
exports.LessonDto = LessonDto;
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], LessonDto.prototype, "title", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], LessonDto.prototype, "type", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsObject)(),
    tslib_1.__metadata("design:type", typeof (_a = typeof Record !== "undefined" && Record) === "function" ? _a : Object)
], LessonDto.prototype, "content", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    tslib_1.__metadata("design:type", typeof (_b = typeof Record !== "undefined" && Record) === "function" ? _b : Object)
], LessonDto.prototype, "metadata", void 0);


/***/ }),
/* 57 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SessionDto = void 0;
const tslib_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(55);
class SessionDto {
}
exports.SessionDto = SessionDto;
tslib_1.__decorate([
    (0, class_validator_1.IsUUID)(),
    tslib_1.__metadata("design:type", String)
], SessionDto.prototype, "studentId", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    tslib_1.__metadata("design:type", String)
], SessionDto.prototype, "lessonId", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], SessionDto.prototype, "mode", void 0);


/***/ }),
/* 58 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseJsonFromModelOutput = parseJsonFromModelOutput;
/**
 * Extracts and parses JSON from model output text.
 * Handles cases where JSON is wrapped in markdown code blocks,
 * or surrounded by other text.
 */
function parseJsonFromModelOutput(raw) {
    if (!raw || typeof raw !== 'string') {
        throw new Error('Input must be a non-empty string');
    }
    // Try to extract JSON from markdown code blocks: ```json ... ``` or ``` ... ```
    const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (codeBlockMatch) {
        try {
            return JSON.parse(codeBlockMatch[1].trim());
        }
        catch {
            // Fall through to other strategies
        }
    }
    // Try to find a JSON object or array in the text
    const jsonMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[1].trim());
        }
        catch {
            // Fall through
        }
    }
    // Try parsing the entire string as JSON
    try {
        return JSON.parse(raw.trim());
    }
    catch {
        throw new Error('Could not extract valid JSON from model output');
    }
}


/***/ }),
/* 59 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.normalizeText = normalizeText;
exports.extractAssistantMessage = extractAssistantMessage;
/**
 * Normalizes text by trimming, collapsing whitespace, and lowercasing.
 */
function normalizeText(text) {
    return text.trim().replace(/\s+/g, ' ').toLowerCase();
}
/**
 * Extracts the assistant message from model output.
 * Looks for common patterns like "Assistant:", "AI:", or the last
 * message in a conversation-style output.
 */
function extractAssistantMessage(output) {
    if (!output || typeof output !== 'string') {
        return '';
    }
    // Try to match "Assistant: ..." or "AI: ..." pattern
    const assistantMatch = output.match(/(?:assistant|ai)\s*:\s*([\s\S]*?)(?=(?:user|human)\s*:|$)/i);
    if (assistantMatch) {
        return assistantMatch[1].trim();
    }
    // If no pattern found, return the trimmed output as-is
    return output.trim();
}


/***/ }),
/* 60 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppController = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const app_service_1 = __webpack_require__(61);
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    getInfo() {
        return this.appService.getInfo();
    }
};
exports.AppController = AppController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Object)
], AppController.prototype, "getInfo", null);
exports.AppController = AppController = tslib_1.__decorate([
    (0, common_1.Controller)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof app_service_1.AppService !== "undefined" && app_service_1.AppService) === "function" ? _a : Object])
], AppController);


/***/ }),
/* 61 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppService = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
let AppService = class AppService {
    getInfo() {
        return { service: 'customer-service', status: 'ok' };
    }
};
exports.AppService = AppService;
exports.AppService = AppService = tslib_1.__decorate([
    (0, common_1.Injectable)()
], AppService);


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const platform_fastify_1 = __webpack_require__(3);
const nestjs_pino_1 = __webpack_require__(4);
const app_module_1 = __webpack_require__(5);
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter(), { bufferLogs: true });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const port = process.env['PORT'] || 8082;
    await app.listen(port, '0.0.0.0');
}
bootstrap();

})();

var __webpack_export_target__ = exports;
for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;