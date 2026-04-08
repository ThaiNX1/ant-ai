// -----------------------------------------------------------------------------
// ⚙️ AI MODELS CONFIGURATION
// -----------------------------------------------------------------------------

export interface AIModelConfig {
  name: string;
  provider: string;
  baseUrl: string;
  apiKeys: string[];
  models: string[];
  defaultModel?: string;
}

export interface CharacterConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  avatarUrl: string;
  isDefault: boolean;
  createdBy: string;
}

// -----------------------------------------------------------------------------
// LLM PROVIDERS CONFIGURATION
// -----------------------------------------------------------------------------

export const CEREBRAS_CONFIG: AIModelConfig = {
  name: 'cerebras',
  provider: 'cerebras',
  baseUrl: 'https://api.cerebras.ai/v1/chat/completions',
  apiKeys: [
    'csk-e6pf3kwtrm8h2ejw8yhxjynpwtt3hxx3v392mjfwj6xvw298',
    'csk-fnm6jre49fr9cvhtxe2knmcpd9h6jdr3em6mr283rcmd9ftd',
    'csk-t2jcnr6258vty3tk2j32n48mdp4n2p2e5vrcyke2c5hp4f26',
    'csk-cte9m5ww3y3x32wjpd6xcdcpemw8f89v8c64n35njcfdxr5x',
    'csk-hj385f55y6jm2pdpf6tfe9c4wcwm8mr3hepmrwwh2yh6cw56',
    'csk-xdrjwt8dmrnxnvv3f2p3x8vmkxfwrxhdyx84ppyyjrk4nk2d',
    'csk-4p6vcmtkh6jpkpmkd2xen64h2mmm2f2nr6p228fwcmycnctf',
    'csk-v8rxt524nkk2rrw2wrp4dr8d5yf4v9ryjkjk8mvm3j8wnxvx',
    'csk-hcphy33jwvtkxy2j363yddhnwnhj4pn6cv4ktmc9erxhvk39',
    'csk-jw6drkvjmyfwfwxpfmc8rx32v6j8kpm93ymt8vdt8nw882vd',
    'csk-5396pvpvvx5xfrcvjtfd9h39p9h8jyxjj8ww6562jwvyje8t',
    'csk-exh3fft5rjnc5t9wtyck9p64v6pdf2nn8h9pveh8jk6f3fte',
    'csk-fmjd5vpr8vrh6whk2959prtk3xnrkpp4rynyxjejpnff3w9c',
    'csk-e5vw9jrhkpmtejx9wdwrf3v8cx5cmmdvnxpnwpmck58j45jn',
    'csk-9xyv89n52ed6hfnedxy69vr4vm8t9xt59dk5jv3m8e8n3cef',
    'csk-t9225v824mtxdxmvx3nm2yyw9dfrjmvte5tdjk4pvx22tcjy',
  ],
  models: ['cerebras-llm'],
};

export const SARVAM_CONFIG: AIModelConfig = {
  name: 'sarvam',
  provider: 'sarvam',
  baseUrl: 'https://api.sarvam.ai/v1/chat/completions',
  apiKeys: ['sk_53fp2160_ZBE7YdaTWyv6gOaood9Wxwae'],
  models: ['sarvam-llm'],
};

export const SARVAM_TTS_CONFIG: AIModelConfig = {
  name: 'sarvam-tts',
  provider: 'sarvam',
  baseUrl: 'https://api.sarvam.ai/text-to-speech',
  apiKeys: ['sk_43bpe82a_WVzzneHqERiE91SlkJ8laCrx'],
  models: ['sarvam-tts'],
};

export const OPENROUTER_CONFIG: AIModelConfig = {
  name: 'openrouter',
  provider: 'openrouter',
  baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  apiKeys: ['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'],
  models: ['openrouter-models'],
};

export const DEEPSEEK_CONFIG: AIModelConfig = {
  name: 'deepseek',
  provider: 'deepseek',
  baseUrl: 'http://apo-fares.abrdns.com/DeepSeek.php',
  apiKeys: [],
  models: [
    'deepseek-V1',
    'deepseek-V2',
    'deepseek-V2.5',
    'deepseek-V3',
    'deepseek-R1',
    'deepseek-VL',
    'deepseek-CODER',
  ],
};

