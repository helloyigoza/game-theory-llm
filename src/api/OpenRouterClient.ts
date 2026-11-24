import axios from 'axios';

export interface OpenRouterResponse {
    choices: Array<{
        message: {
            content: string | null;
            tool_calls?: Array<{
                id: string;
                type: string;
                function: {
                    name: string;
                    arguments: string; // JSON string
                };
            }>;
        };
    }>;
}

/**
 * OpenRouterClient
 * OpenRouter API'ye HTTP POST isteği gönderir ve modelin (Ajanın) yanıtını/araç çağrısını alır.
 */
export class OpenRouterClient {
    private apiKey: string;
    private baseURL = 'https://openrouter.ai/api/v1/chat/completions';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Modele sistem istemini, geçmiş olayları ve o turda kullanılabilir olan aksiyon araçlarını gönderir.
     */
    public async createCompletion(
        systemContext: string,
        history: string[],
        model: string,
        tools?: any[]
    ): Promise<OpenRouterResponse> {
        const messages = [
            { role: 'system', content: systemContext },
            ...history.map((h) => ({ role: 'user', content: h })),
        ];

        const payload: any = {
            model,
            messages,
            temperature: 0.2, // Rasyonel ve deterministik kararlar alması için düşük sıcaklık
        };

        if (tools && tools.length > 0) {
            payload.tools = tools.map((t) => ({
                type: 'function',
                function: t,
            }));
            // Bazı ücretsiz modeller 'required' desteklemiyor olabilir, bu yüzden 'auto' yapıyoruz.
            payload.tool_choice = 'auto';
        }

        try {
            const response = await axios.post<OpenRouterResponse>(this.baseURL, payload, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://github.com/game-theory-llm',
                    'X-Title': 'Game Theory LLM MatchEngine',
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error: any) {
            const errorData = error.response?.data;
            console.error('OpenRouter API çağrısında hata:', errorData || error.message);

            let errorMsg = error.message;
            if (errorData && errorData.error && errorData.error.message) {
                errorMsg = errorData.error.message;
            } else if (errorData) {
                errorMsg = JSON.stringify(errorData);
            }

            throw new Error(`API Hatası (400): ${errorMsg}`);
        }
    }
}
