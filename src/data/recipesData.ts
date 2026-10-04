import { RecipeItem } from '../types';

// Curated comprehensive recipes catalogue reflecting family wishes:
// - Amaranthauflauf, Selbstgemachte Pizza, Aufbackpizza, Älplermacaronen, Pasta diverse,
//   Cinque Pi, Carbonara, Pasta mit Pesto, Ofenguck, Flammkuchen, Kartoffelgratin, Kartoffelstock,
//   Mini Crêpes, Fajitas, Burger, Kürbissuppe, Café Complet, Wähen diverse (Käse & Birnen),
//   Lasagne, Spaghetti Bolognese, Linsen-Bolognese, Gnocchi mit Salbeibutter, One-Pot Pasta,
//   Reis & Dahl, Cordon Bleu mit Pommes, Fischstäbchen, Thai Curry
// - Keine Hähnchenbrust!
// - Umfassende Berücksichtigung vegetarischer Haushaltsmitglieder mit Kennzeichnung & Alternativen!

export const RAW_BASE_RECIPES: RecipeItem[] = [
  // 1. AMARANTHAUFLAUF
  {
    id: 'rec_amaranth_auflauf',
    title: 'Amaranth-Gemüseauflauf mit Bergkäse',
    category: 'auflauf',
    effort: 'medium',
    durationMinutes: 40,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Amaranth', 'Zucchini', 'Karotten', 'Kirschtomaten', 'Eier', 'Rahm (Sahne)', 'Schweizer Bergkäse', 'Frische Kräuter'],
    description: 'Nährstoffreicher, goldbraun überbackener Amaranth-Auflauf mit marktfrischem Gemüse und würzigem Bergkäse.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch – reich an pflanzlichen Proteinen & Mineralstoffen.'
  },

  // 2. SELBSTGEMACHTE PIZZA
  {
    id: 'rec_pizza_homemade',
    title: 'Selbstgemachte Steinofen-Pizza nach Wunsch',
    category: 'auflauf',
    effort: 'medium',
    durationMinutes: 35,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Hausgemachter Pizzateig', 'San-Marzano-Tomatensauce', 'Mozzarella (Fior di Latte)', 'Frisches Basilikum', 'Oregano', 'Olivenöl', 'Gemüse nach Wahl'],
    description: 'Frischer Hefeteig, heiss und knusprig gebacken. Perfekt für die Familie: Jeder belegt seine eigene Hälfte individuell vegetarisch oder nach Belieben!',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch: Mit Mozzarella, Champignons, Peperoni, Artischocken und Rucola belegen.'
  },

  // 3. AUFBACK-PIZZA
  {
    id: 'rec_pizza_aufback',
    title: 'Aufback-Pizza (Schnell & mit extra Käse verfeinert)',
    category: 'schnell',
    effort: 'easy',
    durationMinutes: 15,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Aufbackpizza (Margherita oder Formaggi)', 'Extra Reibkäse / Mozzarella', 'Kirschtomaten', 'Oregano', 'Olivenöl'],
    description: 'Wenn es blitzschnell gehen muss: Lieblings-Aufbackpizza im Ofen mit extra Käse und frischen Kräutern knusprig aufbacken.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch bei Wahl einer Margherita- oder Quattro-Formaggi-Pizza.'
  },

  // 4. ÄLPLERMACARONEN
  {
    id: 'rec_aelplermacaronen',
    title: 'Schweizer Älplermacaronen mit Apfelmus',
    category: 'klassiker',
    effort: 'easy',
    durationMinutes: 25,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Magronen (Hörnli)', 'Kartoffelwürfel', 'Schweizer Bergkäse / Gruyère', 'Rahm (Sahne)', 'Goldene Röstzwiebeln', 'Feines Apfelmus'],
    description: 'Der urchige Schweizer Berghütten-Klassiker: Cremig gekochte Magronen und Kartoffeln im Alpkäse-Rahm mit Röstzwiebeln und süss-säuerlichem Apfelmus.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch – traditionell ohne Fleisch zubereitet, purer Schweizer Käsegenuss.'
  },

  // 5. PASTA CINQUE PI
  {
    id: 'rec_pasta_cinque_pi',
    title: 'Penne Cinque Pi (Der Schweizer Pastahit)',
    category: 'pasta',
    effort: 'easy',
    durationMinutes: 18,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Penne Rigate', 'Panna (Rahm)', 'Pomodoro (Tomatenpüree)', 'Parmigiano (Parmesan)', 'Prezzemolo (Petersilie)', 'Pepe (Schwarzer Pfeffer)', 'Prise Muskat'],
    description: 'Der legendäre 5-Pi-Klassiker: Samtige Tomaten-Rahmsauce mit reichlich frisch geriebenem Parmesan, Petersilie und Muskatnuss.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch – herrlich cremig und ein absoluter Favorit bei Gross & Klein.'
  },

  // 6. SPAGHETTI CARBONARA
  {
    id: 'rec_pasta_carbonara',
    title: 'Spaghetti Carbonara (mit Vegi-Option)',
    category: 'pasta',
    effort: 'medium',
    durationMinutes: 20,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Spaghetti', 'Frische Eigelb & Vollei', 'Pecorino Romano & Parmesan', 'Schwarzer Pfeffer aus der Mühle', 'Knuspriger Räuchertofu oder Guanciale'],
    description: 'Italienisches Original ohne Sahne! Cremig emulgiert mit Ei und würzigem Käse. Für die vegetarische Portion wird Räuchertofu kross angebraten.',
    isVegetarian: true,
    vegetarianOption: '🌱 Vegi-Option: Statt Speck knusprig in Olivenöl gewürfelter Räuchertofu verwenden – schmeckt fantastisch!'
  },

  // 7. PASTA MIT PESTO
  {
    id: 'rec_pasta_pesto',
    title: 'Pasta mit Basilikumpesto & gerösteten Pinienkernen',
    category: 'pasta',
    effort: 'easy',
    durationMinutes: 12,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Pasta (Trofie oder Spaghetti)', 'Frisches Basilikumpesto', 'Pinienkerne', 'Parmesan', 'Gutes Olivenöl', 'Kirschtomaten'],
    description: 'In 12 Minuten auf dem Tisch: Frisches Basilikum, nussige Pinienkerne und aromatischer Parmesan.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch.'
  },

  // 8. OFENGUCK
  {
    id: 'rec_schweiz_ofenguck',
    title: 'Schweizer Ofenguck (Kartoffelstock-Auflauf mit Ei)',
    category: 'klassiker',
    effort: 'medium',
    durationMinutes: 35,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Luftiger Kartoffelstock (Püree)', 'Frische Freilandeier', 'Pilz-Gemüseragout oder Bratensauce', 'Geriebener Käse', 'Schnittlauch'],
    description: 'Schweizer Traditionsgericht: Samtiger Kartoffelstock im Ofen mit eingedrückten Mulden, in die Eier geschlagen und gratiniert werden.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch mit würzigem Champignon-Kräuter-Ragout in den Mulden.'
  },

  // 9. FLAMMKUCHEN
  {
    id: 'rec_ofen_flammkuchen',
    title: 'Knuspriger Flammkuchen (Elsässer Art & Vegetarisch)',
    category: 'auflauf',
    effort: 'easy',
    durationMinutes: 15,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Hauchdünner Flammkuchenteig', 'Crème fraîche / Schmand', 'Rote Zwiebeln', 'Lauchstreifen & Champignons oder Speck', 'Muskat', 'Pfeffer'],
    description: 'Hauchdünn und ultra-knusprig gebacken: Die Hälfte klassisch oder komplett vegetarisch mit Lauch, Pilzen und Feta.',
    isVegetarian: true,
    vegetarianOption: '🌱 Vegi-Variante: Mit zartem Lauch, dünnen Champignonscheiben und Fetakrümeln belegen.'
  },

  // 10. KARTOFFELGRATIN
  {
    id: 'rec_kartoffelgratin',
    title: 'Klassisches Kartoffelgratin Dauphinois',
    category: 'auflauf',
    effort: 'medium',
    durationMinutes: 50,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Festkochende Kartoffeln', 'Rahm (Sahne)', 'Milch', 'Knoblauch', 'Muskatnuss', 'Gruyère zum Überbacken'],
    description: 'Fein gehobelte Kartoffelscheiben, samtig geschmort in Knoblauchrahm und goldgelb mit Schweizer Käse überbacken.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch.'
  },

  // 11. KARTOFFELSTOCK
  {
    id: 'rec_kartoffelstock',
    title: 'Samtiger Kartoffelstock mit Buttersee & Gemüsesauce',
    category: 'klassiker',
    effort: 'easy',
    durationMinutes: 25,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Mehligkochende Kartoffeln', 'Gute Butter', 'Warme Milch', 'Frisch geriebene Muskatnuss', 'Aromatische Gemüserahmsauce'],
    description: 'Echter Seelenwärmer: Handgestampfter, luftiger Kartoffelstock mit einem Buttersee in der Mitte und feiner Sauce.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch mit sämiger Kräuter-Gemüsesauce.'
  },

  // 12. MINI CRÊPES
  {
    id: 'rec_mini_crepes',
    title: 'Mini Crêpes Buffet (Süss & Pikant zum Selberbelegen)',
    category: 'schnell',
    effort: 'easy',
    durationMinutes: 20,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Crêpeteig (Mehl, Eier, Milch)', 'Geriebener Käse, Spinat, Pilze (herzhaft)', 'Zimt-Zucker, Beeren, Nutella (süss)', 'Butter'],
    description: 'Gemütliches Pfannkuchen-Essen am Tisch: Jeder backt und belegt seine Mini-Crêpes nach eigenem Geschmack.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch – riesige Auswahl an herzhaften und süssen Toppings.'
  },

  // 13. FAJITAS
  {
    id: 'rec_fajitas_fiesta',
    title: 'Fajita-Abend mit Guacamole, Paprika & Vegi-Option',
    category: 'schnell',
    effort: 'easy',
    durationMinutes: 25,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Weizentortillas', 'Bunte Paprika & Zwiebeln', 'Rindfleischstreifen oder Marinierter Tofu/Bohnen', 'Frische Guacamole', 'Salsa', 'Sauerrahm', 'Cheddar'],
    description: 'Brutzelnde Pfanne mit Paprikastreifen und mexikanischen Gewürzen. Am Tisch rollt sich jeder seinen Lieblings-Wrap.',
    isVegetarian: true,
    vegetarianOption: '🌱 Perfekt für Vegetarier: Eine separate Pfanne mit Tofustreifen, schwarzen Bohnen und Mais servieren!'
  },

  // 14. BURGER
  {
    id: 'rec_homemade_burger',
    title: 'Gourmet Burger mit Pommes (Beef & Veggie-Patty)',
    category: 'schnell',
    effort: 'medium',
    durationMinutes: 25,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Brioche Buns', 'Rinderhack-Patty oder Veggie/Halloumi-Patty', 'Cheddarkäse', 'Gewürzgurken', 'Tomate & Salat', 'Burgersauce', 'Pommes Frites'],
    description: 'Saftiger Burger im gebutterten Brioche-Brötchen mit geschmolzenem Cheddar, frischen Zutaten und knusprigen Pommes.',
    isVegetarian: true,
    vegetarianOption: '🌱 Vegi-Option: Knuspriges Veggie-Patty oder goldbraun gegrillter Halloumi-Käse.'
  },

  // 15. KÜRBISSUPPE
  {
    id: 'rec_kuerbissuppe',
    title: 'Cremige Kürbis-Ingwer-Suppe mit gerösteten Kernen',
    category: 'suppe',
    effort: 'easy',
    durationMinutes: 25,
    requiresBaking: false,
    cookingMethod: 'one-pot',
    ingredients: ['Hokkaido-Kürbis', 'Kokosmilch', 'Frischer Ingwer', 'Gemüsebrühe', 'Kürbiskernöl', 'Geröstete Kürbiskerne', 'Knuspriges Baguette'],
    description: 'Samtig pürierte, wärmende Kürbissuppe mit feiner Ingwernote und nussigem Kernöl.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch & Vegan.'
  },

  // 16. CAFÉ COMPLET
  {
    id: 'rec_cafe_complet',
    title: 'Café Complet (Schweizer Brot-, Käse- & Znacht-Platte)',
    category: 'klassiker',
    effort: 'easy',
    durationMinutes: 10,
    requiresBaking: false,
    cookingMethod: 'kalt',
    ingredients: ['Frisches Holzofenbrot & Zopf', 'Schweizer Käseauswahl (Gruyère, Appenzeller, Tilsiter)', 'Gute Butter', 'Essiggurken & Silberzwiebeln', 'Tomaten & Gurkenscheiben', 'Confiture / Honig', 'Tee oder Kaffee'],
    description: 'Das gemütlichste Schweizer Wohlfühl-Znacht: Frisches Knusperbrot, feine Käseauswahl, Butter und Beilagen – herrlich unkompliziert.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch – ideal für den ganzen Haushalt.'
  },

  // 17. WÄHEN DIVERSE (KÄSE & BIRNEN)
  {
    id: 'rec_waehen_diverse',
    title: 'Schweizer Wähen (Würzige Käsewähe / Süsse Birnenwähe)',
    category: 'klassiker',
    effort: 'medium',
    durationMinutes: 40,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Wähenteig / Mürbeteig', 'Käseguss: Geriebener Gruyère, Zwiebeln, Eier, Rahm', 'Birnenguss: Reife Birnen, Mandelblättchen, Zimt', 'Muskatnuss'],
    description: 'Traditioneller Schweizer Blechkuchen: Herzhaft-würzige Käsewähe zum Hauptgang oder fruchtig-süsse Birnenwähe mit Mandelblättchen.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch.'
  },

  // 18. HAUSGEMACHTE LASAGNE
  {
    id: 'rec_lasagne_homemade',
    title: 'Hausgemachte Lasagne al Forno (mit Vegi-Gemüseragù)',
    category: 'auflauf',
    effort: 'hard',
    durationMinutes: 55,
    requiresBaking: true,
    cookingMethod: 'backofen',
    ingredients: ['Lasagneblätter', 'Bolognese-Ragù oder Linsen-Gemüseragù', 'Samtige Béchamelsauce', 'Mozzarella', 'Parmesan', 'Frisches Basilikum'],
    description: 'Köstlich geschichtete Nudelblätter mit reichhaltiger Sauce, cremiger Béchamel und zartschmelzendem Mozzarella überbacken.',
    isVegetarian: true,
    vegetarianOption: '🌱 Vegi-Variante: Mit aromatischem Linsen-Karotten-Sugo oder Spinat-Ricotta geschichtet.'
  },

  // 19. SPAGHETTI BOLOGNESE
  {
    id: 'rec_spaghetti_bolognese',
    title: 'Klassische Spaghetti Bolognese',
    category: 'pasta',
    effort: 'medium',
    durationMinutes: 40,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Spaghetti', 'Rinderhackfleisch', 'Karotten & Staudensellerie', 'Zwiebeln & Knoblauch', 'Passierte Tomaten', 'Rotwein oder Gemüsebrühe', 'Parmesan'],
    description: 'Herzhafte Fleischsauce langsam geschmort mit frischem Wurzelgemüse und italienischen Kräutern.',
    isVegetarian: false,
    vegetarianOption: '💡 Tipp: Für das vegetarische Haushaltsmitglied parallel die Linsen-Bolognese servieren.'
  },

  // 20. LINSEN-BOLOGNESE
  {
    id: 'rec_linsen_bolognese',
    title: 'Aromatische Linsen-Bolognese mit Spaghetti',
    category: 'pasta',
    effort: 'easy',
    durationMinutes: 30,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Spaghetti', 'Braune oder Rote Linsen', 'Karotten & Staudensellerie', 'Zwiebeln & Knoblauch', 'Gehackte Tomaten', 'Kräuter der Provence', 'Parmesan'],
    description: 'Herzhaft, sämig und proteinreich: Eine vollwertige pflanzliche Bolognese, die der klassischen Variante in nichts nachsteht.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch & Vegan.'
  },

  // 21. GNOCCHI MIT SALBEIBUTTER
  {
    id: 'rec_gnocchi_salbeibutter',
    title: 'Gnocchi in nussiger Salbeibutter & Parmesan',
    category: 'pasta',
    effort: 'easy',
    durationMinutes: 15,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Kartoffel-Gnocchi', 'Frische Salbeiblätter', 'Gute Butter (gebräunt)', 'Gehobelter Parmesan', 'Meersalzflocken', 'Kirschtomaten'],
    description: 'Zarte Kartoffelgnocchi kross geschwenkt in schäumender, nussiger Salbeibutter und mit Parmesan bestreut.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch.'
  },

  // 22. ONE-POT PASTA
  {
    id: 'rec_one_pot_pasta',
    title: 'Bunte One-Pot Pasta mit Kirschtomaten & Frischkäse',
    category: 'schnell',
    effort: 'easy',
    durationMinutes: 18,
    requiresBaking: false,
    cookingMethod: 'one-pot',
    ingredients: ['Pasta (Penne oder Fussili)', 'Kirschtomaten', 'Zucchini', 'Babyspinat', 'Frischkäse / Mascarpone', 'Gemüsebrühe', 'Knoblauch'],
    description: 'Alles in einem einzigen Topf gegart: Cremige Pasta mit marktfrischem Gemüse und minimalem Abwasch.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch.'
  },

  // 23. REIS UND DAHL
  {
    id: 'rec_reis_und_dahl',
    title: 'Indisches Rotes Linsen-Dal mit Basmatireis & Naan',
    category: 'vegetarisch',
    effort: 'easy',
    durationMinutes: 25,
    requiresBaking: false,
    cookingMethod: 'one-pot',
    ingredients: ['Rote Linsen', 'Duftender Basmatireis', 'Kokosmilch', 'Kurkuma, Kreuzkümmel & Garam Masala', 'Ingwer & Knoblauch', 'Frischer Spinat', 'Warmes Naanbrot'],
    description: 'Wohltuend und cremig: Indisches Linsengericht mit wärmenden Gewürzen, frischem Spinat und feinem Duftreis.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch & Vegan.'
  },

  // 24. CORDON BLEU MIT POMMES
  {
    id: 'rec_cordon_bleu',
    title: 'Knuspriges Cordon Bleu mit Pommes & Zitrone',
    category: 'fleisch',
    effort: 'medium',
    durationMinutes: 30,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Schnitzel (oder Sellerie/Aubergine für Vegi)', 'Schweizer Bergkäse (Appenzeller/Gruyère)', 'Schinken (oder Räuchertofu/Pilze)', 'Knusperpanade', 'Pommes Frites', 'Zitronenspalten'],
    description: 'Goldbraun herausgebackenes Cordon Bleu mit zartschmelzendem Käsekern und heissen Pommes Frites.',
    isVegetarian: false,
    vegetarianOption: '🌱 Vegi-Alternative: Köstliches Sellerie- oder Auberginen-Cordon-Bleu mit zartschmelzendem Alpkäse.'
  },

  // 25. FISCHSTÄBCHEN
  {
    id: 'rec_fischstaebchen',
    title: 'Goldene Fischstäbchen mit Kartoffelstock & Erbsen',
    category: 'fisch',
    effort: 'easy',
    durationMinutes: 20,
    requiresBaking: false,
    cookingMethod: 'herd',
    ingredients: ['Knusprige Fischstäbchen', 'Kartoffelstock (Püree)', 'Buttererbsen oder Rahmspinat', 'Zitronenspalten', 'Remoulade'],
    description: 'Der beliebte Familien-Klassiker: Goldgelbe Knusper-Fischstäbchen mit cremigem Kartoffelpüree und zarten Erbsen.',
    isVegetarian: false,
    vegetarianOption: '🌱 Vegi-Option: Für Vegetarier vegane Knusperstäbchen oder Grillkäse parallel braten.'
  },

  // 26. THAI CURRY
  {
    id: 'rec_thai_curry',
    title: 'Cremiges Thai-Gemüse-Curry mit Kokosmilch & Duftreis',
    category: 'vegetarisch',
    effort: 'easy',
    durationMinutes: 22,
    requiresBaking: false,
    cookingMethod: 'one-pot',
    ingredients: ['Knackiges Wokgemüse (Brokkoli, Karotten, Zuckerschoten)', 'Rote Thai-Currypaste', 'Kokosmilch', 'Knusper-Tofu oder Kichererbsen', 'Kaffir-Limettenblätter', 'Jasmin-Duftreis'],
    description: 'Aromatisch, bunt und sämig eingekocht in Kokosmilch – mit nussigem Tofu und duftendem Reis.',
    isVegetarian: true,
    vegetarianOption: '🌱 100% Vegetarisch & Vegan.'
  }
];

