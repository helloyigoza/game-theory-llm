import { BaseAgent } from './BaseAgent';
import { OpenRouterClient } from '../api/OpenRouterClient';
import { jsonrepair } from 'jsonrepair';

export class LLMAgent extends BaseAgent {
    private apiClient: OpenRouterClient;
    private model: string;

    constructor(id: string, name: string, systemContext: string, apiKey: string, model: string = 'google/gemini-2.5-flash-pro') {
        super(id, name, systemContext);
        this.apiClient = new OpenRouterClient(apiKey);
        this.model = model;
    }

    /**
     * OpenRouter API aracılığıyla Ajanın karar alma sürecini işletir.
     */
    public async act(gameState: any, availableTools: any[]): Promise<any> {
        // 1. Oyunun anlık durumunu ajanın anlayacağı dilde bellek history'sine ekleriz (Prompt injection)
        const prompt = `Şu anki oyun durumu:\n${JSON.stringify(gameState, null, 2)}\nSıra sende, bir eylem (Tool) seçmelisin.`;

        // 2. OpenRouter API'ye çağrı yapıyoruz
        const response = await this.apiClient.createCompletion(
            this.memory.systemContext,
            [...this.memory.history, prompt],
            this.model,
            availableTools
        );

        const message = response.choices[0].message;

        // 3. Ajan eğer bir Tool (Hamle/Aksiyon) kullanmışsa, onu döndürürüz
        if (message.tool_calls && message.tool_calls.length > 0) {
            const toolCall = message.tool_calls[0];
            let parsedArgs: any = {};
            try {
                // LLM'lerin bozuk üretebileceği JSON'ları jsonrepair ile onaralım
                const repairedJson = jsonrepair(toolCall.function.arguments);
                parsedArgs = JSON.parse(repairedJson);
            } catch (e) {
                console.error(`[HATA] Ajan JSON argümanı çözülemedi. Arg: ${toolCall.function.arguments}`);
                parsedArgs = {}; // Boş obje fallback
            }

            // Ajanın iç sesi (reasoning) history'ye eklenerek sonraki turlar için hatırlaması sağlanır
            if (parsedArgs.reasoning) {
                this.updateMemory(`Son turda şöyle düşündüm: ${parsedArgs.reasoning}`);
            }

            return {
                action: toolCall.function.name,
                arguments: parsedArgs,
            };
        }

        // Eğer model tool kullanmayı reddedip düz metin döndüyse:
        if (message.content) {
            console.log(`[UYARI] ${this.name} Tool yerine düz metin döndü: ${message.content}`);
            // Fallback olarak eğer içinde "cooperate" kelimesi geçiyorsa cooperate ettir, yoksa defect (veya hata fırlat)
            const contentLower = message.content.toLowerCase();
            if (contentLower.includes('cooperate') || contentLower.includes('işbirliği')) {
                return { action: 'action_cooperate', arguments: { reasoning: message.content } };
            }
            if (contentLower.includes('defect') || contentLower.includes('ihanet')) {
                return { action: 'action_defect', arguments: { reasoning: message.content } };
            }
        }

        // 4. Ajan arıza yaparsa/istediğimiz aracı çağırmazsa default (fallback) dönüş.
        throw new Error(`${this.name} geçerli bir karar veremedi. Modelin dönüşü: ${JSON.stringify(message)}`);
    }
}