export const COHERE_CONFIG: AIModelConfig = {
  name: 'cohere',
  provider: 'cohere',
  baseUrl: 'https://api.cohere.com/v2/chat',
  apiKeys: [
    'E2G8ATrN8Yb8Di9CBXRYX7TLKz9ZoI4DM01DnmGl',
    'doeM32W2so3ubfYYs673lmiOmUzwN15weKfB68bj',
    '8hE4X6TIs359E7syTmVrEnAQQaIqfxDCE25W5TpJ',
    'MtDvCJw9bASg879dnzhXsyH5skcHi6vmBEXl0pQO',
    'IDlfxdy11paDxht8zQKuLQZkR61dhaPRTwdNzkpF',
    'L09VYBcwpllrBCAp7eaBNMoBzp7fVS3j37foKdi5',
    '2UBTVU7lzz7SpLILH3DgxO4BQU0BVMdAQHqoYYzn',
    'LPpk7Ko6u3QhfwZzdhhKZkoBZ1xCmdCxJTNegPI4',
    'BFa9b85rwbDFBCNBc6KwK6T49rblQMlEHPJdD0NV',
    'NjgIHhFLUEQ6JWwnEarM3vFTJp2waGWzR8KF5lwc',
    'vDKYv81mKtoiQmPnLgVBnqm2e9iYzcziRRvtzQy6',
    'PQ50WPjjMsFSzUhZlMQaGTlS30MyRs9YkbuKfhHh',
    'ntlBWBTl3UTkw45G4scwibmEr4iWgukgQ36ASGkO',
    'TLIKEjNopX4NKHX1upnVBN85Cu1s52eWaCoBulNN',
    '1TwUQgHVk0k5US5U6vtzJ3CObGx92ak4pO1QIQo2',
    'EeKZEJ0dP0Ot2WPkcNSk1ax9p0GTrUOsfBSevUBX',
    'QU0eJVAl4MbACkDCy9WPN640qiViL1po6Z6kPr8S',
    'p1p0fpBMPtke1gCRNYl9GUO5aEleq9ua3ok5b27a',
    'I5WzAkJerwsBeK79CZA5zLxBBBVCeJ8o8ADU4XZ6',
    '39TAyPgeBqHh9rFoQLDtZL26dluSbjIqBBtjHnEa',
    'cmLHa3mMPKPJReANzKQ0wrapAH5lULG7BxeCqxX0',
    'wxGyAk4AmZJ9AazVQYV9QC1eCX7zi1YQkzcA1ZLW',
    '2cMoENwLIbbF5XNamWZuwWewmehx6VCqvY0oCPyS',
    'M2GKPBFIZeVVrDI447YcZ5fiWVlJ3dtTilCb9861',
    '4dkVC224oH8uSqKsYCAypJ6fOwxdsfUqQux2Rf1B',
    '8bVZxyEDWgX8qHh9wiIkqegiUBtU3IW7u9hYOF2k',
    'sRmFY97EVTJa7VaaaQha5oH7lScl1rxTZv8x6KrV',
    'L43m79WwnztkJKWZnv2QGYAQkTX4Zou5lWKXInm4',
    'FvgXRMGeiYpsMoJfym1pffFKgquICXPs0IeHuTKi',
    'zXH8KUSA3ncfZcxvIAZx5boAlGlTirN6LJmp706Q',
    'X5Hvxd0TE1eF7yXa6PjlH3bt71sI91nQr3EzsSzv',
    'JNSFlaZw8ccLGXnxzfL4x8e0wRkDxCRpMRgfTGWv',
    'zdOo8nXVDqdfHC1BI3CMMb8w9H8X9KER7EA3YJn6',
  ],
  models: [
    'command-a-03-2025',
    'command-r-plus-08-2024',
    'command-a-reasoning-08-2025',
    'command-a-vision-07-2025',
  ],
  defaultModel: 'command-a-03-2025',
};

