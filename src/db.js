const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const VISUAL_STORES = [
  {
    name: "Horta do Ze",
    category: "hortifruti",
    floor: "Ala Sul - Banca 08",
    description: "Os vegetais e frutas mais frescos da regiao, colhidos diariamente de produtores locais selecionados.",
    image_url: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?auto=format&fit=crop&q=80&w=220&h=220",
    whatsapp_url: "https://wa.me/5515991111001",
    instagram_url: "https://instagram.com/hortadoze",
    hours: "07:00 - 19:00"
  },
  {
    name: "Adega Imperial",
    category: "bebidas",
    floor: "Piso L1 - Loja 15",
    description: "Uma cave exclusiva com rotulos premiados, desde vinhos nacionais a raridades internacionais.",
    image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&q=80&w=220&h=220",
    instagram_url: "https://instagram.com/adegaimperial",
    hours: "10:00 - 22:00"
  },
  {
    name: "Pasta & Basta",
    category: "gastronomia",
    floor: "Terraco Gourmet",
    description: "A autentica culinaria italiana com massas frescas feitas a mao todos os dias diante dos seus olhos.",
    image_url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=220&h=220",
    whatsapp_url: "https://wa.me/5515991111003",
    instagram_url: "https://instagram.com/pastaebasta",
    hours: "11:30 - 23:00"
  },
  {
    name: "Peixaria do Mar",
    category: "hortifruti",
    floor: "Ala Norte - Banca 22",
    description: "Recebemos diariamente o melhor da costa nacional. Qualidade e frescor incomparaveis.",
    image_url: "https://images.unsplash.com/photo-1579631542720-3a87824fff86?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1535140728325-a4d3707eee61?auto=format&fit=crop&q=80&w=220&h=220",
    whatsapp_url: "https://wa.me/5515991111004",
    hours: "08:00 - 20:00"
  },
  {
    name: "Cortes de Origem",
    category: "hortifruti",
    floor: "Ala Central - Loja 03",
    description: "Boutique de carnes focada em cortes nobres, maturacao dry-aged e atendimento personalizado.",
    image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&q=80&w=220&h=220",
    instagram_url: "https://instagram.com/cortesdeorigem",
    hours: "08:00 - 21:00"
  },
  {
    name: "Cafe Artisan",
    category: "gastronomia",
    floor: "Entrada Principal",
    description: "Cafes de especialidade, torra propria e uma selecao de doces que elevam o seu paladar.",
    image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=220&h=220",
    whatsapp_url: "https://wa.me/5515991111006",
    instagram_url: "https://instagram.com/cafeartisan",
    hours: "09:00 - 21:00"
  },
  {
    name: "Queijaria Real",
    category: "hortifruti",
    floor: "Ala Leste - Banca 12",
    description: "Do queijo Canastra as iguarias europeias. Uma curadoria completa de queijos e antepastos.",
    image_url: "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&q=80&w=220&h=220",
    instagram_url: "https://instagram.com/queijariareal",
    hours: "08:00 - 20:00"
  },
  {
    name: "Floricultura Aurora",
    category: "servicos",
    floor: "Piso L1 - Loja 02",
    description: "Arranjos florais exclusivos e plantas ornamentais para transformar qualquer ambiente.",
    image_url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&q=80&w=220&h=220",
    whatsapp_url: "https://wa.me/5515991111008",
    instagram_url: "https://instagram.com/floriculturaaurora",
    hours: "09:00 - 19:00"
  },
  {
    name: "Bistro do Porto",
    category: "gastronomia",
    floor: "Piso L2 - Gourmet",
    description: "Especialistas em frutos do mar e culinaria mediterranea classica.",
    image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&q=80&w=220&h=220",
    whatsapp_url: "https://wa.me/5515991111009",
    hours: "11:30 - 23:30"
  },
  {
    name: "Emporio de Graos",
    category: "hortifruti",
    floor: "Ala Oeste - Banca 05",
    description: "Produtos a granel, sementes e especiarias de todo o mundo.",
    image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1471194402529-8e0f5a675de6?auto=format&fit=crop&q=80&w=220&h=220",
    instagram_url: "https://instagram.com/emporiodegraos",
    hours: "08:00 - 19:30"
  },
  {
    name: "Gelateria Di Roma",
    category: "gastronomia",
    floor: "Praca Central",
    description: "O verdadeiro gelato artesanal italiano com frutas naturais da estacao.",
    image_url: "https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1511911063855-2bf39afa5b2e?auto=format&fit=crop&q=80&w=220&h=220",
    whatsapp_url: "https://wa.me/5515991111011",
    instagram_url: "https://instagram.com/gelateriadiroma",
    hours: "10:00 - 22:00"
  },
  {
    name: "Cervejaria Artesanal",
    category: "bebidas",
    floor: "Ala Norte - Loja 10",
    description: "Tap house com 12 torneiras de cervejas locais e nacionais.",
    image_url: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=220&h=220",
    instagram_url: "https://instagram.com/cervejariaartesanal",
    hours: "12:00 - 00:00"
  },
  {
    name: "Padaria São Bento",
    category: "gastronomia",
    floor: "Ala Central - Loja 19",
    description: "Pães de fermentação natural, doces artesanais e linha completa para café da manhã.",
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&q=80&w=220&h=220",
    whatsapp_url: "https://wa.me/5515991111013",
    instagram_url: "https://instagram.com/padariasaobento",
    hours: "06:30 - 21:00"
  },
  {
    name: "Casa das Especiarias",
    category: "hortifruti",
    floor: "Ala Oeste - Banca 09",
    description: "Ervas, temperos e sais especiais com curadoria nacional e internacional.",
    image_url: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&q=80&w=220&h=220",
    instagram_url: "https://instagram.com/casadasespeciarias",
    hours: "08:00 - 20:00"
  },
  {
    name: "Mercatto Natural",
    category: "servicos",
    floor: "Piso L1 - Loja 21",
    description: "Produtos naturais, suplementos e atendimento especializado para rotina saudável.",
    image_url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1615486363973-5b6f5af8f84f?auto=format&fit=crop&q=80&w=220&h=220",
    whatsapp_url: "https://wa.me/5515991111015",
    instagram_url: "https://instagram.com/mercattonatural",
    hours: "09:00 - 21:00"
  },
  {
    name: "Cantina Belluno",
    category: "gastronomia",
    floor: "Terraco Gourmet - Loja 12",
    description: "Cozinha italiana tradicional com massas artesanais, risotos e carta de vinhos.",
    image_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=220&h=220",
    whatsapp_url: "https://wa.me/5515991111016",
    instagram_url: "https://instagram.com/cantinabelluno",
    hours: "11:30 - 23:00"
  },
  {
    name: "Boutique do Azeite",
    category: "bebidas",
    floor: "Piso L2 - Loja 08",
    description: "Azeites premium, balsâmicos e conservas gourmet para harmonizações especiais.",
    image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=220&h=220",
    whatsapp_url: "https://wa.me/5515991111017",
    instagram_url: "https://instagram.com/boutiquedoazeite",
    hours: "09:30 - 21:30"
  },
  {
    name: "Empório Oriente",
    category: "hortifruti",
    floor: "Ala Leste - Banca 17",
    description: "Produtos asiáticos, molhos especiais e ingredientes autênticos para culinária oriental.",
    image_url: "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&q=80&w=600",
    logo_url: "https://images.unsplash.com/photo-1607301405390-86f67657f6ae?auto=format&fit=crop&q=80&w=220&h=220",
    instagram_url: "https://instagram.com/emporiooriente",
    hours: "08:30 - 20:30"
  }
];
const VISUAL_EVENTS = [
  {
    title: "Grande Workshop de Vinhos de Inverno",
    event_date: "12 de Maio",
    description: "Uma jornada sensorial profunda pelos tintos encorpados da nossa adega. Degustacao guiada com harmonizacao de queijos artesanais.",
    image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=1200",
    highlight: 0
  },
  {
    title: "Jazz no Terraco ao Por-do-sol",
    event_date: "18 de Maio",
    description: "Musica ao vivo com o Trio Quartier no nosso Terraco Gourmet. Entrada livre.",
    image_url: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&q=80&w=600",
    highlight: 0
  },
  {
    title: "Culinaria Show: Pasta Fresca",
    event_date: "25 de Maio",
    description: "Aprenda a fazer a autentica massa italiana com o Chef da Pasta & Basta.",
    image_url: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=600",
    highlight: 0
  },
  {
    title: "Mercado da Madrugada: Sabores da Roça",
    event_date: "28 de Abril",
    description: "Produtores locais com degustacao de queijos, mel e geleias artesanais. Das 6h as 10h.",
    image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200",
    highlight: 0
  },
  {
    title: "Noite do Queijo Canastra e Vinhos",
    event_date: "29 de Abril",
    description: "Roda de harmonizacao com sommelier convidado e mesa de antepastos no Terraco Gourmet.",
    image_url: "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&q=80&w=1200",
    highlight: 1
  },
  {
    title: "Feira de Artesanato e Flores de Estacao",
    event_date: "30 de Abril",
    description: "Expositores de artesanato, arranjos florais e oficina rapida de arranjos para a mesa.",
    image_url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=1200",
    highlight: 0
  },
  {
    title: "Samba e Bossa no Pátio Central",
    event_date: "26 de Maio",
    description: "Grupo instrumental com repertorio de classics brasileiros. Entrada gratuita.",
    image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1200",
    highlight: 0
  },
  {
    title: "Aula Aberta: Sushi para Iniciantes",
    event_date: "27 de Maio",
    description: "Chef convidado ensina cortes basicos, arroz e montagem de combinados. Vagas limitadas.",
    image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=1200",
    highlight: 0
  },
  {
    title: "Mercadão Kids: Oficina de Cupcakes",
    event_date: "28 de Maio",
    description: "Atividade infantil com decoracao de cupcakes e suco natural. Inscricao no balcão de informações.",
    image_url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=1200",
    highlight: 0
  },
  {
    title: "Degustação de Cafés Especiais",
    event_date: "29 de Maio",
    description: "Torrefação ao vivo, prova de origens e dicas de preparo com barista campeão regional.",
    image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200",
    highlight: 0
  },
  {
    title: "Encerramento do Mês: Noite do Churrasco",
    event_date: "30 de Maio",
    description: "Especial de cortes nobres com trio gaúcho e vinhos tintos selecionados pela adega.",
    image_url: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&q=80&w=1200",
    highlight: 0
  },
  {
    title: "Brunch de Domingo no Mercadão",
    event_date: "31 de Maio",
    description: "Menu especial com ovos beneditinos, panquecas e espumante para encerrar maio em grande estilo.",
    image_url: "https://images.unsplash.com/photo-1504674900240-9034a9ef88e2?auto=format&fit=crop&q=80&w=1200",
    highlight: 0
  }
];
const VISUAL_GASTRONOMY = [
  {
    name: "Brasa Nobre",
    cuisine_type: "Churrasco Premium",
    location: "Terraco Gourmet - Loja 04",
    description: "Carnes nobres na parrilla com cortes especiais e acompanhamentos autorais.",
    image_url: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Sushi Kaiso",
    cuisine_type: "Japonesa",
    location: "Piso L2 - Loja 11",
    description: "Sushis, sashimis e pratos quentes preparados na hora por equipe especializada.",
    image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Dolce Vita",
    cuisine_type: "Doces e Cafeteria",
    location: "Praca Central",
    description: "Sobremesas artesanais, cafe especial e experiencias doces para toda a familia.",
    image_url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Forno da Casa",
    cuisine_type: "Pizzaria Artesanal",
    location: "Terraco Gourmet - Loja 07",
    description: "Pizzas de longa fermentacao com ingredientes frescos e massas leves.",
    image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Taco y Fuego",
    cuisine_type: "Mexicana",
    location: "Ala Oeste - Loja 09",
    description: "Tacos, burritos e nachos com molhos autorais e toque apimentado na medida certa.",
    image_url: "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Bowl Verde",
    cuisine_type: "Saudavel",
    location: "Piso L1 - Loja 05",
    description: "Bowls, saladas e pratos funcionais com foco em ingredientes naturais e frescos.",
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Tempero Baiano",
    cuisine_type: "Brasileira",
    location: "Ala Sul - Loja 14",
    description: "Sabores do litoral nordestino com moquecas, acaraje e pratos regionais marcantes.",
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Risotto & Vinho",
    cuisine_type: "Contemporanea",
    location: "Piso L2 - Loja 03",
    description: "Risotos cremosos e harmonizacao com rotulos selecionados da casa.",
    image_url: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Naan Station",
    cuisine_type: "Indiana",
    location: "Ala Norte - Loja 18",
    description: "Curries, arroz basmati e paes naan feitos na hora em forno tradicional.",
    image_url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Crepe Avenue",
    cuisine_type: "Francesa",
    location: "Praca Central - Quiosque 02",
    description: "Crepes doces e salgados com receitas classicas e opcoes exclusivas da casa.",
    image_url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Casa do Ramen",
    cuisine_type: "Asiatica",
    location: "Piso L1 - Loja 12",
    description: "Caldos encorpados, noodles artesanais e toppings premium em porcoes generosas.",
    image_url: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Burger Atelier",
    cuisine_type: "Hamburgueria",
    location: "Ala Leste - Loja 06",
    description: "Blend exclusivo, pao brioche e acompanhamentos artesanais para uma experiencia completa.",
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Sorbetto Lab",
    cuisine_type: "Gelateria",
    location: "Terraco Gourmet - Quiosque 01",
    description: "Sorvetes e sorbets de producao propria com frutas frescas e sabores sazonais.",
    image_url: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&q=80&w=600"
  }
];

