import { EventEmitter } from 'events';
import { Game } from '../games/Game';

/**
 * Karşılaşma Yöneticisi (Match Engine)
 * Oyunu baştan sona çalıştıran, event'leri (olayları) dışarıya (örneğin WebUI'ye) yayınlayan ana motor.
 */
export class MatchEngine extends EventEmitter {
    private game: Game;

    constructor(game: Game) {
        super();
        this.game = game;
    }

    public async runMatch(): Promise<void> {
        this.emit('matchStarted', { game: this.game.name, players: this.game.players.map(p => p.name) });

        while (!this.game.isGameOver()) {
            await this.game.startRound();

            // Eğer Oyun Diplomacy ise ve Müzakere ise, kime ne mesaj geldiğini Ajanın History'sine (Promptuna) basalım.
            if ((this.game as any).state && (this.game as any).state.phase === 'NEGOTIATION') {
                const diplomacyState = (this.game as any).state;
                // Önceki turdan gelen mesajları ajanlara sun
                for (const player of this.game.players) {
                    const messagesTargetingMe = diplomacyState.secretMessages.filter((m: any) => m.to === player.name && m.round === diplomacyState.round);
                    if (messagesTargetingMe.length > 0) {
                        let combinedMsg = "DİKKAT: Diğer ülkelerden gizli mesajlar aldın:\n";
                        for (const msg of messagesTargetingMe) {
                            combinedMsg += `[Kimden: ${msg.from}]: "${msg.message}"\n`;
                        }
                        player.updateMemory(combinedMsg);
                    }
                }
            }

            this.emit('roundStarted', {
                round: this.game.state.round,
                phase: (this.game as any).state?.phase || 'ACTION'
            });

            const actionPromises = this.game.players.map(async (player) => {
                this.emit('agentThinking', { agentId: player.id, agentName: player.name });

                try {
                    const availableTools = this.game.getAvailableActions(player.id);
                    const decision = await player.act(this.game.state, availableTools);

                    // Log the correct action and reasoning
                    let reasoningStr = decision.arguments.reasoning || '';
                    this.emit('agentActed', {
                        agentId: player.id,
                        action: decision.action,
                        reasoning: reasoningStr,
                        args: decision.arguments
                    });

                    this.game.processAction(player.id, decision.action, decision.arguments);
                } catch (error: any) {
                    console.error(`[ERROR] ${player.name} hamle yaparken hata ile karşılaştı:`, error.message);
                    this.emit('agentError', { agentId: player.id, error: error.message });
                    throw error;
                }
            });

            await Promise.all(actionPromises);

            // Fazın sonunda hesaplamaları yap
            const oldPhase = (this.game as any).state?.phase;
            this.game.calculatePayoffs();
            const newPhase = (this.game as any).state?.phase;

            this.emit('roundEnded', {
                round: this.game.state.round,
                stateSnapshot: JSON.stringify(this.game.state)
            });

            // Eğer oyun Diplomacy ise tur atlama mantığı ACTION bittikçe olur
            if (oldPhase && newPhase) {
                if (oldPhase === 'ACTION' && newPhase === 'NEGOTIATION') {
                    this.game.state.round++;
                }
            } else {
                // Standart oyunlar her çağrıda Tur atlar
                this.game.state.round++;
            }
        }

        this.emit('matchEnded', { finalScores: this.game.state.scores });
    }
}
