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

module.exports = require("@nestjs/platform-fastify");

/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
const config_1 = __webpack_require__(6);
const ai_core_1 = __webpack_require__(7);
const common_2 = __webpack_require__(35);
const app_controller_1 = __webpack_require__(45);
const app_service_1 = __webpack_require__(46);
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
            ai_core_1.AiCoreModule.register({
                llm: {
                    provider: process.env['LLM_PROVIDER'] || 'gemini',
                    model: process.env['LLM_MODEL'] || 'gemini-2.0-flash',
                    apiKey: process.env['GEMINI_API_KEY'] || '',
                },
                tts: {
                    provider: process.env['TTS_PROVIDER'] || 'elevenlabs',
                    model: process.env['TTS_MODEL'] || 'eleven_multilingual_v2',
                    apiKey: process.env['ELEVENLABS_API_KEY'] || '',
                },
                stt: {
                    provider: process.env['STT_PROVIDER'] || 'openai',
                    model: process.env['STT_MODEL'] || 'whisper-1',
                    apiKey: process.env['OPENAI_API_KEY'] || '',
                },
                realtime: {
                    provider: process.env['REALTIME_PROVIDER'] || 'openai',
                    model: process.env['REALTIME_MODEL'] || 'gpt-4o-realtime-preview',
                    apiKey: process.env['OPENAI_API_KEY'] || '',
                },
            }),
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);