let dbInstance = null;
let poolInstance = null;

function mapPlaceholders(sql, params = []) {
  let index = 0;
  const text = sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
  return { text, values: params };
}

function shouldAppendReturningId(sql) {
  const normalized = sql.trim().toLowerCase();
  return normalized.startsWith("insert into") && !normalized.includes("returning");
}

function createDbAdapter(pool) {
  return {
    async all(sql, ...params) {
      const { text, values } = mapPlaceholders(sql, params);
      const result = await pool.query(text, values);
      return result.rows;
    },
    async get(sql, ...params) {
      const { text, values } = mapPlaceholders(sql, params);
      const result = await pool.query(text, values);
      return result.rows[0] || null;
    },
    async run(sql, ...params) {
      const mapped = mapPlaceholders(sql, params);
      const queryText = shouldAppendReturningId(mapped.text) ? `${mapped.text} RETURNING id` : mapped.text;
      const result = await pool.query(queryText, mapped.values);

      return {
        lastID: result.rows?.[0]?.id || null,
        changes: result.rowCount || 0
      };
    },
    async exec(sql) {
      await pool.query(sql);
    }
  };
}

async function syncVisualCatalog(db) {
  await db.exec("BEGIN TRANSACTION");
  try {
    await db.run("DELETE FROM stores");
    for (const store of VISUAL_STORES) {
      await db.run(
        `INSERT INTO stores (name, category, floor, description, image_url, logo_url, whatsapp_url, instagram_url, hours, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        store.name,
        store.category,
        store.floor,
        store.description,
        store.image_url,
        store.logo_url || null,
        store.whatsapp_url || null,
        store.instagram_url || null,
        store.hours || "10:00 - 22:00"
      );
    }

    await db.run("DELETE FROM events");
    for (const event of VISUAL_EVENTS) {
      await db.run(
        `INSERT INTO events (title, event_date, description, image_url, highlight, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        event.title,
        event.event_date,
        event.description,
        event.image_url,
        event.highlight
      );
    }

    await db.run("DELETE FROM gastronomy_items");
    for (const item of VISUAL_GASTRONOMY) {
      await db.run(
        `INSERT INTO gastronomy_items (name, cuisine_type, location, description, image_url, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        item.name,
        item.cuisine_type,
        item.location,
        item.description,
        item.image_url
      );
    }
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

async function initDb() {
  if (dbInstance) return dbInstance;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL nao configurada. Defina a string de conexao PostgreSQL.");
  }

  poolInstance = new Pool({
    connectionString,
    ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false }
  });

  const db = createDbAdapter(poolInstance);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      floor TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      logo_url TEXT,
      whatsapp_url TEXT,
      instagram_url TEXT,
      hours TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      event_date TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      highlight INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS gastronomy_items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      cuisine_type TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec("ALTER TABLE stores ADD COLUMN IF NOT EXISTS whatsapp_url TEXT");
  await db.exec("ALTER TABLE stores ADD COLUMN IF NOT EXISTS instagram_url TEXT");
  await db.exec("ALTER TABLE stores ADD COLUMN IF NOT EXISTS hours TEXT");
  await db.exec("ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url TEXT");

  const admin = await db.get("SELECT id FROM admins WHERE email = ?", "admin@mercado.local");
  if (!admin) {
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    await db.run(
      "INSERT INTO admins (email, password_hash) VALUES (?, ?)",
      "admin@mercado.local",
      passwordHash
    );
  }

  const seedOnStartup =
    process.env.SEED_ON_STARTUP === "true" ||
    (process.env.SEED_ON_STARTUP !== "false" && process.env.NODE_ENV !== "production");

  if (seedOnStartup) {
    await syncVisualCatalog(db);
  }

  dbInstance = db;
  return db;
}

module.exports = {
  initDb
};
