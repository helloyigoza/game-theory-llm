export interface AgentMemory {
    history: string[];
    systemContext: string;
}

/**
 * BaseAgent (Abstract Class)
 * Bütün yapay zeka ajanlarının veya oyuncuların türetileceği temel sınıf.
 */
export abstract class BaseAgent {
    public id: string;
    public name: string;
    protected memory: AgentMemory;

    constructor(id: string, name: string, systemContext: string) {
        this.id = id;
        this.name = name;
        this.memory = {
            history: [],
            systemContext,
        };
    }

    /**
     * Ajanın belleğine yeni bir bilgi/olay ekler.
     */
    public updateMemory(event: string): void {
        this.memory.history.push(event);
    }

    /**
     * Belleği temizler (yeni oyun başladığında kullanılabilir).
     */
    public clearMemory(): void {
        this.memory.history = [];
    }

    /**
     * Ajanın sırası geldiğinde hamlesini (Action) yapmasını sağlayan asıl metot.
     * Alt sınıflar (örneğin OpenRouterAgent) bunu implemente edecektir.
     * @param gameState Oyunun mevcut durumu (JSON veya string olarak özet)
     * @param availableTools Ajanın o turda kullanabileceği hamlelerin (Tools) listesi
     */
    public abstract act(gameState: any, availableTools: any[]): Promise<any>;
}
