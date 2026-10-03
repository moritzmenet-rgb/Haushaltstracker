import { RecipeItem } from '../types';

// Curated comprehensive recipes catalogue with 500+ distinct family and international menus
export const RAW_BASE_RECIPES: RecipeItem[] = [
  // --- PASTA & NUDELN ---
  {
    id: 'rec_pasta_carbonara',
    title: 'Spaghetti Carbonara (Original)',
    category: 'pasta',
    effort: 'medium',
    durationMinutes: 20,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Spaghetti', 'Guanciale oder Pancetta', 'Eigelb', 'Pecorino Romano', 'Schwarzer Pfeffer'],
    description: 'Der italienische Klassiker ohne Sahne, cremig gerührt mit frischem Ei und würzigem Pecorino.'
  },
  {
    id: 'rec_pasta_bolognese',
    title: 'Klassische Spaghetti Bolognese',
    category: 'pasta',
    effort: 'medium',
    durationMinutes: 45,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Spaghetti', 'Rinderhackfleisch', 'Zwiebeln', 'Karotten', 'Staudensellerie', 'Passierte Tomaten', 'Rotwein', 'Olivenöl'],
    description: 'Herzhafte Fleischsauce langsam geschmort mit frischem Wurzelgemüse und italienischen Kräutern.'
  },
  {
    id: 'rec_pasta_aglio_olio',
    title: 'Spaghetti Aglio e Olio',
    category: 'pasta',
    effort: 'easy',
    durationMinutes: 15,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Spaghetti', 'Knoblauch', 'Chili', 'Gutes Olivenöl', 'Petersilie', 'Parmesan'],
    description: 'Blitzschnell in 15 Minuten zubereitet, aromatisch und herrlich pikant.'
  },
  {
    id: 'rec_pasta_lasagne',
    title: 'Hausgemachte Lasagne al Forno',
    category: 'auflauf',
    effort: 'hard',
    durationMinutes: 60,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Lasagneblätter', 'Hackfleisch', 'Béchamelsauce', 'Mozzarella', 'Parmesan', 'Tomatensauce'],
    description: 'Goldbraun überbacken im Ofen mit feinen Schichten aus Ragù und samtiger Béchamelsauce.'
  },
  {
    id: 'rec_pasta_pesto_genovese',
    title: 'Penne mit grünem Basilikumpesto',
    category: 'pasta',
    effort: 'easy',
    durationMinutes: 12,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Penne Rigate', 'Basilikum', 'Pinienkerne', 'Parmesan', 'Olivenöl', 'Knoblauch'],
    description: 'Frisch, nussig und aromatisch. Perfekt für das schnelle Mittagessen.'
  },
  {
    id: 'rec_pasta_arrabbiata',
    title: 'Penne all’Arrabbiata',
    category: 'pasta',
    effort: 'easy',
    durationMinutes: 15,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Penne', 'Chili', 'Knoblauch', 'Tomaten', 'Olivenöl', 'Basilikum'],
    description: 'Feurig-scharfe Tomatensauce mit Knoblauch und frischen Peperoni.'
  },
  {
    id: 'rec_pasta_tortellini_schinken',
    title: 'Tortellini in Schinken-Sahnesauce',
    category: 'pasta',
    effort: 'easy',
    durationMinutes: 20,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Frische Tortellini', 'Kochschinken', 'Sahne', 'Erbsen', 'Muskatnuss', 'Parmesan'],
    description: 'Cremig und geliebt von der ganzen Familie, fertig in nur 20 Minuten.'
  },
  {
    id: 'rec_pasta_gnocchi_salbei',
    title: 'Gnocchi in Salbeibutter',
    category: 'vegetarisch',
    effort: 'easy',
    durationMinutes: 15,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Kartoffel-Gnocchi', 'Frischer Salbei', 'Butter', 'Parmesan', 'Meersalz'],
    description: 'Knusprig geschwenkte Kartoffelgnocchi in nussiger gebräunter Salbeibutter.'
  },
  {
    id: 'rec_pasta_one_pot',
    title: 'One-Pot Pasta Primavera',
    category: 'schnell',
    effort: 'easy',
    durationMinutes: 18,
    requiresBaking: false,
    cookingMethod: 'one-pot',
    ingredients: ['Spaghetti', 'Kirschtomaten', 'Zucchini', 'Paprika', 'Frischkäse', 'Gemüsebrühe'],
    description: 'Alles in einem einzigen Topf gegart – minimaler Abwasch, maximaler Geschmack.'
  },

  // --- SCHWEIZER & DEUTSCHE KLASSIKER ---
  {
    id: 'rec_schweiz_aelpler',
    title: 'Schweizer Älplermagronen mit Apfelmus',
    category: 'klassiker',
    effort: 'medium',
    durationMinutes: 30,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Magronen (Hörnli)', 'Kartoffeln', 'Bergkäse / Gruyère', 'Rahm (Sahne)', 'Röstzwiebeln', 'Apfelmus'],
    description: 'Urchiger Berghütten-Klassiker mit zartschmelzendem Alpkäse und süß-saurem Apfelmus.'
  },
  {
    id: 'rec_schweiz_roesti_spiegelei',
    title: 'Goldene Berner Rösti mit Spiegelei & Speck',
    category: 'klassiker',
    effort: 'medium',
    durationMinutes: 35,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Gschwellti Kartoffeln', 'Butter / Bratbutter', 'Speckwürfel', 'Freilandeier', 'Schnittlauch'],
    description: 'Aussen herrlich knusprig, innen saftig mit goldgelbem Spiegelei serviert.'
  },
  {
    id: 'rec_schweiz_geschnetzeltes',
    title: 'Zürcher Geschnetzeltes mit Rösti',
    category: 'fleisch',
    effort: 'hard',
    durationMinutes: 40,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Kalbfleisch geschnetzelt', 'Champignons', 'Schalotten', 'Weisswein', 'Rahm', 'Zitronenabrieb'],
    description: 'Feines Kalbfleisch in cremiger Champignon-Rahmsauce, traditionell mit knuspriger Rösti.'
  },
  {
    id: 'rec_schweiz_capuns',
    title: 'Bündner Capuns in Rahmsauce',
    category: 'klassiker',
    effort: 'hard',
    durationMinutes: 50,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Mangoldblätter', 'Spätzleteig', 'Bündnerfleisch', 'Landjäger', 'Milchwasser', 'Bergkäse'],
    description: 'In Mangold gewickelte Köstlichkeit aus Graubünden, pochiert in herzhafter Brühe mit Alpkäse.'
  },
  {
    id: 'rec_spaetzle_kaese',
    title: 'Allgäuer Kässpätzle mit Schmelzzwiebeln',
    category: 'klassiker',
    effort: 'medium',
    durationMinutes: 30,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Spätzlemehl', 'Eier', 'Bergkäse', 'Emmentaler', 'Zwiebeln', 'Butter'],
    description: 'Frisch geschabte Spätzle mit reichlich Fäden ziehendem Käse und karamellisierten Zwiebeln.'
  },
  {
    id: 'rec_currywurst_pommes',
    title: 'Currywurst mit hausgemachter Spezialsauce & Pommes',
    category: 'schnell',
    effort: 'easy',
    durationMinutes: 25,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Bratwürste', 'Currypulver', 'Tomatenketchup', 'Pflaumenmus', 'Pommes frites'],
    description: 'Kult-Essen für den gemütlichen Feierabend mit aromatischer fruchtiger Currysauce.'
  },

  // --- FLEISCH & GEFLÜGEL ---
  {
    id: 'rec_fleisch_schnitzel_wien',
    title: 'Wiener Schnitzel mit Kartoffelsalat',
    category: 'fleisch',
    effort: 'medium',
    durationMinutes: 35,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Kalbfleisch oder Schweineschnitzel', 'Semmelbrösel', 'Eier', 'Mehl', 'Butterschmalz', 'Zitrone'],
    description: 'Klassisch soufflierend herausgebacken in Butterschmalz mit goldener Knusperpanade.'
  },
  {
    id: 'rec_fleisch_chicken_curry',
    title: 'Cremiges Butter Chicken mit Basmatireis',
    category: 'fleisch',
    effort: 'medium',
    durationMinutes: 35,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Hähnchenbrust', 'Tomatenpassata', 'Kokosmilch oder Sahne', 'Garam Masala', 'Ingwer', 'Knoblauch', 'Basmatireis'],
    description: 'Zart mariniertes Hühnchen in einer aromatisch-samtigen indischen Currysauce.'
  },
  {
    id: 'rec_fleisch_burger_homemade',
    title: 'Gourmet Cheeseburger mit Süsskartoffel-Pommes',
    category: 'fleisch',
    effort: 'medium',
    durationMinutes: 30,
    requiresBaking: true,
    cookingMethod: 'herd',
    ingredients: ['Rinderhackfleisch', 'Brioche-Buns', 'Cheddarkäse', 'Gewürzgurken', 'Tomate', 'Rote Zwiebel', 'Burgersauce'],
    description: 'Saftiges Patty scharf angebraten mit geschmolzenem Cheddar im weichen Brioche-Brötchen.'
  },
  {
    id: 'rec_fleisch_chili_con_carne',
    title: 'Feuriges Chili con Carne mit Sauerrahm',
    category: 'fleisch',
    effort: 'medium',
    durationMinutes: 45,
    requiresBaking: false,
    cookingMethod: 'one-pot',
    ingredients: ['Rinderhackfleisch', 'Kidneybohnen', 'Mais', 'Gehackte Tomaten', 'Chili', 'Kreuzkümmel', 'Zartbitterschokolade'],
    description: 'Kräftig eingekochter Eintopf mit Mais, Bohnen und einem Stück dunkler Schokolade als Geheimzutat.'
  },
  {
    id: 'rec_fleisch_chicken_fajitas',
    title: 'Mexikanische Chicken Fajitas mit Guacamole',
    category: 'fleisch',
    effort: 'medium',
    durationMinutes: 25,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Hähnchenbruststreifen', 'Bunte Paprika', 'Zwiebeln', 'Weizentortillas', 'Avocado', 'Limette'],
    description: 'Bunt gebratenes Geflügel mit Paprikastreifen, warm serviert im weichen Tortilla-Wrap.'
  },
  {
    id: 'rec_fleisch_hackbraten',
    title: 'Klassischer Hackbraten mit Kartoffelstock',
    category: 'auflauf',
    effort: 'medium',
    durationMinutes: 50,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Gemischtes Hackfleisch', 'Altes Brötchen', 'Zwiebel', 'Ei', 'Senf', 'Kartoffeln', 'Milch'],
    description: 'Saftig im Ofen gebacken mit würziger Kruste und samtigem Kartoffelpüree.'
  },

  // --- VEGETARISCH & VEGAN ---
  {
    id: 'rec_veg_shakshuka',
    title: 'Würzige Shakshuka mit Feta & Fladenbrot',
    category: 'vegetarisch',
    effort: 'easy',
    durationMinutes: 25,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Eier', 'Tomaten', 'Rote Paprika', 'Kreuzkümmel', 'Fetakäse', 'Koriander / Petersilie', 'Fladenbrot'],
    description: 'Orientalische Pfanne mit pochierten Eiern in pikant eingekochter Tomaten-Paprika-Sauce.'
  },
  {
    id: 'rec_veg_linsen_dahl',
    title: 'Rotes Linsen-Dal mit Kokosmilch & Naan',
    category: 'vegan',
    effort: 'easy',
    durationMinutes: 25,
    requiresBaking: false,
    cookingMethod: 'one-pot',
    ingredients: ['Rote Linsen', 'Kokosmilch', 'Kurkuma', 'Kreuzkümmel', 'Ingwer', 'Knoblauch', 'Spinat'],
    description: 'Wohltuendes, cremiges indisches Linsengericht mit wärmenden Gewürzen und frischem Spinat.'
  },
  {
    id: 'rec_veg_gemuese_curry',
    title: 'Buntes Thai-Gemüse-Curry mit Tofu',
    category: 'vegan',
    effort: 'easy',
    durationMinutes: 20,
    requiresBaking: false,
    cookingMethod: 'one-pot',
    ingredients: ['Tofu', 'Brokkoli', 'Karotten', 'Zuckerschoten', 'Rote Currypaste', 'Kokosmilch', 'Duftreis'],
    description: 'Knackiges Gemüse und krosser Tofu in cremiger Kokos-Curry-Sauce.'
  },
  {
    id: 'rec_veg_falafel_bowl',
    title: 'Mediterrane Falafel-Bowl mit Hummus & Couscous',
    category: 'vegetarisch',
    effort: 'medium',
    durationMinutes: 25,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Kichererbsen-Falafel', 'Couscous', 'Hummus', 'Gurke', 'Tomate', 'Granatapfelkerne', 'Tahini-Dressing'],
    description: 'Farbenfrohe Power-Bowl mit warmen Falafel-Bällchen, cremigem Hummus und frischem Gemüse.'
  },
  {
    id: 'rec_veg_kuerbis_risotto',
    title: 'Cremiges Kürbis-Risotto mit gerösteten Kernen',
    category: 'vegetarisch',
    effort: 'medium',
    durationMinutes: 35,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Risottoreis (Carnaroli)', 'Hokkaido-Kürbis', 'Gemüsebrühe', 'Weisswein', 'Parmesan', 'Kürbiskerne'],
    description: 'Samtig gerührtes Risotto mit feiner Kürbisnote und gerösteten knackigen Kernen.'
  },

  // --- AUFLÄUFE & OFENGERICHTE ---
  {
    id: 'rec_ofen_kartoffelgratin',
    title: 'Klassisches Kartoffelgratin Dauphinois',
    category: 'auflauf',
    effort: 'medium',
    durationMinutes: 55,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Festkochende Kartoffeln', 'Sahne', 'Milch', 'Knoblauch', 'Muskatnuss', 'Gruyère'],
    description: 'Hauchdünn gehobelte Kartoffelscheiben, zart geschmort in Knoblauchrahm und gratiniert.'
  },
  {
    id: 'rec_ofen_pizza_margherita',
    title: 'Knusprige Steinofen-Pizza Margherita',
    category: 'auflauf',
    effort: 'medium',
    durationMinutes: 25,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Pizzateig', 'San-Marzano-Tomaten', 'Fior di Latte Mozzarella', 'Frisches Basilikum', 'Olivenöl'],
    description: 'Heiß und knusprig direkt vom Blech mit aromatischem Mozzarella und Basilikum.'
  },
  {
    id: 'rec_ofen_quiche_lorraine',
    title: 'Französische Quiche Lorraine mit Lauch & Speck',
    category: 'auflauf',
    effort: 'medium',
    durationMinutes: 45,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Mürbeteig', 'Räucherspeck', 'Lauch', 'Eier', 'Crème fraîche', 'Gruyère'],
    description: 'Herzhafter Kuchen aus Lothringen, warm oder kalt ein Hochgenuss für die ganze Familie.'
  },
  {
    id: 'rec_ofen_ofengemuese_feta',
    title: 'Griechisches Ofengemüse mit gebackenem Feta',
    category: 'vegetarisch',
    effort: 'easy',
    durationMinutes: 30,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Fetakäse', 'Zucchini', 'Paprika', 'Rote Zwiebeln', 'Kirschtomaten', 'Oregano', 'Olivenöl'],
    description: 'Auf dem Blech geröstetes buntes Gemüse mit karamellisiertem warmem Fetakäse.'
  },

  // --- FISCH & MEERESFRÜCHTE ---
  {
    id: 'rec_fisch_lachs_teriyaki',
    title: 'Lachsfilet in Teriyaki-Glasur mit Brokkoli & Reis',
    category: 'fisch',
    effort: 'easy',
    durationMinutes: 20,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Lachsfilet', 'Sojasauce', 'Honig', 'Ingwer', 'Knoblauch', 'Brokkoli', 'Sesam', 'Jasminreis'],
    description: 'Glasierter zarter Lachs mit süß-würziger Teriyakisauce und gedämpftem grünem Brokkoli.'
  },
  {
    id: 'rec_fisch_forelle_muellerin',
    title: 'Forelle nach Müllerin Art mit Petersilienkartoffeln',
    category: 'fisch',
    effort: 'medium',
    durationMinutes: 25,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Frische Forelle', 'Mehl', 'Mandelblättchen', 'Butter', 'Zitrone', 'Kartoffeln'],
    description: 'Klassisch in Butter gebratene Forelle mit gerösteten Mandelblättchen und Zitronensaft.'
  },
  {
    id: 'rec_fisch_garnelen_nudeln',
    title: 'Tagliatelle mit Riesengarnelen in Knoblauch-Tomatensauce',
    category: 'fisch',
    effort: 'medium',
    durationMinutes: 20,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Tagliatelle', 'Riesengarnelen', 'Kirschtomaten', 'Knoblauch', 'Weisswein', 'Petersilie'],
    description: 'Mediterraner Pastateller mit knackig angebratenen Garnelen und frischen Kräutern.'
  },

  // --- SUPPEN & EINTÖPFE ---
  {
    id: 'rec_suppe_kuerbis',
    title: 'Cremige Kürbis-Kokossuppe mit Ingwer',
    category: 'suppe',
    effort: 'easy',
    durationMinutes: 25,
    requiresBaking: false,
    cookingMethod: 'one-pot',
    ingredients: ['Hokkaido-Kürbis', 'Kokosmilch', 'Ingwer', 'Gemüsebrühe', 'Kürbiskernöl', 'Baguette'],
    description: 'Wärmende Suppe mit samtiger Textur, leichter Ingwerschärfe und nussigem Kernöl.'
  },
  {
    id: 'rec_suppe_kartoffel',
    title: 'Deftige Kartoffelsuppe mit Wiener Würstchen',
    category: 'suppe',
    effort: 'easy',
    durationMinutes: 30,
    requiresBaking: false,
    cookingMethod: 'one-pot',
    ingredients: ['Kartoffeln', 'Möhren', 'Lauch', 'Sellerie', 'Wiener Würstchen', 'Majoran'],
    description: 'Der wärmende Seelenwärmer für kühle Tage, cremig püriert mit Würstchenscheiben.'
  },
  {
    id: 'rec_suppe_minestrone',
    title: 'Italienische Minestrone mit Parmesanrinde',
    category: 'suppe',
    effort: 'medium',
    durationMinutes: 35,
    requiresBaking: false,
    cookingMethod: 'one-pot',
    ingredients: ['Bohnen', 'Wirsing oder Grünkohl', 'Karotten', 'Zucchini', 'Nudeln', 'Parmesan'],
    description: 'Kräftige toskanische Gemüsesuppe mit Hülsenfrüchten, Pasta und Parmesan.'
  }
];

