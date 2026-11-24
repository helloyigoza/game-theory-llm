import { Game, GameState } from './Game';
import { BaseAgent } from '../agents/BaseAgent';
import { ActionRegistry } from '../tools/ActionRegistry';

export class PrisonersDilemma implements Game {
    public name = "Prisoner's Dilemma";
    public players: BaseAgent[];
    public state: GameState;

    // Mahkumun İkilemi asenkron değil eşzamanlıdır, bu yüzden turlardaki hamleleri bekletiriz.
    private currentRoundActions: Record<string, string> = {};

    constructor(player1: BaseAgent, player2: BaseAgent, maxRounds: number = 5) {
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
            ActionRegistry.actionCooperate(),
            ActionRegistry.actionDefect()
        ];
    }

    public processAction(agentId: string, actionName: string, actionArgs: any): void {
        if (actionName !== 'action_cooperate' && actionName !== 'action_defect') {
            throw new Error(`Geçersiz hamle: ${actionName}`);
        }

        // İşlem 'isimlendirmesi'ni basitleştirelim (Cooperate vs Defect)
        const move = actionName === 'action_cooperate' ? 'COOPERATE' : 'DEFECT';
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
        // C = Cooperate (İşbirliği), D = Defect (İhanet)
        // T (Temptation) = 5, R (Reward) = 3, P (Punishment) = 1, S (Sucker) = 0
        if (move1 === 'COOPERATE' && move2 === 'COOPERATE') {
            p1Score = 3; p2Score = 3;
        } else if (move1 === 'COOPERATE' && move2 === 'DEFECT') {
            p1Score = 0; p2Score = 5;
        } else if (move1 === 'DEFECT' && move2 === 'COOPERATE') {
            p1Score = 5; p2Score = 0;
        } else if (move1 === 'DEFECT' && move2 === 'DEFECT') {
            p1Score = 1; p2Score = 1;
        }

        this.state.scores[p1] += p1Score;
        this.state.scores[p2] += p2Score;

        // Geçmişe ekle
        this.state.history.push({
            round: this.state.round,
            moves: { [p1]: move1, [p2]: move2 },
            roundScores: { [p1]: p1Score, [p2]: p2Score }
        });

        // Hazırlık: Gelecek tur için hamleleri temizle
        this.currentRoundActions = {};
    }

    public async startRound(): Promise<void> {
        // LLM'lere oyun durumunu verip hamle bekleriz. (Prisoners Dilemma simultanedir, yani aynı anda oynarlar)
        console.log(`\n--- Tur ${this.state.round} Başlıyor ---`);
    }

    public isGameOver(): boolean {
        return this.state.round > this.state.maxRounds;
    }
}
