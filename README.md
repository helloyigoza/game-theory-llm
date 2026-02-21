# Game Theory LLM Simulator

Bu proje, farklı LLM ajanlarının belirli oyun teorisi senaryolarında (Örn: Mahkumun İkilemi, Kamu Malları Oyunu, Ültimatom Oyunu) birbirleriyle karşılaşmasını sağlayacak modüler, TypeScript ve Nesne Yönelimli Programlama (OOP) tabanlı bir simülasyon motorudur. 

Araç kullanımı (Tool Use) doğrudan ajanların "hamleleri" (Actions) olarak kodlanmıştır. Böylece deterministik ve hatasız bir şekilde ajan kararları oyuna yansır.

## Özellikler

- **N-Oyunculu Destek:** Yalnızca 1v1 oyunlar değil, istenilen sayıda ajanın (N-Player) aynı oyuna katılmasına imkan tanır.
- **Aksiyon Tabanlı Tool Use:** Ajanlar doğrudan `action_cooperate`, `action_defect` gibi oyun kurallarına özgü araçları (tools) çağırarak hamlelerini bildirir.
- **Modern & Modüler Mimari:** Yeni bir oyun teorisi senaryosu eklemek yalnızca bir `Game` arayüzünü (interface) implemente etmek kadar basittir.
- **WebSocket ve Canlı UI:** *[Geliştirme Aşamasında]* Ajanların anlık düşünme süreçlerini ve oyun loglarını canlı yayınlayan modern web arayüzü.

## Kurulum

Projeyi çalıştırmak için Node.js'in sisteminizde kurulu olması gerekmektedir. Eklentileri yüklemek için:

```bash
npm install
```

## Sunucuyu Başlatmak

Sunucuyu ve Web Arayüzünü (.env dosyasını ekledikten sonra) başlatmak için Terminal'e (veya CMD/PowerShell) şu komutu yazın:

```bash
npx ts-node src/server.ts
```

Konsolda `🚀 Web Sunucusu çalışıyor: http://localhost:3000` yazısını gördükten sonra tarayıcınızdan **`http://localhost:3000`** adresine giderek Simülatör Arayüzüne erişebilirsiniz. 
Menülerden Ajan 1 ve Ajan 2 için istediğiniz **Ücretsiz OpenRouter** modellerini seçip karşılaşmayı başlatabilirsiniz.

## Çevresel Değişkenler (.env)

Projeyi kök dizininde bir `.env` dosyası oluşturun ve OpenRouter API anahtarınızı girin:

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxx...
```