// Variation generator (strictly NO chicken breast!)
// Focuses heavily on vegetarian proteins and options for diverse meal planning:
const PROTEIN_OPTIONS = [
  { name: 'Knusper-Tofu', cat: 'vegan', time: 20, eff: 'easy' as const, isVeg: true, note: '🌱 100% Pflanzlich & proteinreich' },
  { name: 'Schweizer Bergkäse / Halloumi', cat: 'vegetarisch', time: 15, eff: 'easy' as const, isVeg: true, note: '🌱 Vegetarisch' },
  { name: 'Rote Linsen & Kichererbsen', cat: 'vegan', time: 20, eff: 'easy' as const, isVeg: true, note: '🌱 100% Vegan & ballaststoffreich' },
  { name: 'Frische Champignons & Waldpilze', cat: 'vegetarisch', time: 15, eff: 'easy' as const, isVeg: true, note: '🌱 Vegetarisch' },
  { name: 'Lachsfilet', cat: 'fisch', time: 20, eff: 'easy' as const, isVeg: false, note: '🐟 Fisch (Für Vegi: Tofu oder Grillkäse)' },
  { name: 'Riesengarnelen', cat: 'fisch', time: 15, eff: 'easy' as const, isVeg: false, note: '🐟 Meeresfrüchte' },
  { name: 'Rindfleischstreifen', cat: 'fleisch', time: 25, eff: 'medium' as const, isVeg: false, note: '🥩 Fleisch (Für Vegi: Marinierter Tofu)' },
  { name: 'Rinderhackfleisch', cat: 'fleisch', time: 25, eff: 'easy' as const, isVeg: false, note: '🥩 Fleisch (Für Vegi: Linsenhack)' }
];