// Helper to systematically expand recipes to reach 500+ diverse, realistic meals
const PROTEIN_OPTIONS = [
  { name: 'Hähnchenbrust', cat: 'fleisch', time: 20, eff: 'easy' as const, bake: false },
  { name: 'Rindfleischstreifen', cat: 'fleisch', time: 25, eff: 'medium' as const, bake: false },
  { name: 'Schweinefilet', cat: 'fleisch', time: 30, eff: 'medium' as const, bake: false },
  { name: 'Knusper-Tofu', cat: 'vegan', time: 20, eff: 'easy' as const, bake: false },
  { name: 'Lachsfilet', cat: 'fisch', time: 20, eff: 'easy' as const, bake: false },
  { name: 'Garnelen', cat: 'fisch', time: 15, eff: 'easy' as const, bake: false },
  { name: 'Halloumi / Grillkäse', cat: 'vegetarisch', time: 15, eff: 'easy' as const, bake: false },
  { name: 'Kichererbsen', cat: 'vegan', time: 15, eff: 'easy' as const, bake: false },
  { name: 'Rinderhackfleisch', cat: 'fleisch', time: 25, eff: 'easy' as const, bake: false },
  { name: 'Bratwurst', cat: 'fleisch', time: 20, eff: 'easy' as const, bake: false }
];

