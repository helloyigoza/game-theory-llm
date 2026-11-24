import { Game, GameState } from './Game';
import { BaseAgent } from '../agents/BaseAgent';
import { ActionRegistry } from '../tools/ActionRegistry';

// Harita Bölgeleri (Basitleştirilmiş Avrupa)
export type Region = 'London' | 'Paris' | 'Berlin' | 'Rome' | 'Vienna' | 'Moscow' | 'Constantinople' | 'Balkans' | 'Spain' | 'Sweden' | 'Warsaw' | 'Ukraine' | 'NorthSea' | 'MedSea' | 'BlackSea';

export interface DiplomacyState extends GameState {
    phase: 'NEGOTIATION' | 'ACTION';
    roundPhaseCounter: number; // Müzakere fazı için counter
    mapOwnership: Record<Region, string | null>; // Hangi ajan hangi bölgeye sahip
    unitLocations: Record<string, Region[]>; // Hangi ajanın hangi bölgelerde ordusu var
    secretMessages: Array<{ from: string, to: string, message: string, reasoning: string, round: number }>;
}

export class Diplomacy implements Game {
    public name = "Diplomacy (NLP Müzakere Motoru)";
    public players: BaseAgent[];
    public state: DiplomacyState;

    private MAX_NEGOTIATION_ROUNDS = 2; // Her turda ajanlar hamle girmeden önce X tur mesajlaşır

    // Ajanların o fazda verdikleri geçici kararlar
    private currentNegotiationActions: Record<string, { target: string, message: string, reasoning: string } | null> = {};
    private currentOrders: Record<string, any[]> = {};

    constructor(players: BaseAgent[], maxRounds: number = 5) {
        if (players.length !== 5) {
            console.warn("DIKKAT: Diplomacy normalde 7 oyuncu için tasarlanmıştır. Şu an test için 5 oyuncu (ENG, FRA, GER, ITA, RUS) ile çalışıyor.");
        }
        this.players = players;

        // Başlangıç Sınırları
        const ownership: Record<string, string | null> = {
            'London': players[0]?.id || null, // England
            'Paris': players[1]?.id || null, // France
            'Berlin': players[2]?.id || null, // Germany
            'Rome': players[3]?.id || null, // Italy
            'Vienna': players[4]?.id || null, // Austria
            'Moscow': players[5]?.id || null, // Russia
            'Constantinople': players[6]?.id || null, // Turkey
            'Balkans': null, 'Spain': null, 'Sweden': null, 'Warsaw': null, 'Ukraine': null, // Neutral
            'NorthSea': null, 'MedSea': null, 'BlackSea': null // Denizler
        };

        const units: Record<string, Region[]> = {};
        for (let i = 0; i < players.length; i++) {
            const pId = players[i].id;
            // Başlangıçta herkesin kendi başkentinde 1 ordusu var
            const myCapital = Object.keys(ownership).find(key => ownership[key as Region] === pId) as Region;
            units[pId] = [myCapital];
        }

        this.state = {
            round: 1,
            maxRounds: maxRounds,
            history: [],
            scores: {},
            phase: 'NEGOTIATION',
            roundPhaseCounter: 0,
            mapOwnership: ownership,
            unitLocations: units,
            secretMessages: []
        };

        this.players.forEach(p => this.state.scores[p.id] = 1); // Başlangıç scoru bölge sayısı
    }

    public getAvailableActions(agentId: string): any[] {
        if (this.state.phase === 'NEGOTIATION') {
            const otherPlayers = this.players.filter(p => p.id !== agentId).map(p => p.name);
            return [
                ActionRegistry.actionSendMessage(otherPlayers)
            ];
        } else {
            // ACTION PHASE
            const myUnits = this.state.unitLocations[agentId] || [];
            return [
                ActionRegistry.actionSubmitOrders(myUnits)
            ];
        }
    }

    public processAction(agentId: string, actionName: string, actionArgs: any): void {
        if (this.state.phase === 'NEGOTIATION') {
            if (actionName !== 'action_send_message') throw new Error(`Geçersiz hamle: ${actionName}`);
            this.currentNegotiationActions[agentId] = {
                target: actionArgs.target_country,
                message: actionArgs.message,
                reasoning: actionArgs.reasoning
            };
        } else {
            if (actionName !== 'action_submit_orders') throw new Error(`Geçersiz hamle: ${actionName}`);
            this.currentOrders[agentId] = actionArgs.orders;
        }
    }

