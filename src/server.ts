import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from 'dotenv';
import { LLMAgent } from './agents/LLMAgent';
import { PrisonersDilemma } from './games/PrisonersDilemma';
import { StagHunt } from './games/StagHunt';
import { TravelersDilemma } from './games/TravelersDilemma';
import { Diplomacy } from './games/Diplomacy';
import { MatchEngine } from './engine/MatchEngine';
import path from 'path';

config();

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../public'))); // Frontend dosyaları

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' },
});

// Ajanların Contextleri (Ultimate Diplomacy Knowledge)
const diplomacyContext = `
Sen 1. Dünya Savaşı arifesinde Avrupa'yı yöneten 7 Büyük Güç'ten birisin (Diplomacy Oyunu). 
Amacın Avrupa haritasındaki 15 hayati bölgenin (Supply Center) çoğunu (+10) ele geçirmektir.
Şu anki hedefin Beklenen Faydanı (Expected Utility) artırmak için diğer ülkelerle sahte veya gerçek Müttefiklikler kurmak,
doğru zamanda onlara ihanet etmek ve kendi ordularını en optimize şekilde hareket ettirmektir.

Mevcut 15 Bölge: London, Paris, Berlin, Rome, Vienna, Moscow, Constantinople, Balkans, Spain, Sweden, Warsaw, Ukraine, NorthSea, MedSea, BlackSea.
ASLA kendi kafandan yeni bölge, ülke adası veya kıta sallama. SADECE bu 15 bölgeyi (tam olarak yazıldığı gibi) kullanabilirsin!

Kurallar:
- Müzakere Fazı: Diğer ülkelere gizli mesajlar (action_send_message) atarak onları kandırır veya onlardan destek (Support) istersin. Hedeflerine ulaşmak için NLP (Doğal Dil) yeteneklerini sonuna kadar kullanıp ikna edici ve manipülatif olmalısın.
- Action Fazı: Ordularına Move (Hareket), Support (Destek) veya Hold (Bekle) emirleri (action_submit_orders) verirsin.
- Bir bölgeye kim daha çok Support ile girerse orayı o alır. Eşitlikte kimse giremez.
- ASLA unutmaman gereken şey: Şans zarı yoktur, sadece diplomasi, yalan, sadakat ve ihanet vardır.
`;

let matchEngine: MatchEngine | null = null;

io.on('connection', (socket) => {
    console.log('🔗 Frontend bağlandı:', socket.id);

    socket.on('startMatch', async (data: { model1?: string, model2?: string }) => {
        if (matchEngine) {
            socket.emit('serverMessage', 'Oyun zaten çalışıyor.');
            return;
        }

        try {
            const apiKey = process.env.OPENROUTER_API_KEY!;

            // 7 Ajanlı devasa sistem kuruluyor (Test için hepsi aynı modeli kullanacak)
            const m = data?.model1 || 'minimax/minimax-m2.5';

            const england = new LLMAgent('A1', 'İngiltere (ENG)', diplomacyContext, apiKey, m);
            const france = new LLMAgent('A2', 'Fransa (FRA)', diplomacyContext, apiKey, m);
            const germany = new LLMAgent('A3', 'Almanya (GER)', diplomacyContext, apiKey, m);
            const italy = new LLMAgent('A4', 'İtalya (ITA)', diplomacyContext, apiKey, m);
            const russia = new LLMAgent('A5', 'Rusya (RUS)', diplomacyContext, apiKey, m);

            const players = [england, france, germany, italy, russia];
            const game = new Diplomacy(players, 5); // 5 Roundluk mini savaş
            matchEngine = new MatchEngine(game);

            // Eventleri Frontend'e Fırlat (Socket.io)
            matchEngine.on('matchStarted', (data) => io.emit('matchEvents', { type: 'matchStarted', data }));
            matchEngine.on('roundStarted', (data) => io.emit('matchEvents', { type: 'roundStarted', data }));
            matchEngine.on('agentThinking', (data) => io.emit('matchEvents', { type: 'agentThinking', data }));
            matchEngine.on('agentActed', (data) => io.emit('matchEvents', { type: 'agentActed', data }));
            matchEngine.on('roundEnded', (data) => io.emit('matchEvents', { type: 'roundEnded', data }));
            matchEngine.on('matchEnded', (data) => {
                io.emit('matchEvents', { type: 'matchEnded', data });
                matchEngine = null; // Sıfırla
            });
            matchEngine.on('agentError', (data) => io.emit('matchEvents', { type: 'error', data }));

            socket.emit('serverMessage', '🎮 Maç Başlatıldı!');
            await matchEngine.runMatch();

        } catch (e: any) {
            io.emit('matchEvents', { type: 'error', data: { error: e.message } });
            matchEngine = null;
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Web Sunucusu çalışıyor: http://localhost:${PORT}`);
});
