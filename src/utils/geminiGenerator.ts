import { GoogleGenAI, Type } from '@google/genai';

export interface GeneratedList {
  title: string;
  description: string;
  category: string;
  pairs: {
    german: string;
    ukrainian: string;
    exampleGerman?: string;
    exampleUkrainian?: string;
  }[];
}

// Built-in offline vocabulary fallback database for static hosting (e.g. GitHub Pages)
const FALLBACK_TOPIC_POOLS: Record<string, {
  title: string;
  description: string;
  category: string;
  pairs: { german: string; ukrainian: string; exampleGerman: string; exampleUkrainian: string }[];
}> = {
  cafe: {
    title: 'Розмова в кав\'ярні та ресторані',
    description: 'Корисні фрази та слова для замовлення їжі та напоїв',
    category: 'Ресторан & Кафе',
    pairs: [
      { german: 'der Kaffee', ukrainian: 'кава', exampleGerman: 'Ich möchte einen Kaffee, bitte.', exampleUkrainian: 'Я б хотів каву, будь ласка.' },
      { german: 'die Speisekarte', ukrainian: 'меню (карта страв)', exampleGerman: 'Können wir bitte die Speisekarte haben?', exampleUkrainian: 'Можна нам меню, будь ласка?' },
      { german: 'die Rechnung', ukrainian: 'рахунок', exampleGerman: 'Wir möchten bitte bezahlen, die Rechnung bitte.', exampleUkrainian: 'Ми б хотіли розрахуватися, рахунок будь ласка.' },
      { german: 'das Wasser', ukrainian: 'вода', exampleGerman: 'Ein stilles Wasser, bitte.', exampleUkrainian: 'Воду без газу, будь ласка.' },
      { german: 'das Frühstück', ukrainian: 'сніданок', exampleGerman: 'Das Frühstück ist im Preis enthalten.', exampleUkrainian: 'Сніданок включено у вартість.' },
      { german: 'bestellen', ukrainian: 'замовляти', exampleGerman: 'Was möchten Sie bestellen?', exampleUkrainian: 'Що ви бажаєте замовити?' },
      { german: 'das Trinkgeld', ukrainian: 'чайові', exampleGerman: 'Stimmt so, behalten Sie das Trinkgeld.', exampleUkrainian: 'Решти не треба, залишіть чайові собі.' },
      { german: 'der Kellner', ukrainian: 'офіціант', exampleGerman: 'Der Kellner bringt das Essen.', exampleUkrainian: 'Офіціант приносить їжу.' },
      { german: 'lecker', ukrainian: 'смачний', exampleGerman: 'Das Essen war sehr lecker!', exampleUkrainian: 'Їжа була дуже смачною!' },
      { german: 'Guten Appetit!', ukrainian: 'Смачного!', exampleGerman: 'Guten Appetit allen zusammen!', exampleUkrainian: 'Смачного усім!' },
      { german: 'der Tee', ukrainian: 'чай', exampleGerman: 'Möchten Sie einen grünen Tee?', exampleUkrainian: 'Бажаєте зелений чай?' },
      { german: 'reservieren', ukrainian: 'бронювати', exampleGerman: 'Ich möchte einen Tisch für zwei Personen reservieren.', exampleUkrainian: 'Я хочу заборнювати столик на двох.' },
    ],
  },
  airport: {
    title: 'Аеропорт, вокзал та квитки',
    description: 'Навігація в транспорті, аеропортах та залізниці',
    category: 'Транспорт & Подорожі',
    pairs: [
      { german: 'der Flugsteig', ukrainian: 'вихід на посадку (гейт)', exampleGerman: 'Der Flugsteig B12 schließt gleich.', exampleUkrainian: 'Вихід B12 скоро зачиняється.' },
      { german: 'die Fahrkarte', ukrainian: 'квиток на проїзд', exampleGerman: 'Wo kann ich eine Fahrkarte kaufen?', exampleUkrainian: 'Де я можу купити квиток?' },
      { german: 'das Gepäck', ukrainian: 'багаж', exampleGerman: 'Wo ist die Gepäckabgabe?', exampleUkrainian: 'Де здача багажу?' },
      { german: 'der Bahnhof', ukrainian: 'залізничний вокзал', exampleGerman: 'Der Zug kommt am Hauptbahnhof an.', exampleUkrainian: 'Поїзд прибуває на головний вокзал.' },
      { german: 'die Verspätung', ukrainian: 'запізнення', exampleGerman: 'Der Zug hat 15 Minuten Verspätung.', exampleUkrainian: 'Поїзд запізнюється на 15 хвилин.' },
      { german: 'der Reisepass', ukrainian: 'закордонний паспорт', exampleGerman: 'Zeigen Sie bitte Ihren Reisepass.', exampleUkrainian: 'Покажіть, будь ласка, ваш паспорт.' },
      { german: 'der Abflug', ukrainian: 'виліт', exampleGerman: 'Der Abflug ist um 14:30 Uhr.', exampleUkrainian: 'Виліт о 14:30.' },
      { german: 'die Ankunft', ukrainian: 'прибуття', exampleGerman: 'Pünktliche Ankunft in München.', exampleUkrainian: 'Вчасне прибуття до Мюнхена.' },
      { german: 'der Bahnsteig', ukrainian: 'перон / платформа', exampleGerman: 'Der Zug fährt von Bahnsteig 4 ab.', exampleUkrainian: 'Поїзд відправляється з 4 колії.' },
      { german: 'umsteigen', ukrainian: 'пересідати (у транспорті)', exampleGerman: 'Sie müssen in Berlin umsteigen.', exampleUkrainian: 'Вам потрібно пересісти в Берліні.' },
    ],
  },
  housing: {
    title: 'Оренда квартири та побут',
    description: 'Слова для пошуку житла, побуту та спілкування з орендодавцем',
    category: 'Житло & Оренда',
    pairs: [
      { german: 'die Miete', ukrainian: 'орендна плата', exampleGerman: 'Die Miete beträgt 800 Euro im Monat.', exampleUkrainian: 'Орендна плата становить 800 євро на місяць.' },
      { german: 'die Nebenkosten', ukrainian: 'комунальні послуги', exampleGerman: 'Sind die Nebenkosten inklusive?', exampleUkrainian: 'Комунальні послуги включені?' },
      { german: 'der Mietvertrag', ukrainian: 'договір оренди', exampleGerman: 'Wir müssen den Mietvertrag unterschreiben.', exampleUkrainian: 'Нам потрібно підписати договір оренди.' },
      { german: 'die Kaution', ukrainian: 'застава (депозит)', exampleGerman: 'Die Kaution entspricht zwei Monatsmieten.', exampleUkrainian: 'Застава дорівнює вартості двох місяців оренди.' },
      { german: 'die Wohnung', ukrainian: 'квартира', exampleGerman: 'Die Wohnung hat drei Zimmer und einen Balkon.', exampleUkrainian: 'Квартира має три кімнати та балкон.' },
      { german: 'der Schlüssel', ukrainian: 'ключ', exampleGerman: 'Hier ist Ihr Schlüssel zur Wohnung.', exampleUkrainian: 'Ось ваш ключ від квартири.' },
      { german: 'die Heizung', ukrainian: 'опалення', exampleGerman: 'Die Heizung funktioniert im Winter gut.', exampleUkrainian: 'Опалення взимку працює добре.' },
      { german: 'der Vermieter', ukrainian: 'орендодавець (господар)', exampleGerman: 'Der Vermieter ist sehr freundlich.', exampleUkrainian: 'Господар квартири дуже привітний.' },
    ],
  },
  doctor: {
    title: 'В лікарні, аптеці та у лікаря',
    description: 'Медичні терміни, симптоми та візит до лікаря',
    category: 'Медицина & Здоров\'я',
    pairs: [
      { german: 'der Arzt', ukrainian: 'лікар', exampleGerman: 'Ich muss heute zum Arzt gehen.', exampleUkrainian: 'Мені потрібно сьогодні піти до лікаря.' },
      { german: 'die Kopfschmerzen', ukrainian: 'головний біль', exampleGerman: 'Ich habe seit gestern Kopfschmerzen.', exampleUkrainian: 'У мене з вчорашнього дня болить голова.' },
      { german: 'das Rezept', ukrainian: 'рецепт на ліки', exampleGerman: 'Der Arzt gibt mir ein Rezept für Tabletten.', exampleUkrainian: 'Лікар дає мені рецепт на таблетки.' },
      { german: 'die Apotheke', ukrainian: 'аптека', exampleGerman: 'Wo ist die nächste Apotheke?', exampleUkrainian: 'Де найближча аптека?' },
      { german: 'das Fieber', ukrainian: 'температура / гарячка', exampleGerman: 'Das Kind hat hohes Fieber.', exampleUkrainian: 'У дитини висока температура.' },
      { german: 'die Schmerzen', ukrainian: 'біль', exampleGerman: 'Haben Sie irgendwo Schmerzen?', exampleUkrainian: 'У вас десь болить?' },
      { german: 'die Krankenversicherung', ukrainian: 'медичне страхування', exampleGerman: 'Haben Sie Ihre Krankenversicherungskarte dabei?', exampleUkrainian: 'У вас із собою картка медичного страхування?' },
      { german: 'das Medikament', ukrainian: 'ліки / медикамент', exampleGerman: 'Nehmen Sie dieses Medikament dreimal täglich.', exampleUkrainian: 'Приймайте ці ліки тричі на день.' },
    ],
  },
  tech: {
    title: 'IT, програмування та робота',
    description: 'Терміни для айтівців, офісної роботи та переговорів',
    category: 'IT & Робота',
    pairs: [
      { german: 'die Softwareentwicklung', ukrainian: 'розробка програмного забезпечення', exampleGerman: 'Er arbeitet in der Softwareentwicklung.', exampleUkrainian: 'Він працює у розробці ПЗ.' },
      { german: 'die Fehlermeldung', ukrainian: 'повідомлення про помилку', exampleGerman: 'Ich bekomme eine Fehlermeldung beim Starten.', exampleUkrainian: 'Я отримую повідомлення про помилку при запуску.' },
      { german: 'das Vorstellungsgespräch', ukrainian: 'співбесіда', exampleGerman: 'Morgen habe ich ein wichtiges Vorstellungsgespräch.', exampleUkrainian: 'Завтра у мене важлива співбесіда.' },
      { german: 'die Datei', ukrainian: 'файл', exampleGerman: 'Bitte speichern Sie die Datei als PDF.', exampleUkrainian: 'Будь ласка, збережіть файл як PDF.' },
      { german: 'der Bildschirm', ukrainian: 'монітор / екран', exampleGerman: 'Mein zweiter Bildschirm ist kaputt.', exampleUkrainian: 'Мій другий монітор зламався.' },
      { german: 'das Passwort', ukrainian: 'пароль', exampleGerman: 'Ändern Sie bitte Ihr Passwort regelmäßig.', exampleUkrainian: 'Змінюйте свій пароль регулярно.' },
      { german: 'die Besprechung', ukrainian: 'нарада / мітинг', exampleGerman: 'Die Besprechung beginnt um 10 Uhr.', exampleUkrainian: 'Нарада починається о 10:00.' },
      { german: 'das Projekt', ukrainian: 'проект', exampleGerman: 'Das Projekt läuft bisher sehr gut.', exampleUkrainian: 'Проект поки що йде дуже добре.' },
    ],
  },
  idioms: {
    title: 'Німецькі фразеологізми та ідіоми',
    description: 'Жива німецька мова, крилаті вислови та фразеологізми',
    category: 'Ідіоми & Вислови',
    pairs: [
      { german: 'Ich drücke dir die Daumen!', ukrainian: 'Тримаю за тебе кулаки!', exampleGerman: 'Viel Glück bei der Prüfung, ich drücke dir die Daumen!', exampleUkrainian: 'Успіху на іспиті, тримаю за тебе кулаки!' },
      { german: 'Das ist nicht mein Bier', ukrainian: 'Це не моя справа', exampleGerman: 'Was er macht, ist nicht mein Bier.', exampleUkrainian: 'Те, що він робить — це не моя справа.' },
      { german: 'Ich verstehe nur Bahnhof', ukrainian: 'Я нічого не розумію (для мене це китайська грамота)', exampleGerman: 'Bei dieser Anleitung verstehe ich nur Bahnhof.', exampleUkrainian: 'У цій інструкції я абсолютно нічого не розумію.' },
      { german: 'Fix und fertig sein', ukrainian: 'Бути виснаженим / валитися з ніг', exampleGerman: 'Nach dem Arbeitstag bin ich fix und fertig.', exampleUkrainian: 'Після робочого дня я валюся з ніг.' },
      { german: 'Auf jeden Fall', ukrainian: 'У будь-якому разі / безумовно', exampleGerman: 'Wir kommen auf jeden Fall zum Fest.', exampleUkrainian: 'Ми безумовно прийдемо на свято.' },
      { german: 'Alles in Butter', ukrainian: 'Все в порядку / усе чудово', exampleGerman: 'Keine Sorge, es ist alles in Butter!', exampleUkrainian: 'Не хвилюйся, все в повному порядку!' },
      { german: 'Lügen haben kurze Beine', ukrainian: 'Брехнею далеко не зайдеш', exampleGerman: 'Sag die Wahrheit, denn Lügen haben kurze Beine.', exampleUkrainian: 'Кажи правду, бо брехнею далеко не зайдеш.' },
      { german: 'Daumen drücken', ukrainian: 'Бажати успіху / тримати кулаки', exampleGerman: 'Danke fürs Daumen drücken!', exampleUkrainian: 'Дякую, що тримали кулаки!' },
    ],
  },
  shopping: {
    title: 'Покупки в супермаркеті та одяг',
    description: 'Назви продуктів, покупка одягу та спілкування в магазині',
    category: 'Покупки & Магазини',
    pairs: [
      { german: 'der Einkaufswagen', ukrainian: 'візок для покупок', exampleGerman: 'Nehmen Sie bitte einen Einkaufswagen.', exampleUkrainian: 'Візьміть, будь ласка, візок для покупок.' },
      { german: 'die Kasse', ukrainian: 'каса', exampleGerman: 'Die Kasse ist am Ausgang.', exampleUkrainian: 'Каса розташована біля виходу.' },
      { german: 'das Angebot', ukrainian: 'знижка / акційна пропозиція', exampleGerman: 'Kaffee ist diese Woche im Angebot.', exampleUkrainian: 'Кава цього тижня за акцією.' },
      { german: 'die Tüte', ukrainian: 'пакет', exampleGerman: 'Brauchen Sie eine Tüte?', exampleUkrainian: 'Вам потрібен пакет?' },
      { german: 'die Umkleidekabine', ukrainian: 'примірочна кабіна', exampleGerman: 'Wo ist die Umkleidekabine?', exampleUkrainian: 'Де знаходиться примірочна?' },
      { german: 'anprobieren', ukrainian: 'приміряти', exampleGerman: 'Kann ich diese Hose anprobieren?', exampleUkrainian: 'Можна мені приміряти ці штани?' },
      { german: 'die Größe', ukrainian: 'розмір', exampleGerman: 'Haben Sie das Hemd in Größe M?', exampleUkrainian: 'У вас є ця сорочка в розмірі M?' },
      { german: 'das Gemüse', ukrainian: 'овочі', exampleGerman: 'Frisches Gemüse ist gesund.', exampleUkrainian: 'Свіжі овочі корисні.' },
    ],
  },
  weather: {
    title: 'Погода, природа та копалини',
    description: 'Слова про привабливу природу, погоду та довкілля',
    category: 'Природа & Погода',
    pairs: [
      { german: 'das Wetter', ukrainian: 'погода', exampleGerman: 'Das Wetter ist heute wunderschön.', exampleUkrainian: 'Погода сьогодні дивовижна.' },
      { german: 'die Sonne', ukrainian: 'сонце', exampleGerman: 'Die Sonne scheint den ganzen Tag.', exampleUkrainian: 'Сонце світить цілий день.' },
      { german: 'der Regen', ukrainian: 'дощ', exampleGerman: 'Nimm einen Regenschirm, es gibt Regen.', exampleUkrainian: 'Візьми парасольку, йде дощ.' },
      { german: 'der Wind', ukrainian: 'вітер', exampleGerman: 'Der Wind weht sehr stark.', exampleUkrainian: 'Вітер дме дуже сильно.' },
      { german: 'die Gewitter', ukrainian: 'гроза', exampleGerman: 'Am Abend gibt es ein Gewitter.', exampleUkrainian: 'Увечері буде гроза.' },
      { german: 'der Schnee', ukrainian: 'сніг', exampleGerman: 'Im Winter liegt hier viel Schnee.', exampleUkrainian: 'Взимку тут лежить багато снігу.' },
      { german: 'der Wald', ukrainian: 'ліс', exampleGerman: 'Wir machen einen Spaziergang im Wald.', exampleUkrainian: 'Ми гуляємо у лісі.' },
      { german: 'der Berg', ukrainian: 'гора', exampleGerman: 'Die Berge sehen im Nebel fantastisch aus.', exampleUkrainian: 'Гори у тумані виглядають фантастично.' },
    ],
  },
  general: {
    title: 'Загальний набір корисних слів',
    description: 'Базовий словниковий запас для щоденного спілкування',
    category: 'Загальна тема',
    pairs: [
      { german: 'die Kommunikation', ukrainian: 'спілкування', exampleGerman: 'Gute Kommunikation ist wichtig.', exampleUkrainian: 'Хороше спілкування є важливим.' },
      { german: 'die Erfahrung', ukrainian: 'досвід', exampleGerman: 'Ich habe viel Erfahrung in dieser Arbeit.', exampleUkrainian: 'Я маю великий досвід у цій роботі.' },
      { german: 'die Entscheidung', ukrainian: 'рішення', exampleGerman: 'Das ist eine schwere Entscheidung.', exampleUkrainian: 'Це важке рішення.' },
      { german: 'die Lösung', ukrainian: 'рішення / розв\'язання', exampleGerman: 'Wir finden bestimmt eine gute Lösung.', exampleUkrainian: 'Ми неодмінно знайдемо хороше рішення.' },
      { german: 'die Möglichkeit', ukrainian: 'можливість', exampleGerman: 'Das ist eine tolle Möglichkeit zum Lernen.', exampleUkrainian: 'Це чудова можливість для навчання.' },
      { german: 'die Zukunft', ukrainian: 'майбутнє', exampleGerman: 'Wir planen unsere Zukunft gemeinsam.', exampleUkrainian: 'Ми плануємо наше майбутнє разом.' },
      { german: 'der Erfolg', ukrainian: 'успіх', exampleGerman: 'Ich wünsche dir viel Erfolg!', exampleUkrainian: 'Бажаю тобі великого успіху!' },
      { german: 'die Freiheit', ukrainian: 'свобода', exampleGerman: 'Freiheit ist ein hohes Gut.', exampleUkrainian: 'Свобода — це велика цінність.' },
    ],
  },
};