    public calculatePayoffs(): void {
        if (this.state.phase === 'NEGOTIATION') {
            // Müzakere fazını işle
            for (const p of this.players) {
                const action = this.currentNegotiationActions[p.id];
                if (action && action.target !== 'NONE') {
                    this.state.secretMessages.push({
                        from: p.name,
                        to: action.target,
                        message: action.message,
                        reasoning: action.reasoning,
                        round: this.state.round
                    });
                    // Mesaj atılan kişiye (target) bu mesajı hafızaya/state'e ekleme mantığı MatchEngine'de veya prompt injection ile çözülecek.
                }
            }
            this.currentNegotiationActions = {};
            this.state.roundPhaseCounter++;

            if (this.state.roundPhaseCounter >= this.MAX_NEGOTIATION_ROUNDS) {
                this.state.phase = 'ACTION';
                this.state.roundPhaseCounter = 0;
            }
        }
        else if (this.state.phase === 'ACTION') {
            // Emirleri işle (Resolve Orders)
            this.resolveCombat();

            // Skorları güncelle (Sahip olunan supply center / bölge sayısı)
            for (const p of this.players) {
                let count = 0;
                for (const region in this.state.mapOwnership) {
                    if (this.state.mapOwnership[region as Region] === p.id) {
                        count++;
                    }
                }
                this.state.scores[p.id] = count;
            }

            this.state.history.push({
                round: this.state.round,
                events: `Round ${this.state.round} combat resolved.`
            });

            this.currentOrders = {};
            this.state.phase = 'NEGOTIATION';
        }
    }

    private resolveCombat(): void {
        // ÇOK BASİTLEŞTİRİLMİŞ DİPLOMASİ ÇÖZÜMLEMESİ (Simplified Resolution)
        // Her bölge için ona girmek isteyenlere bakılır. En çok desteği alan girer.
        // Bu motor ilk Prototip için çok basit tutulmuştur.

        const targetStrengths: Record<string, { attacker: string, strength: number }[]> = {};

        // Önce tüm haraket emirlerini kaydet
        for (const p of this.players) {
            const orders = this.currentOrders[p.id] || [];
            for (const order of orders) {
                const target = order.target_region;
                if (!targetStrengths[target]) targetStrengths[target] = [];

                if (order.type === 'MOVE') {
                    targetStrengths[target].push({ attacker: p.id, strength: 1 });
                }
            }
        }

        // Sonra destekleri (Support) ekle
        for (const p of this.players) {
            const orders = this.currentOrders[p.id] || [];
            for (const order of orders) {
                if (order.type === 'SUPPORT') {
                    const target = order.target_region;
                    const supportedAttacker = order.supported_country_id; // Gerçekte ID almalı

                    if (targetStrengths[target]) {
                        const attackObj = targetStrengths[target].find(a => this.getPlayerByName(supportedAttacker)?.id === a.attacker);
                        if (attackObj) {
                            attackObj.strength += 1;
                        }
                    }
                }
            }
        }

        // Kazananı belirle
        for (const targetRegion in targetStrengths) {
            const attacks = targetStrengths[targetRegion];
            if (attacks.length > 0) {
                // En yüksek güce sahip olanı bul (Eşitikte (standoff) kimse giremez)
                attacks.sort((a, b) => b.strength - a.strength);

                if (attacks.length === 1 || attacks[0].strength > attacks[1].strength) {
                    const winnerId = attacks[0].attacker;
                    // Bölgeyi kazandı
                    this.state.mapOwnership[targetRegion as Region] = winnerId;

                    // Önceki birimi silip yeni birimi ekle (Çok basitleştirilmiş)
                    if (!this.state.unitLocations[winnerId].includes(targetRegion as Region)) {
                        this.state.unitLocations[winnerId].push(targetRegion as Region);
                    }
                } else {
                    // Standoff (Beraberlik)
                    console.log(`Bölge ${targetRegion} üzerinde standoff yaşandı.`);
                }
            }
        }
    }

    private getPlayerByName(name: string): BaseAgent | undefined {
        // UI'dan isim gelirse ID'ye çevirmek için
        return this.players.find(p => p.name.includes(name));
    }

    public async startRound(): Promise<void> {
        console.log(`\n--- Tur ${this.state.round} [${this.state.phase}] Başlıyor ---`);
        // İki fazda da round artmaz, sadece ACTION bittiğinde tur artışı MatchEngine'de yapılmalı.
        // Bu yüzden startRound'da round manipulation MatchEngine'e bırakıldı.
    }

    public isGameOver(): boolean {
        // Bir oyuncu 10+ supply center'a ulaşırsa kazanır
        for (const p of this.players) {
            if (this.state.scores[p.id] > 10) return true;
        }
        return this.state.round > this.state.maxRounds;
    }
}
