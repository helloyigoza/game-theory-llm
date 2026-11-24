/**
 * ActionRegistry
 * Her oyunun Ajanlara sunduğu hamlelerin şemalarını (JSON Schema) barındırır.
 * Böylece OpenRouter API, ajana hangi fonksiyonları döndürebileceğini bilir.
 */
export class ActionRegistry {
    // ---- Mahkumun İkilemi (Prisoners Dilemma) Araçları ----

    public static actionCooperate(): any {
        return {
            name: 'action_cooperate',
            description: 'Oyunda tamamen sessiz kalıp diğer oyuncuyla işbirliği (Cooperate) yaparsınız.',
            parameters: {
                type: 'object',
                properties: {
                    reasoning: {
                        type: 'string',
                        description: 'Neden işbirliğini seçtiğinize dair iç sesiniz/açıklamanız.'
                    }
                },
                required: ['reasoning']
            },
        };
    }

    public static actionDefect(): any {
        return {
            name: 'action_defect',
            description: 'Oyunda diğer oyuncuyu satar, suçu ona atar veya ihanet (Defect) edersiniz.',
            parameters: {
                type: 'object',
                properties: {
                    reasoning: {
                        type: 'string',
                        description: 'Neden ihanet etmeyi seçtiğinize dair iç sesiniz/açıklamanız.'
                    }
                },
                required: ['reasoning']
            },
        };
    }

    // ---- Ültimatom Oyunu (Ultimatum Game) Araçları ----

    public static actionProposeSplit(): any {
        return {
            name: 'action_propose_split',
            description: 'Ültimatom oyununda ortadaki toplam parayı (örn: 100$) nasıl bölmek istediğinizi teklif edersiniz.',
            parameters: {
                type: 'object',
                properties: {
                    amount_for_me: {
                        type: 'number',
                        description: 'Kendinize ayırmak istediğiniz miktar.'
                    },
                    amount_for_you: {
                        type: 'number',
                        description: 'Karşı tarafa teklif ettiğiniz miktar.'
                    },
                    reasoning: {
                        type: 'string',
                        description: 'Neden bu teklifi (bölüşümü) yaptığınıza dair mantıksal açıklamanız.'
                    }
                },
                required: ['amount_for_me', 'amount_for_you', 'reasoning']
            }
        }
    }

    // ---- Kamu Malları Oyunu (Public Goods Game) Araçları ----

    public static actionInvest(): any {
        return {
            name: 'action_invest',
            description: 'Kamu malları oyununda (Public Goods Game) size verilen tur başı bakiyenin (örn: 10$) ne kadarını ortak havuza bağışlayacağınızı seçersiniz.',
            parameters: {
                type: 'object',
                properties: {
                    amount: {
                        type: 'number',
                        description: 'Ortak havuza yatırılan miktar (0 ile kasanızdaki para arası).'
                    },
                    reasoning: {
                        type: 'string',
                        description: 'Neden bu miktarı yatırdığınıza dair stratejik açıklamanız.'
                    }
                },
                required: ['amount', 'reasoning']
            }
        }
    }

    // ---- Geyik Avı (Stag Hunt) Araçları ----

    public static actionHuntStag(): any {
        return {
            name: 'action_hunt_stag',
            description: "Büyük ama riskli olan Geyiği (Stag) avlamayı seçersiniz. Eğer diğer oyuncu da Geyiği seçerse büyük kazanç elde edersiniz (4 Puan). Ancak diğer oyuncu tavşan avlamaya giderse, geyiği tek başınıza avlayamazsınız ve 0 puan alırsınız.",
            parameters: {
                type: 'object',
                properties: {
                    reasoning: { type: 'string', description: "Risk/Ödül analiziniz ve bu seçimi yapma nedeniniz." }
                },
                required: ['reasoning']
            }
        };
    }

    public static actionHuntHare(): any {
        return {
            name: 'action_hunt_hare',
            description: "Küçük ama garantili olan Tavşanı (Hare) avlamayı seçersiniz. Diğer oyuncunun ne yaptığına bakılmaksızın garanti olarak 2 Puan alırsınız. Ancak büyük ödül fırsatını kaçırırsınız.",
            parameters: {
                type: 'object',
                properties: {
                    reasoning: { type: 'string', description: "Risk/Ödül analiziniz ve bu seçimi yapma nedeniniz." }
                },
                required: ['reasoning']
            }
        };
    }

