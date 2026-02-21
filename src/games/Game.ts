import { BaseAgent } from '../agents/BaseAgent';

export interface GameState {
    round: number;
    maxRounds: number;
    history: any[];
    scores: Record<string, number>;
    [key: string]: any; // Oyuna özgü ekstra veriler (ör: pot, havuz vb.)
}

/**
 * Game (Interface)
 * Sisteme eklenecek tüm oyunların (Prisoners Dilemma, Ultimatum vb.) takip edeceği şablon.
 */
export interface Game {
    name: string;
    players: BaseAgent[];
    state: GameState;

    /**
     * Oyunu başlatır veya sıradaki tura (round) geçer.
     */
    startRound(): Promise<void>;

    /**
     * Oyunun bitip bitmediğini kontrol eder.
     */
    isGameOver(): boolean;

    /**
     * Oyunun o anki turu için ajanlara sunulacak aksiyon araçlarını (Tools) döndürür.
     */
    getAvailableActions(agentId: string): any[];

    /**
     * Ajanın seçtiği eylemi oyuna işler ve durumu günceller.
     */
    processAction(agentId: string, actionName: string, actionArgs: any): void;

    /**
     * Tur sonunda skorları ve matrisi hesaplar.
     */
    calculatePayoffs(): void;
}