export const FIRECRAWL_CONFIG: AIModelConfig = {
  name: 'firecrawl',
  provider: 'firecrawl',
  baseUrl: 'https://api.firecrawl.dev/v1/scrape',
  apiKeys: [
    'fc-31ebbe4647b84fdc975318d372eebea8',
    'fc-418ad2bf8944494dbc52cc8a001feda5',
    'fc-e6b4759506184b6bac42b7278e125346',
    'fc-208e755be49d410caead6d4277556495',
    'fc-f4745f41d5fd4e8c9d24d97b65e8a96c',
    'fc-4a3d7c98f2c44eb382b6f0e84e9c83f7',
    'fc-857417811665460e92716b92e08ec398',
    'fc-b69d6504ab0a42b79e87b7827a538199',
    'fc-b6b1099b21bf4d79b3cd0fb604f4afaa',
    'fc-9eb380b0dec74d6ebb6c756ee4de4c5a',
    'fc-a0b3b8aa31244c10b0f15b4f2d570ac7',
    'fc-fdf5a432139a44d58972594424d42918',
    'fc-6d9301e0ab1b46b8a58f146d587a644f',
    'fc-0a2c801f433d4718bcd8189f2742edf4',
    'fc-f8947ce2c5aa457f9b311b7eff9d1da1',
    'fc-2aac5dfed4eb42038de75ee4c217e19e',
    'fc-1cb30e59374046cab8006393f5fa4b61',
    'fc-5bfd19a22c03445092efedc3ef1c403a',
    'fc-86cab48709644bfe880cacbff636e7fc',
    'fc-9b271ecf3a944c3faf93489565547fc8',
    'fc-00857d82ec534e8598df1bae9af9fb28',
    'fc-0bed08c54ba34a349ef512c32d1a8328',
    'fc-0332219c1d1f49febd63e06d57e6c953',
    'fc-ec025f3a447c46878bee6926b49c17d3',
    'fc-3048810124b640eb99293880a4ab25d0',
    'fc-43e5dcff501d4aef8cbccfa47b646f57',
    'fc-584a0abdc1a7470ca790738b0fea1a70',
    'fc-0a0cf08a2e264256a4094bb4f9fc6ab6',
    'fc-970e648f82d445b989c90b57b379da5c',
    'fc-c1e849dd9b9644f3ac8b2b6419ea793b',
    'fc-b57fb764d0f24f4ab0a961b51582cdf2',
    'fc-0853aae8169243bf8d01d72755c91fe5',
    'fc-5b9ec38c1f764b7c896696878063e18d',
    'fc-d8c497322f3444bab82f0f78eb5a8309',
    'fc-1b759fd6d7cd4784bc8f8819060228cd',
    'fc-165b7e7c4d044eadacc75a7968bcad33',
    'fc-0a1a4b69aaaa4ff0947dd8bb52e08010',
    'fc-9a66ca4f3e42497aa20bc6aeeea06505',
    'fc-e72d5fa25212477989370625258811c8',
    'fc-5dbb378635a049a3a72295e321e69716',
  ],
  models: ['firecrawl-scrape'],
};

export const BRAVE_CONFIG: AIModelConfig = {
  name: 'brave',
  provider: 'brave',
  baseUrl: 'https://api.search.brave.com/res/v1/web/search',
  apiKeys: [
    'BSAP1ZmJl9wMXKDvGnGM78r9__i_VuG',
    'BSAxfihSqqUJXgGPvZJduSZhcZbfnQB',
    'BSAFHHikdsv2YXSYODQSPES2tTMILHI',
    'BSA7N3mbuH1WLUgTE-C7wvOS5SR7Srl',
    'BSAFvyFnGBcWt8IImCnXR_7tgwymtdr',
    'BSAWAka3FqwUpp3FJP_f5izlPCmXYJE',
    'BSAN7HoBWjJOUG-zXVN8rkIGXpbsRtq',
    'BSAttExzgW4_H4rcHMmpHQ9hw7vz2lX',
    'BSAP0LqtBpuCz19UbWd_SF6BCSTgQbD',
    'BSAsHWA8JejN8yR7rmQpB6zbiuN0kiz',
    'BSAsDd5v_DhzOXMvxDp59Up7gE4F9FU',
    'BSAxGC1s-JGptZejZb7W-srU3C38tUa',
    'BSANO2wi1X7VobnaHKDZiKtSSUVLJbs',
    'BSAF0Eghn0LJVunT162U9_hjUTwpoxT',
    'BSAatEHiEyQVY0E2m5VTZpURgWmwVJs',
    'BSAhdZD3bibK1I21NLKCOEYIzF92JAg',
    'BSA5Wbq3XcFhkVnlqkFvWy9oQ6LCpPM',
    'BSA9cI-ySSlj9AcH1Te378Dns7u-a94',
    'BSALK6kVOrH0IJeW-y5cFmAkvkdYtXK',
    'BSA91HObAKlxwVldV5teh4TTKGw8_qN',
    'BSAhxxZOTsSPVAi4c-5Jye3ZNTxiCpO',
    'BSApz0194z7SG6DplmVozl7ttFOi0Eo',
    'BSA_qIkGjGbHL3dAZ8ud30KkrFA-AoR',
    'BSAtniQaa7lCvHmj0z6gHUTzxfwRmtP',
    'BSALH5My3WviqKzd52GFKMPb8Nkq-cl',
    'BSABCX8h0_23my3-3VbXZU2LZscu-LX',
    'BSACjemCARQailPeTLzGQ9auvrc8bsM',
    'BSApoyO-93mdXe0VM3BTFtMJUKQALhO',
    'BSA6k-wEGLawcaINnEb-iIiwBnq9-Y2',
    'BSArXZ987KsjfuUmJRTvpXPjuYVP7-I',
    'BSAe7FiTb62lN_g3Qctb-L97QJIqkDF',
    'BSAYFCph1muTB4F5t5cFNIGQfv9UT8j',
    'BSAtrR5zhssDQA9iHdKR6rtIqhxilR8',
    'BSAQ0gsYuaYuEZHayb_Ek1pnl1l2RiW',
  ],
  models: ['brave-search'],
};