/**
 * Selects or builds a matching fallback vocabulary list client-side
 */
export function getFallbackList(topic: string, difficulty: string, pairCount: number): GeneratedList {
  const cleanTopic = topic.toLowerCase();

  let poolKey = 'general';

  if (cleanTopic.includes('кав') || cleanTopic.includes('ресторан') || cleanTopic.includes('їж') || cleanTopic.includes('напо')) poolKey = 'cafe';
  else if (cleanTopic.includes('аеро') || cleanTopic.includes('вокзал') || cleanTopic.includes('квит') || cleanTopic.includes('транспорт') || cleanTopic.includes('подорож')) poolKey = 'airport';
  else if (cleanTopic.includes('оренд') || cleanTopic.includes('квартир') || cleanTopic.includes('житл') || cleanTopic.includes('побут')) poolKey = 'housing';
  else if (cleanTopic.includes('лікар') || cleanTopic.includes('аптек') || cleanTopic.includes('хворо') || cleanTopic.includes('медиц') || cleanTopic.includes('здоров')) poolKey = 'doctor';
  else if (cleanTopic.includes('it') || cleanTopic.includes('програм') || cleanTopic.includes('робот') || cleanTopic.includes('офіс') || cleanTopic.includes('комп')) poolKey = 'tech';
  else if (cleanTopic.includes('ідіом') || cleanTopic.includes('фразео') || cleanTopic.includes('вислов')) poolKey = 'idioms';
  else if (cleanTopic.includes('покуп') || cleanTopic.includes('супермарк') || cleanTopic.includes('одяг') || cleanTopic.includes('магазин')) poolKey = 'shopping';
  else if (cleanTopic.includes('погод') || cleanTopic.includes('природ') || cleanTopic.includes('копалин') || cleanTopic.includes('екол')) poolKey = 'weather';

  const basePool = FALLBACK_TOPIC_POOLS[poolKey] || FALLBACK_TOPIC_POOLS.general;

  // Slice or multiply pairs to reach pairCount
  let selectedPairs = [...basePool.pairs];
  if (selectedPairs.length < pairCount) {
    // Top up with general pool items if needed
    const extra = FALLBACK_TOPIC_POOLS.general.pairs.filter(p => !selectedPairs.some(sp => sp.german === p.german));
    selectedPairs = [...selectedPairs, ...extra];
  }

  const finalPairs = selectedPairs.slice(0, pairCount);

  return {
    title: topic.trim() ? `Тема: "${topic}"` : basePool.title,
    description: `Згенеровано для рівня ${difficulty} (${finalPairs.length} слів)`,
    category: basePool.category,
    pairs: finalPairs,
  };
}