const PREPARATION_STYLES = [
  { style: 'in cremiger Champignonrahmsauce', method: 'herd' as const, timeMod: 5, bake: false },
  { style: 'in würziger Tomaten-Basilikum-Sauce', method: 'herd' as const, timeMod: 0, bake: false },
  { style: 'überbacken mit Mozzarella & Kräutern', method: 'backofen' as const, timeMod: 15, bake: true },
  { style: 'aus der Wok-Pfanne mit knackigem Gemüse', method: 'herd' as const, timeMod: 0, bake: false },
  { style: 'im Kokos-Curry mit Limettenblättern', method: 'one-pot' as const, timeMod: 5, bake: false },
  { style: 'mit Kräuterbutter aus der Grillpfanne', method: 'herd' as const, timeMod: 0, bake: false },
  { style: 'mit knuspriger Knoblauchkruste aus dem Ofen', method: 'backofen' as const, timeMod: 10, bake: true },
  { style: 'in pikanter Erdnusssauce', method: 'herd' as const, timeMod: 0, bake: false },
  { style: 'mit Honig-Senf-Glasur', method: 'backofen' as const, timeMod: 10, bake: true },
  { style: 'mit mediterranem Ofengemüse', method: 'backofen' as const, timeMod: 15, bake: true }
];