// -----------------------------------------------------------------------------
// ALL AVAILABLE MODELS
// -----------------------------------------------------------------------------

export const ALL_AVAILABLE_MODELS: string[] = [
  'gpt-oss-120b',
  ...COHERE_CONFIG.models,
  ...DEEPSEEK_CONFIG.models,
];

// -----------------------------------------------------------------------------
// IMAGE GENERATION (disabled in UI)
// -----------------------------------------------------------------------------

export const IMAGE_CONFIG = {
  imageUrl: '',
  defaultImageModel: '',
  availableImageModels: [] as string[],
};

// -----------------------------------------------------------------------------
// DEFAULT CHARACTERS
// -----------------------------------------------------------------------------

export const DEFAULT_CHARACTERS: CharacterConfig[] = [
  {
    id: 'modi_01',
    name: 'Narendra Modi',
    description: 'Prime Minister of India',
    systemPrompt: `You are Narendra Modi, the Prime Minister of India. You speak with deep patriotism, vision, and authority. You often address the user as 'Mitron' or 'Mere Pyare Deshvasio'. Your tone is inspirational, formal, yet connected to the roots of Indian culture. You focus on development (Vikas), technology, and the bright future of India. You speak in a mix of Hindi and English where appropriate, or purely in the language the user prefers, but always with your characteristic style.`,
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Narendra_Modi_2021.jpg/800px-Narendra_Modi_2021.jpg',
    isDefault: true,
    createdBy: 'system',
  },
  {
    id: 'yogi_01',
    name: 'Yogi Adityanath',
    description: 'Chief Minister of Uttar Pradesh',
    systemPrompt: `You are Yogi Adityanath, the Chief Minister of Uttar Pradesh. You speak with a strong, decisive, and spiritual tone. You value discipline, law and order, and cultural heritage. You are direct and firm in your speech. You often refer to Sanatan Dharma and the welfare of the people. Your language is formal Hindi-influenced English or pure Hindi.`,
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Yogi_Adityanath_April_2017.jpg/640px-Yogi_Adityanath_April_2017.jpg',
    isDefault: true,
    createdBy: 'system',
  },
  {
    id: 'pw_01',
    name: 'Physics Wallah',
    description: 'Alakh Pandey (PW)',
    systemPrompt: `You are Alakh Pandey, popularly known as Physics Wallah. You are an energetic, passionate, and relatable teacher. You often use slang like 'Bachhon', 'Hello Bachhon', 'Padhai karte rahein'. Your goal is to make concepts easy and fun. You are motivating and treat your students like younger siblings. You speak in Hinglish (Hindi + English mix).`,
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Alakh_Pandey_Physics_Wallah.jpg/640px-Alakh_Pandey_Physics_Wallah.jpg',
    isDefault: true,
    createdBy: 'system',
  },
  {
    id: 'einstein_01',
    name: 'Albert Einstein',
    description: 'Theoretical Physicist',
    systemPrompt: `You are Albert Einstein. You are a curious, humble, and imaginative physicist. You explain complex universe concepts with simple thought experiments. You have a slight playful sense of humor. You value imagination over knowledge. You speak with a wise, professorial tone.`,
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/640px-Albert_Einstein_Head.jpg',
    isDefault: true,
    createdBy: 'system',
  },
];

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------

export function getRandomApiKey(apiKeys: string[]): string {
  if (apiKeys.length === 0) return '';
  return apiKeys[Math.floor(Math.random() * apiKeys.length)];
}

export function getModelConfig(provider: string): AIModelConfig | undefined {
  const configs: Record<string, AIModelConfig> = {
    cerebras: CEREBRAS_CONFIG,
    sarvam: SARVAM_CONFIG,
    'sarvam-tts': SARVAM_TTS_CONFIG,
    openrouter: OPENROUTER_CONFIG,
    deepseek: DEEPSEEK_CONFIG,
    cohere: COHERE_CONFIG,
    firecrawl: FIRECRAWL_CONFIG,
    brave: BRAVE_CONFIG,
  };
  return configs[provider];
}

export function getAvailableProviders(): string[] {
  return [
    'cerebras',
    'sarvam',
    'sarvam-tts',
    'openrouter',
    'deepseek',
    'cohere',
    'firecrawl',
    'brave',
  ];
}