/**
 * Executes direct client-side Gemini generation if VITE_GEMINI_API_KEY is defined in environment
 */
export async function generateWithClientGemini(
  apiKey: string,
  topic: string,
  difficulty: string,
  pairCount: number
): Promise<GeneratedList> {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Генеруй список слів та фраз для вивчення німецької мови на тему "${topic}" для рівня складності ${difficulty}.
Потрібно згенерувати точно ${pairCount} пар слів/фраз.
Для іменників обов'язково вказуй артикль (der/die/das).
Кожна пара повинна містити:
1. German (німецька слово/фраза з артиклем якщо це іменник)
2. Ukrainian (український переклад)
3. ExampleGerman (просте приклад речення німецькою)
4. ExampleUkrainian (переклад прикладу українською)

Згенеруй також назву списку (title) та короткий опис (description) українською мовою.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      systemInstruction: 'Ти — досвідчений викладач німецької мови для українськомовних студентів.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          pairs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                german: { type: Type.STRING },
                ukrainian: { type: Type.STRING },
                exampleGerman: { type: Type.STRING },
                exampleUkrainian: { type: Type.STRING },
              },
              required: ['german', 'ukrainian'],
            },
          },
        },
        required: ['title', 'description', 'pairs'],
      },
    },
  });

  if (!response.text) {
    throw new Error('Отримано порожню відповідь від Gemini API.');
  }

  return JSON.parse(response.text) as GeneratedList;
}
