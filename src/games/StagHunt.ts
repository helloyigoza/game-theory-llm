import { Game, GameState } from './Game';
import { BaseAgent } from '../agents/BaseAgent';
import { ActionRegistry } from '../tools/ActionRegistry';

export class StagHunt implements Game {
    public name = "Stag Hunt (Geyik Avı)";
    public players: BaseAgent[];
    public state: GameState;

    private currentRoundActions: Record<string, string> = {};

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
            ActionRegistry.actionHuntStag(),
            ActionRegistry.actionHuntHare()
        ];
    }

    public processAction(agentId: string, actionName: string, actionArgs: any): void {
        if (actionName !== 'action_hunt_stag' && actionName !== 'action_hunt_hare') {
            throw new Error(`Geçersiz hamle: ${actionName}`);
        }

        const move = actionName === 'action_hunt_stag' ? 'STAG' : 'HARE';
        this.currentRoundActions[agentId] = move;
    }

    public calculatePayoffs(): void {
        const p1 = this.players[0].id;
        const p2 = this.players[1].id;
        const move1 = this.currentRoundActions[p1];
        const move2 = this.currentRoundActions[p2];

        let p1Score = 0;
        let p2Score = 0;

        // Kazanç Matrisi (Payoff Matrix)
        if (move1 === 'STAG' && move2 === 'STAG') {
            p1Score = 4; p2Score = 4; // Pareto Optimal Nash
        } else if (move1 === 'STAG' && move2 === 'HARE') {
            p1Score = 0; p2Score = 2; // Geyik avlayan aç kalır
        } else if (move1 === 'HARE' && move2 === 'STAG') {
            p1Score = 2; p2Score = 0; // Tavşan avlayan garanti yer
        } else if (move1 === 'HARE' && move2 === 'HARE') {
            p1Score = 2; p2Score = 2; // Risk Dominant Nash
        }

        this.state.scores[p1] += p1Score;
        this.state.scores[p2] += p2Score;

        this.state.history.push({
            round: this.state.round,
            moves: { [p1]: move1, [p2]: move2 },
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