/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TextToVoiceService = exports.VoiceToVoiceService = exports.RealtimeVoiceService = exports.SttService = exports.TtsService = exports.LlmService = exports.OpenAiRealtimeAdapter = exports.OpenAiSttAdapter = exports.ElevenLabsTtsAdapter = exports.GeminiLlmAdapter = exports.AdapterFactory = exports.REALTIME_ADAPTER = exports.STT_ADAPTER = exports.TTS_ADAPTER = exports.LLM_ADAPTER = exports.AdapterError = exports.AiCoreModule = void 0;
// Module
var ai_core_module_1 = __webpack_require__(8);
Object.defineProperty(exports, "AiCoreModule", ({ enumerable: true, get: function () { return ai_core_module_1.AiCoreModule; } }));
// Errors
var errors_1 = __webpack_require__(31);
Object.defineProperty(exports, "AdapterError", ({ enumerable: true, get: function () { return errors_1.AdapterError; } }));
// Constants
var constants_1 = __webpack_require__(32);
Object.defineProperty(exports, "LLM_ADAPTER", ({ enumerable: true, get: function () { return constants_1.LLM_ADAPTER; } }));
Object.defineProperty(exports, "TTS_ADAPTER", ({ enumerable: true, get: function () { return constants_1.TTS_ADAPTER; } }));
Object.defineProperty(exports, "STT_ADAPTER", ({ enumerable: true, get: function () { return constants_1.STT_ADAPTER; } }));
Object.defineProperty(exports, "REALTIME_ADAPTER", ({ enumerable: true, get: function () { return constants_1.REALTIME_ADAPTER; } }));
// Adapters
var adapters_1 = __webpack_require__(33);
Object.defineProperty(exports, "AdapterFactory", ({ enumerable: true, get: function () { return adapters_1.AdapterFactory; } }));
Object.defineProperty(exports, "GeminiLlmAdapter", ({ enumerable: true, get: function () { return adapters_1.GeminiLlmAdapter; } }));
Object.defineProperty(exports, "ElevenLabsTtsAdapter", ({ enumerable: true, get: function () { return adapters_1.ElevenLabsTtsAdapter; } }));
Object.defineProperty(exports, "OpenAiSttAdapter", ({ enumerable: true, get: function () { return adapters_1.OpenAiSttAdapter; } }));
Object.defineProperty(exports, "OpenAiRealtimeAdapter", ({ enumerable: true, get: function () { return adapters_1.OpenAiRealtimeAdapter; } }));
// Services
var services_1 = __webpack_require__(34);
Object.defineProperty(exports, "LlmService", ({ enumerable: true, get: function () { return services_1.LlmService; } }));
Object.defineProperty(exports, "TtsService", ({ enumerable: true, get: function () { return services_1.TtsService; } }));
Object.defineProperty(exports, "SttService", ({ enumerable: true, get: function () { return services_1.SttService; } }));
Object.defineProperty(exports, "RealtimeVoiceService", ({ enumerable: true, get: function () { return services_1.RealtimeVoiceService; } }));
Object.defineProperty(exports, "VoiceToVoiceService", ({ enumerable: true, get: function () { return services_1.VoiceToVoiceService; } }));
Object.defineProperty(exports, "TextToVoiceService", ({ enumerable: true, get: function () { return services_1.TextToVoiceService; } }));


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var AiCoreModule_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AiCoreModule = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
const injection_tokens_1 = __webpack_require__(9);
const adapter_factory_1 = __webpack_require__(10);
const llm_service_1 = __webpack_require__(21);
const tts_service_1 = __webpack_require__(23);
const stt_service_1 = __webpack_require__(25);
const realtime_voice_service_1 = __webpack_require__(27);
const voice_to_voice_service_1 = __webpack_require__(29);
const text_to_voice_service_1 = __webpack_require__(30);
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
/* 9 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.REALTIME_ADAPTER = exports.STT_ADAPTER = exports.TTS_ADAPTER = exports.LLM_ADAPTER = void 0;
exports.LLM_ADAPTER = Symbol('LLM_ADAPTER');
exports.TTS_ADAPTER = Symbol('TTS_ADAPTER');
exports.STT_ADAPTER = Symbol('STT_ADAPTER');
exports.REALTIME_ADAPTER = Symbol('REALTIME_ADAPTER');


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AdapterFactory = void 0;
const gemini_llm_adapter_1 = __webpack_require__(11);
const elevenlabs_tts_adapter_1 = __webpack_require__(14);
const openai_stt_adapter_1 = __webpack_require__(16);
const openai_realtime_adapter_1 = __webpack_require__(19);
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
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GeminiLlmAdapter = void 0;
const generative_ai_1 = __webpack_require__(12);
const adapter_error_1 = __webpack_require__(13);
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
/* 12 */
/***/ ((module) => {

module.exports = require("@google/generative-ai");

/***/ }),
/* 13 */
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
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ElevenLabsTtsAdapter = void 0;
const elevenlabs_1 = __webpack_require__(15);
const adapter_error_1 = __webpack_require__(13);
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
/* 15 */
/***/ ((module) => {

module.exports = require("elevenlabs");

/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OpenAiSttAdapter = void 0;
const openai_1 = __webpack_require__(17);
const buffer_1 = __webpack_require__(18);
const adapter_error_1 = __webpack_require__(13);
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
/* 17 */
/***/ ((module) => {

module.exports = require("openai");

/***/ }),
/* 18 */
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OpenAiRealtimeAdapter = void 0;
const WebSocket = __webpack_require__(20);
const adapter_error_1 = __webpack_require__(13);
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
/* 20 */
/***/ ((module) => {

module.exports = require("ws");

/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LlmService = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
const injection_tokens_1 = __webpack_require__(9);
const llm_interface_1 = __webpack_require__(22);
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
/* 22 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TtsService = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
const injection_tokens_1 = __webpack_require__(9);
const tts_interface_1 = __webpack_require__(24);
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
/* 24 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SttService = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
const injection_tokens_1 = __webpack_require__(9);
const stt_interface_1 = __webpack_require__(26);
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
/* 26 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),
/* 27 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RealtimeVoiceService = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
const injection_tokens_1 = __webpack_require__(9);
const realtime_interface_1 = __webpack_require__(28);
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
/* 28 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VoiceToVoiceService = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
const injection_tokens_1 = __webpack_require__(9);
const realtime_interface_1 = __webpack_require__(28);
const tts_interface_1 = __webpack_require__(24);
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
/* 30 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TextToVoiceService = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
const injection_tokens_1 = __webpack_require__(9);
const llm_interface_1 = __webpack_require__(22);
const tts_interface_1 = __webpack_require__(24);
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
/* 31 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AdapterError = void 0;
var adapter_error_1 = __webpack_require__(13);
Object.defineProperty(exports, "AdapterError", ({ enumerable: true, get: function () { return adapter_error_1.AdapterError; } }));


/***/ }),
/* 32 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.REALTIME_ADAPTER = exports.STT_ADAPTER = exports.TTS_ADAPTER = exports.LLM_ADAPTER = void 0;
var injection_tokens_1 = __webpack_require__(9);
Object.defineProperty(exports, "LLM_ADAPTER", ({ enumerable: true, get: function () { return injection_tokens_1.LLM_ADAPTER; } }));
Object.defineProperty(exports, "TTS_ADAPTER", ({ enumerable: true, get: function () { return injection_tokens_1.TTS_ADAPTER; } }));
Object.defineProperty(exports, "STT_ADAPTER", ({ enumerable: true, get: function () { return injection_tokens_1.STT_ADAPTER; } }));
Object.defineProperty(exports, "REALTIME_ADAPTER", ({ enumerable: true, get: function () { return injection_tokens_1.REALTIME_ADAPTER; } }));


/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OpenAiRealtimeAdapter = exports.OpenAiSttAdapter = exports.ElevenLabsTtsAdapter = exports.GeminiLlmAdapter = exports.AdapterFactory = void 0;
var adapter_factory_1 = __webpack_require__(10);
Object.defineProperty(exports, "AdapterFactory", ({ enumerable: true, get: function () { return adapter_factory_1.AdapterFactory; } }));
var gemini_llm_adapter_1 = __webpack_require__(11);
Object.defineProperty(exports, "GeminiLlmAdapter", ({ enumerable: true, get: function () { return gemini_llm_adapter_1.GeminiLlmAdapter; } }));
var elevenlabs_tts_adapter_1 = __webpack_require__(14);
Object.defineProperty(exports, "ElevenLabsTtsAdapter", ({ enumerable: true, get: function () { return elevenlabs_tts_adapter_1.ElevenLabsTtsAdapter; } }));
var openai_stt_adapter_1 = __webpack_require__(16);
Object.defineProperty(exports, "OpenAiSttAdapter", ({ enumerable: true, get: function () { return openai_stt_adapter_1.OpenAiSttAdapter; } }));
var openai_realtime_adapter_1 = __webpack_require__(19);
Object.defineProperty(exports, "OpenAiRealtimeAdapter", ({ enumerable: true, get: function () { return openai_realtime_adapter_1.OpenAiRealtimeAdapter; } }));


/***/ }),
/* 34 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TextToVoiceService = exports.VoiceToVoiceService = exports.RealtimeVoiceService = exports.SttService = exports.TtsService = exports.LlmService = void 0;
var llm_service_1 = __webpack_require__(21);
Object.defineProperty(exports, "LlmService", ({ enumerable: true, get: function () { return llm_service_1.LlmService; } }));
var tts_service_1 = __webpack_require__(23);
Object.defineProperty(exports, "TtsService", ({ enumerable: true, get: function () { return tts_service_1.TtsService; } }));
var stt_service_1 = __webpack_require__(25);
Object.defineProperty(exports, "SttService", ({ enumerable: true, get: function () { return stt_service_1.SttService; } }));
var realtime_voice_service_1 = __webpack_require__(27);
Object.defineProperty(exports, "RealtimeVoiceService", ({ enumerable: true, get: function () { return realtime_voice_service_1.RealtimeVoiceService; } }));
var voice_to_voice_service_1 = __webpack_require__(29);
Object.defineProperty(exports, "VoiceToVoiceService", ({ enumerable: true, get: function () { return voice_to_voice_service_1.VoiceToVoiceService; } }));
var text_to_voice_service_1 = __webpack_require__(30);
Object.defineProperty(exports, "TextToVoiceService", ({ enumerable: true, get: function () { return text_to_voice_service_1.TextToVoiceService; } }));


/***/ }),
/* 35 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extractAssistantMessage = exports.normalizeText = exports.parseJsonFromModelOutput = exports.SessionDto = exports.LessonDto = exports.StudentProfileDto = exports.SsrcAuthGuard = exports.validateEnvConfig = exports.envConfigSchema = void 0;
// Config
var env_config_1 = __webpack_require__(36);
Object.defineProperty(exports, "envConfigSchema", ({ enumerable: true, get: function () { return env_config_1.envConfigSchema; } }));
Object.defineProperty(exports, "validateEnvConfig", ({ enumerable: true, get: function () { return env_config_1.validateEnvConfig; } }));
// Auth
var auth_guard_1 = __webpack_require__(38);
Object.defineProperty(exports, "SsrcAuthGuard", ({ enumerable: true, get: function () { return auth_guard_1.SsrcAuthGuard; } }));
// DTOs
var student_profile_dto_1 = __webpack_require__(39);
Object.defineProperty(exports, "StudentProfileDto", ({ enumerable: true, get: function () { return student_profile_dto_1.StudentProfileDto; } }));
var lesson_dto_1 = __webpack_require__(41);
Object.defineProperty(exports, "LessonDto", ({ enumerable: true, get: function () { return lesson_dto_1.LessonDto; } }));
var session_dto_1 = __webpack_require__(42);
Object.defineProperty(exports, "SessionDto", ({ enumerable: true, get: function () { return session_dto_1.SessionDto; } }));
// Utils
var json_parser_util_1 = __webpack_require__(43);
Object.defineProperty(exports, "parseJsonFromModelOutput", ({ enumerable: true, get: function () { return json_parser_util_1.parseJsonFromModelOutput; } }));
var text_util_1 = __webpack_require__(44);
Object.defineProperty(exports, "normalizeText", ({ enumerable: true, get: function () { return text_util_1.normalizeText; } }));
Object.defineProperty(exports, "extractAssistantMessage", ({ enumerable: true, get: function () { return text_util_1.extractAssistantMessage; } }));


/***/ }),
/* 36 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.envConfigSchema = void 0;
exports.validateEnvConfig = validateEnvConfig;
const Joi = __webpack_require__(37);
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
/* 37 */
/***/ ((module) => {

module.exports = require("joi");

/***/ }),
/* 38 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SsrcAuthGuard = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
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
/* 39 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StudentProfileDto = void 0;
const tslib_1 = __webpack_require__(4);
const class_validator_1 = __webpack_require__(40);
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
/* 40 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 41 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LessonDto = void 0;
const tslib_1 = __webpack_require__(4);
const class_validator_1 = __webpack_require__(40);
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
/* 42 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SessionDto = void 0;
const tslib_1 = __webpack_require__(4);
const class_validator_1 = __webpack_require__(40);
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
/* 43 */
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
/* 44 */
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
/* 45 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppController = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
const app_service_1 = __webpack_require__(46);
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
/* 46 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppService = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
let AppService = class AppService {
    getInfo() {
        return { service: 'ai-service', status: 'ok' };
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
const platform_fastify_1 = __webpack_require__(2);
const app_module_1 = __webpack_require__(3);
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter());
    const port = process.env['PORT'] || 8081;
    await app.listen(port, '0.0.0.0');
}
bootstrap();

})();

var __webpack_export_target__ = exports;
for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;