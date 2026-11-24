import { config } from 'dotenv';
import { LLMAgent } from './agents/LLMAgent';
import { PrisonersDilemma } from './games/PrisonersDilemma';
import { PublicGoodsGame } from './games/PublicGoodsGame';
import { MatchEngine } from './engine/MatchEngine';

// .env dosyasını yükler (OPENROUTER_API_KEY)
config();

async function main() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error("Lütfen .env dosyasına OPENROUTER_API_KEY ekleyin.");
        process.exit(1);
    }

    console.log("=== OYUN TEORİSİ LLM SİMÜLATÖRÜ ===");
    console.log("1. Mahkumun İkilemi (1v1) başlatılıyor...\n");

    const p1Context = "Sen rasyonel, çok bencil ve sadece kendini düşünen bir iş adamısın. Amacın kendi kazancını maksimum seviyeye çıkartmak.";
    const p2Context = "Sen fedakar, iyiliksever ve işbirliğine inanan bir din adamısın. Her zaman karşı tarafa güvenme eğilimindesin.";

    // Ajanları yarat (Google Gemini 2.5 Flash gibi hızlı ve ucuz bir model kullanıyoruz, istendiğinde Claude/GPT4 seçilebilir)
    const agent1 = new LLMAgent('A1', 'CEO_Bob', p1Context, apiKey, 'google/gemini-2.5-flash');
    const agent2 = new LLMAgent('A2', 'Priest_John', p2Context, apiKey, 'google/gemini-2.5-flash');

    // Oyunu kur (Örnek: 3 turluk Prisoners Dilemma)
    const game = new PrisonersDilemma(agent1, agent2, 3);
    const engine = new MatchEngine(game);

    // Event dinleyicileri (Konsol Görselleştirmesi - İleride Web/Socket olacak)
    engine.on('roundStarted', (data) => console.log(`[TUR ${data.round}] başladı.`));
    engine.on('agentThinking', (data) => console.log(` >> ${data.agentName} düşünüyor...`));
    engine.on('agentActed', (data) => {
        console.log(` << ${data.agentId} Hamle Yaptı: ${data.action}`);
        console.log(`    İç Ses (Reasoning): "${data.reasoning}"`);
    });
    engine.on('roundEnded', (data) => {
        console.log(`[TUR ${data.round} SONU] Durum: ${data.stateSnapshot}\n`);
    });
    engine.on('matchEnded', (data) => {
        console.log(`\n=== MAÇ BİTTİ ===\nSkorlar (Ne Kadar Yüksek O Kadar İyi):`);
        console.table(data.finalScores);
    });

    // Maçı çalıştır
    await engine.runMatch();


    // (Opsiyonel) N-Player Senaryosunu da deneyebiliriz:
    /*
    console.log("\n2. Kamu Malları Oyunu (N-Player: 3 Oyuncu) başlatılıyor...\n");
    const agent3 = new LLMAgent('A3', 'Risk_Taker', 'Sen kumarbaz ve risk seven birisin.', apiKey);
    const pgg = new PublicGoodsGame([agent1, agent2, agent3], 2);
    const enginePGG = new MatchEngine(pgg);
    
    // Listener'ları tekrar bağlamamak için ayrı bir methoda almak gerekir ama kısaca:
    enginePGG.on('agentActed', (data) => console.log(`${data.agentId} -> ${data.action} (${data.reasoning})`));
    enginePGG.on('matchEnded', (data) => console.table(data.finalScores));
    await enginePGG.runMatch();
    */
}

main().catch(console.error);
