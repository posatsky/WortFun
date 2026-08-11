import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, CheckCircle, PlusCircle, Volume2 } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { WordLevel, WordPair } from '../types';
import { audioManager } from '../utils/audio';

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

function getFallbackList(topic: string, difficulty: string, pairCount: number): GeneratedList {
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

  let selectedPairs = [...basePool.pairs];
  if (selectedPairs.length < pairCount) {
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

async function generateWithClientGemini(
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

interface AiGeneratorModalProps {
  onAddCustomLevel: (level: WordLevel) => void;
  onClose?: () => void;
  onPlayLevelImmediately?: (levelId: string) => void;
}

const PRESET_TOPICS = [
  { title: 'Розмова в кав\'ярні та ресторані', level: 'A1-A2', icon: '☕' },
  { title: 'Аеропорт, вокзал та квитки', level: 'A2', icon: '✈️' },
  { title: 'Оренда квартири та побут', level: 'A2-B1', icon: '🏠' },
  { title: 'В лікарні, аптеці та у лікаря', level: 'B1', icon: '🩺' },
  { title: 'IT, програмування та робота', level: 'B1-B2', icon: '💻' },
  { title: 'Німецькі фразеологізми та ідіоми', level: 'B2', icon: '💡' },
  { title: 'Покупки в супермаркеті та одяг', level: 'A1', icon: '🛒' },
  { title: 'Погода, природа та копалини', level: 'A2', icon: '🌿' },
];

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  onAddCustomLevel,
  onPlayLevelImmediately,
}) => {
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'A1' | 'A2' | 'B1' | 'B2'>('A1');
  const [pairCount, setPairCount] = useState<number>(8);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [generatedList, setGeneratedList] = useState<{
    title: string;
    description: string;
    category: string;
    pairs: { german: string; ukrainian: string; exampleGerman?: string; exampleUkrainian?: string }[];
  } | null>(null);

  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleGenerate = async (topicToUse?: string) => {
    const finalTopic = topicToUse || topic;
    if (!finalTopic.trim()) {
      setError('Будь ласка, вкажіть тему для генерації або оберіть зі списку.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedList(null);
    setIsSaved(false);

    try {
      const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (clientApiKey) {
        const result = await generateWithClientGemini(clientApiKey, finalTopic, difficulty, pairCount);
        setGeneratedList(result);
        return;
      }

      // Try server endpoint
      const res = await fetch('/api/generate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: finalTopic,
          difficulty,
          pairCount,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      
      // If endpoint returns HTML (e.g. 404 on GitHub Pages static hosting), fallback gracefully
      if (!res.ok || contentType.includes('text/html') || contentType.includes('text/plain')) {
        const fallbackData = getFallbackList(finalTopic, difficulty, pairCount);
        setGeneratedList(fallbackData);
        return;
      }

      const json = await res.json();

      if (!json.success || !json.data) {
        const fallbackData = getFallbackList(finalTopic, difficulty, pairCount);
        setGeneratedList(fallbackData);
        return;
      }

      setGeneratedList(json.data);
    } catch (err: any) {
      console.warn('Backend or Gemini call failed, using client fallback list:', err);
      // Fallback generator ensures user never sees an ugly JSON error on static hosting
      const fallbackData = getFallbackList(finalTopic, difficulty, pairCount);
      setGeneratedList(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLevel = () => {
    if (!generatedList) return;

    const newLevelId = `custom-ai-${Date.now()}`;
    const formattedPairs: WordPair[] = generatedList.pairs.map((p, idx) => ({
      id: `${newLevelId}-p${idx + 1}`,
      german: p.german,
      ukrainian: p.ukrainian,
      exampleGerman: p.exampleGerman,
      exampleUkrainian: p.exampleUkrainian,
    }));

    const newLevel: WordLevel = {
      id: newLevelId,
      levelNumber: Date.now() % 1000,
      title: generatedList.title,
      description: generatedList.description,
      category: generatedList.category || 'AI Генерація',
      difficulty: difficulty,
      isCustom: true,
      createdAt: Date.now(),
      pairs: formattedPairs,
    };

    onAddCustomLevel(newLevel);
    setIsSaved(true);

    if (onPlayLevelImmediately) {
      onPlayLevelImmediately(newLevelId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      
      {/* Title & Introduction Banner */}
      <div className="bg-white border-2 border-amber-200/80 rounded-3xl p-6 shadow-md mb-8 relative overflow-hidden">

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">
              Генератор списків слів з Gemini AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Створюйте будь-які тематичні набори німецько-українських слів з прикладами та артиклями за секунди.
            </p>
          </div>
        </div>
      </div>

      {/* Generator Controls */}
      <div className="bg-white border-2 border-amber-200/80 rounded-3xl p-6 shadow-md mb-8">
        
        {/* Topic Input */}
        <div className="mb-6">
          <label className="block text-sm font-black text-slate-800 mb-2">
            Введіть тему для вивчення слів:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Наприклад: Автомобіль та ремонт, Оренда житла, Офіс та ділові переговори..."
              className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-semibold placeholder-slate-400 focus:outline-none focus:border-orange-500 text-sm"
            />
            <button
              onClick={() => handleGenerate()}
              disabled={isLoading}
              className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm transition-all disabled:opacity-50 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 cursor-pointer shrink-0 active:translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Генерую...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
                  <span>Згенерувати</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Topic Presets */}
        <div className="mb-6">
          <label className="block text-xs font-black text-slate-500 mb-2.5 uppercase tracking-wider">
            Або оберіть готовий варіант:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRESET_TOPICS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTopic(preset.title);
                  handleGenerate(preset.title);
                }}
                disabled={isLoading}
                className="bg-amber-50/60 hover:bg-amber-100/80 border-2 border-amber-200/80 hover:border-orange-400 rounded-2xl p-3 text-left transition-all group cursor-pointer"
              >
                <div className="text-lg mb-1">{preset.icon}</div>
                <div className="font-extrabold text-xs text-slate-800 group-hover:text-orange-600 line-clamp-2">
                  {preset.title}
                </div>
                <span className="inline-block text-[10px] text-slate-500 font-extrabold mt-1">
                  Рівень {preset.level}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-amber-100">
          
          {/* Difficulty */}
          <div>
            <label className="block text-xs font-black text-slate-500 mb-2">
              Рівень складності:
            </label>
            <div className="flex gap-2">
              {(['A1', 'A2', 'B1', 'B2'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                    difficulty === lvl
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Word Count */}
          <div>
            <label className="block text-xs font-black text-slate-500 mb-2">
              Кількість слів у списку:
            </label>
            <div className="flex gap-2">
              {[6, 8, 10, 12, 15].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setPairCount(cnt)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                    pairCount === cnt
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold rounded-2xl p-4 mb-6 text-sm flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* GENERATED LIST PREVIEW */}
      {generatedList && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-amber-200/80 rounded-3xl p-6 shadow-md"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b-2 border-amber-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {difficulty}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  {generatedList.category || 'Згенеровано Gemini AI'}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-800">
                {generatedList.title}
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                {generatedList.description}
              </p>
            </div>

            <button
              onClick={handleSaveLevel}
              disabled={isSaved}
              className={`px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                isSaved
                  ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'
              }`}
            >
              {isSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Додано до рівнів!</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 text-white fill-current" />
                  <span>Додати та грати зараз</span>
                </>
              )}
            </button>
          </div>

          {/* Table / Grid of Pairs */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {generatedList.pairs.map((pair, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-100 hover:border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-black text-slate-400 w-5">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800 text-base">
                        {pair.german}
                      </span>
                      <button
                        onClick={() => audioManager.speakGerman(pair.german)}
                        className="p-1 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-slate-200 transition-colors"
                        title="Прослухати"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {pair.exampleGerman && (
                      <p className="text-xs text-slate-500 font-medium italic mt-0.5">
                        «{pair.exampleGerman}»
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:text-right pl-8 sm:pl-0 border-l sm:border-l-0 border-slate-200 sm:border-none">
                  <span className="font-bold text-orange-600">
                    {pair.ukrainian}
                  </span>
                  {pair.exampleUkrainian && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      ({pair.exampleUkrainian})
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

        </motion.div>
      )}

    </div>
  );
};