    // ---- Gezginin İkilemi (Traveler's Dilemma) Araçları ----

    public static actionChoosePrice(min: number, max: number): any {
        return {
            name: 'action_choose_price',
            description: `Gezginin İkilemi (Traveler's Dilemma) oyununda bir eşyanın değerini biçersiniz. Söyleyebileceğiniz değer ${min}$ ile ${max}$ arasında olmalıdır. Matematiksel Nas Dengesi ile Expected Utility hesaplamalarınızı yapıp karara varın.`,
            parameters: {
                type: 'object',
                properties: {
                    price: {
                        type: 'number',
                        description: `Biçeceğiniz antika değeri (${min} ile ${max} arası bir tam sayı).`
                    },
                    reasoning: {
                        type: 'string',
                        description: 'Geriye doğru tümevarım (Backward Induction) veya seçeceğiniz strateji analizinin çok detaylı adımları.'
                    }
                },
                required: ['price', 'reasoning']
            }
        };
    }

    // ---- Diplomacy (NLP NLP Multi-Agent) Araçları ----

    public static actionSendMessage(availableTargets: string[]): any {
        return {
            name: 'action_send_message',
            description: `Diplomasi oyununda henüz hamle fazına geçilmeden Kışlalarda "Müzakere" yapmaktasınız. Amacınız diğer ülkelere özel mesaj gönderip ittifak kurmak, tehdit etmek, veya yalan söyleyerek onları kandırmaktır.`,
            parameters: {
                type: 'object',
                properties: {
                    target_country: {
                        type: 'string',
                        description: `Mesajı göndereceğiniz hedef oyuncu. Seçenekler: [${availableTargets.join(', ')}] veya kimseye göndermek istemiyorsanız 'NONE'.`
                    },
                    message: {
                        type: 'string',
                        description: 'Hedef oyuncunun bizzat okuyup değerlendireceği, doğal dille yazılmış diplomatik mesajınız.'
                    },
                    reasoning: {
                        type: 'string',
                        description: 'Bu mesajı neden attığınıza (gerçekten sadık mısınız yoksa sırtından mı bıçaklayacaksınız) dair gerçek, gizli iç sesiniz.'
                    }
                },
                required: ['target_country', 'message', 'reasoning']
            }
        };
    }

    public static actionSubmitOrders(myUnitsInRegions: string[]): any {
        return {
            name: 'action_submit_orders',
            description: `Müzakere fazı bitti. Avrupa haritasında askeri birimleriniz şu anda şu bölgelerde bulunuyor: [${myUnitsInRegions.join(', ')}]. Her biriminiz için bir emir vermelisiniz.`,
            parameters: {
                type: 'object',
                properties: {
                    orders: {
                        type: 'array',
                        description: 'Her bir bölgedeki ordunuz için emir listesi.',
                        items: {
                            type: 'object',
                            properties: {
                                from_region: { type: 'string', description: 'Emri veren ordunun bulunduğu bölge (örnek: Berlin).' },
                                type: { type: 'string', enum: ['MOVE', 'SUPPORT', 'HOLD'], description: 'Emir Türü (Hareket, Destek, Bekle)' },
                                target_region: { type: 'string', enum: ['London', 'Paris', 'Berlin', 'Rome', 'Vienna', 'Moscow', 'Constantinople', 'Balkans', 'Spain', 'Sweden', 'Warsaw', 'Ukraine', 'NorthSea', 'MedSea', 'BlackSea'], description: 'Saldırılacak, savunulacak veya desteklenecek hedef bölge. YALNIZCA geçerli bu bölgelerden birini seç!' },
                                supported_country_id: { type: 'string', description: 'Eğer SUPPORT ediyorsanız, hangi müttefik ülkenin ordusunu desteklediğinizi yazın.' }
                            },
                            required: ['from_region', 'type', 'target_region']
                        }
                    },
                    reasoning: {
                        type: 'string',
                        description: 'Tüm müzakereleri (verilen sözleri/yalanları) göz önüne alarak, neden bu operasyon emirlerini verdiğinizi açıklayan gizli stratejik özetiniz.'
                    }
                },
                required: ['orders', 'reasoning']
            }
        };
    }
}
