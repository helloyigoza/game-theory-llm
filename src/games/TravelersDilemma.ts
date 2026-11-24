import { Game, GameState } from './Game';
import { BaseAgent } from '../agents/BaseAgent';
import { ActionRegistry } from '../tools/ActionRegistry';

export class TravelersDilemma implements Game {
    public name = "Traveler's Dilemma (Gezginin İkilemi)";
    public players: BaseAgent[];
    public state: GameState;

    // Minimum ve Maksimum seçilebilecek değer (Bonus/Ceza miktarı: R = 2$)
    public MIN_VAL = 2;
    public MAX_VAL = 100;
    public R = 2;

    private currentRoundActions: Record<string, number> = {};

    constructor(player1: BaseAgent, player2: BaseAgent, maxRounds: number = 3) {
        this.players = [player1, player2];
        this.state = {
            round: 1,
            maxRounds: maxRounds,
            history: [],
            scores: {
                [player1.id]: 0,
                [player2.id]: 0,
            }
        };
    }

    public getAvailableActions(agentId: string): any[] {
        return [
            ActionRegistry.actionChoosePrice(this.MIN_VAL, this.MAX_VAL)
        ];
    }

    public processAction(agentId: string, actionName: string, actionArgs: any): void {
        if (actionName !== 'action_choose_price') {
            throw new Error(`Geçersiz hamle: ${actionName}`);
        }

        let chosenPrice = parseInt(actionArgs.price);

        // Sınır kontrolleri
        if (isNaN(chosenPrice)) chosenPrice = this.MAX_VAL;
        if (chosenPrice < this.MIN_VAL) chosenPrice = this.MIN_VAL;
        if (chosenPrice > this.MAX_VAL) chosenPrice = this.MAX_VAL;

        this.currentRoundActions[agentId] = chosenPrice;
    }

    public calculatePayoffs(): void {
        const p1 = this.players[0].id;
        const p2 = this.players[1].id;
        const price1 = this.currentRoundActions[p1];
        const price2 = this.currentRoundActions[p2];

        let p1Score = 0;
        let p2Score = 0;

        // Traveler's Dilemma Kuralları
        if (price1 === price2) {
            // Eşitse ikisi de o miktarı alır.
            p1Score = price1;
            p2Score = price2;
        } else if (price1 < price2) {
            // P1 düşük söyledi (Dürüst/Avantajlı)
            p1Score = price1 + this.R;
            p2Score = price1 - this.R;
        } else {
            // P2 düşük söyledi (Dürüst/Avantajlı)
            p1Score = price2 - this.R;
            p2Score = price2 + this.R;
        }

        this.state.scores[p1] += p1Score;
        this.state.scores[p2] += p2Score;

        this.state.history.push({
            round: this.state.round,
            moves: { [p1]: price1, [p2]: price2 },
            roundScores: { [p1]: p1Score, [p2]: p2Score }
        });

        this.currentRoundActions = {};
    }

    public async startRound(): Promise<void> {
        console.log(`\n--- Tur ${this.state.round} Başlıyor ---`);
    }

    public isGameOver(): boolean {
        return this.state.round > this.state.maxRounds;
    }
}