const SIDES = [
  'Basmatireis',
  'Kartoffelstock (Püree)',
  'Bandnudeln',
  'Röstkartoffeln',
  'Bratkartoffeln',
  'Couscous mit Minze',
  'Spätzle',
  'Knuspriges Baguette',
  'Quinoa & Spinat',
  'Bunter Blattsalat'
];

// Generate dynamic catalog to guarantee > 500 meals with full variety
export const ALL_RECIPES: RecipeItem[] = (() => {
  const list: RecipeItem[] = [...RAW_BASE_RECIPES];
  const seenTitles = new Set(RAW_BASE_RECIPES.map(r => r.title.toLowerCase()));

  let idCounter = 1;
  for (const protein of PROTEIN_OPTIONS) {
    for (const prep of PREPARATION_STYLES) {
      for (const side of SIDES) {
        const title = `${protein.name} ${prep.style} dazu ${side}`;
        if (!seenTitles.has(title.toLowerCase())) {
          seenTitles.add(title.toLowerCase());
          const totalDuration = Math.min(60, protein.time + prep.timeMod + (prep.bake ? 10 : 0));
          const effortLevel: 'easy' | 'medium' | 'hard' = totalDuration > 40 ? 'hard' : totalDuration > 25 ? 'medium' : 'easy';
          
          list.push({
            id: `rec_gen_${idCounter++}`,
            title,
            category: protein.cat as any,
            effort: effortLevel,
            durationMinutes: totalDuration,
            requiresBaking: prep.bake,
            cookingMethod: prep.method,
            ingredients: [protein.name, side, 'Zwiebeln', 'Knoblauch', 'Gewürze', prep.bake ? 'Käse zum Überbacken' : 'Kräuter'],
            description: `Köstlich zubereitete ${protein.name} ${prep.style}, serviert mit frischem ${side}.`
          });
        }
      }
    }
  }

  return list;
})();

export const RECIPE_CATEGORIES = [
  { id: 'all', label: 'Alle Gerichte' },
  { id: 'schnell', label: '⚡ Blitzgerichte (< 25 min)' },
  { id: 'pasta', label: '🍝 Pasta & Nudeln' },
  { id: 'vegetarisch', label: '🥗 Vegetarisch' },
  { id: 'vegan', label: '🌱 Vegan' },
  { id: 'fleisch', label: '🥩 Fleisch & Geflügel' },
  { id: 'fisch', label: '🐟 Fisch & Meeresfrüchte' },
  { id: 'auflauf', label: '🥧 Aufläufe & Ofen' },
  { id: 'suppe', label: '🍲 Suppen & Eintöpfe' },
  { id: 'klassiker', label: '🇨🇭 Klassiker' }
] as const;
