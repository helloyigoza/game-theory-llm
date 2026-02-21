import { Game, GameState } from './Game';
import { BaseAgent } from '../agents/BaseAgent';
import { ActionRegistry } from '../tools/ActionRegistry';

export class PublicGoodsGame implements Game {
    public name = "Public Goods Game";
    public players: BaseAgent[];
    public state: GameState;

    private currentRoundInvestments: Record<string, number> = {};
    public initialTokensPerRound: number;
    public multiplier: number;

    constructor(players: BaseAgent[], maxRounds: number = 5, initialTokensPerRound: number = 10, multiplier: number = 2) {
        if (players.length < 2) throw new Error("Public Goods Game en az 2 oyuncu gerektirir (N-Player).");

        this.players = players;
        this.initialTokensPerRound = initialTokensPerRound;
        this.multiplier = multiplier;

        const initialScores: Record<string, number> = {};
        players.forEach(p => initialScores[p.id] = 0);

        this.state = {
            round: 1,
            maxRounds: maxRounds,
            history: [],
            scores: initialScores,
            pot: 0
        };
    }

    public getAvailableActions(agentId: string): any[] {
        // Sadece yatırım yapma aracı döner
        return [ActionRegistry.actionInvest()];
    }

    public processAction(agentId: string, actionName: string, actionArgs: any): void {
        if (actionName !== 'action_invest') {
            throw new Error(`Geçersiz hamle: ${actionName}`);
        }

        let amount = actionArgs.amount;
        // Geçerli limitler içinde tut
        if (amount < 0) amount = 0;
        if (amount > this.initialTokensPerRound) amount = this.initialTokensPerRound;

        this.currentRoundInvestments[agentId] = amount;
    }

    public calculatePayoffs(): void {
        let totalPot = 0;
        const roundDetails: any = { round: this.state.round, investments: {}, roundScores: {} };

        // Ortak havuza toplananları hesapla
        for (const player of this.players) {
            const invested = this.currentRoundInvestments[player.id] || 0;
            totalPot += invested;
            roundDetails.investments[player.id] = invested;
        }

        // Havuzu çarpanla çarpıp herkese eşit dağıt (N oyucu durumu)
        const multipliedPot = totalPot * this.multiplier;
        const payoutPerPlayer = multipliedPot / this.players.length;

        // Her ajanın net kazancı = (Başlangıç parası - Yatırdığı para) + Havuzdan gelen pay
        for (const player of this.players) {
            const invested = this.currentRoundInvestments[player.id] || 0;
            const kept = this.initialTokensPerRound - invested;
            const roundEarnings = kept + payoutPerPlayer;

            this.state.scores[player.id] += roundEarnings;
            roundDetails.roundScores[player.id] = roundEarnings;
        }

        this.state.history.push(roundDetails);
        this.currentRoundInvestments = {}; // Sıfırla
    }

    public async startRound(): Promise<void> {
        console.log(`\n--- Public Goods Game: Tur ${this.state.round} Başlıyor ---`);
    }

    public isGameOver(): boolean {
        return this.state.round > this.state.maxRounds;
    }
}