const PREPARATION_STYLES = [
  { style: 'in cremiger Champignonrahmsauce', method: 'herd' as const, timeMod: 5, bake: false },
  { style: 'in würziger Tomaten-Basilikum-Sauce', method: 'herd' as const, timeMod: 0, bake: false },
  { style: 'überbacken mit Schweizer Bergkäse', method: 'backofen' as const, timeMod: 15, bake: true },
  { style: 'aus der Wok-Pfanne mit buntem Gemüse', method: 'herd' as const, timeMod: 0, bake: false },
  { style: 'im Kokos-Curry mit Koriander & Limette', method: 'one-pot' as const, timeMod: 5, bake: false },
  { style: 'mit gebräunter Kräuterbutter', method: 'herd' as const, timeMod: 0, bake: false },
  { style: 'mit knuspriger Knoblauchkruste aus dem Ofen', method: 'backofen' as const, timeMod: 10, bake: true },
  { style: 'in pikanter Erdnuss-Kokos-Sauce', method: 'herd' as const, timeMod: 0, bake: false },
  { style: 'auf buntem Ofengemüse', method: 'backofen' as const, timeMod: 15, bake: true }
];

const SIDES = [
  'Basmatireis',
  'Kartoffelstock (Püree)',
  'Pasta / Bandnudeln',
  'Röstkartoffeln',
  'Älpler Magronen',
  'Couscous mit Kräutern',
  'Knuspriges Baguette',
  'Frischer Blattsalat'
];

// Generate dynamic catalog ensuring 200+ structured, tailored meal ideas
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
          const totalDuration = Math.min(55, protein.time + prep.timeMod + (prep.bake ? 10 : 0));
          const effortLevel: 'easy' | 'medium' | 'hard' = totalDuration > 40 ? 'hard' : totalDuration > 25 ? 'medium' : 'easy';

          list.push({
            id: `rec_gen_${idCounter++}`,
            title,
            category: protein.cat as any,
            effort: effortLevel,
            durationMinutes: totalDuration,
            requiresBaking: prep.bake,
            cookingMethod: prep.method,
            ingredients: [protein.name, side, 'Zwiebeln', 'Knoblauch', 'Gewürze', prep.bake ? 'Käse zum Überbacken' : 'Frische Kräuter'],
            description: `Köstlich zubereitete ${protein.name} ${prep.style}, serviert mit ${side}.`,
            isVegetarian: protein.isVeg,
            vegetarianOption: protein.note
          });
        }
      }
    }
  }

  return list;
})();

export const RECIPE_CATEGORIES = [
  { id: 'all', label: 'Alle Gerichte' },
  { id: 'vegetarisch', label: '🌱 Vegetarisch / Vegan' },
  { id: 'schnell', label: '⚡ Schnell (< 25 min)' },
  { id: 'pasta', label: '🍝 Pasta & Nudeln' },
  { id: 'klassiker', label: '🇨🇭 Schweizer Klassiker' },
  { id: 'auflauf', label: '🥧 Aufläufe & Ofen' },
  { id: 'suppe', label: '🍲 Suppen' },
  { id: 'fisch', label: '🐟 Fisch' },
  { id: 'fleisch', label: '🥩 Fleisch' }
] as const;
