// Fase 1 — carga de datos reales del Burger Fest (logos + hamburguesas).
// Uso: node --env-file=.env scripts/seed-fase1.mjs
import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOGOS_DIR = join(ROOT, 'LOGOS_BURGER_FEST');
const BUCKET = 'logos';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Mapeo archivo de logo -> restaurante
const LOGO_MAP = {
  '_0000_DON_PEDRO_20.png': 'Don Pedro',
  '_0001_LA_ARGENTINA_19.png': 'La Argentina',
  '_0002_FARRUGGIO_18.png': 'Farruggio',
  '_0003_TEXAS_BURGER_17.png': 'Texas Burger',
  '_0004_EL_PUT0_GYM_16.png': 'Puto Gym',
  '_0005_FRANCO_15.png': 'Franco',
  '_0006_PJ_GRILL_14.png': 'PJ Grill',
  '_0007_LA_BURGUESA_13.png': 'La Burguesa',
  '_0008_EL_BARRIL_12.png': 'Barril Grill',
  '_0009_DINNER_KING_11.png': 'Dinner King',
  '_0010_MAXIS_10.png': "Maxi's Street Food",
  '_0011_BURGER_PRO_09.png': 'Burger Pro',
  '_0012_DOG_HOUSE_08.png': 'Dog House',
  '_0013_PA_Q_DIEGO_07.png': 'Pa que Diego',
  '_0014_PRATTO_06.png': 'Pratto',
  '_0015_FASTO_MESA_05.png': 'Fasto A La Mesa',
  '_0016_TANAS_04.png': 'Tanas',
  '_0017_ALINO_03.png': 'Aliño',
  '_0018_WINGERS_02.png': 'Wingers',
  '_0019_PITTS_01.png': 'Pitts Bowling',
  '_0020_URBANA_00.png': 'La Burger Urbana',
};

// Hamburguesas por local: [nombre_8, descripcion_8, nombre_10, descripcion_10]
const MENU_POR_CONFIRMAR = 'Menú por confirmar';
const HAMBURGUESAS = {
  'Don Pedro': [null, null],
  'La Argentina': [null, null],
  'Farruggio': [null, null],
  'Franco': [null, null],
  'Texas Burger': [
    ['Bronwood', '100 gramos de carne de res cocida al carbón, queso cheddar, queso de mano, tocineta, pan de mantequilla y un toque especial de chimichurri.'],
    ['Houston', 'Doble carne de res cocida al carbón, doble cubierta de queso cheddar, queso de mano, tocineta, pan de mantequilla, vegetales frescos (lechuga y tomate), cebolla morada, pepinillo, papitas tipo fosforito, salsas tradicionales y salsa especial de la casa.'],
  ],
  'Puto Gym': [
    ['Bacon Tropical', 'Pan brioche artesanal sellado con mantequilla, lechuga fresca, 150g de jugosa carne de res, queso Kraft americano y una irresistible mermelada de piña con tocineta.'],
    ['La 240', 'Pan brioche artesanal, 240g de carne de res, doble queso fundido, doble bacon y una salsa especial de la casa cargada de pepinillo, jalapeño picadito y un toque de pimentón ahumado, cebolla morada en cuadritos y pepinillos para coronar.'],
  ],
  'PJ Grill': [
    ['Hamburguesa Maracaibo', 'Pan whopper, carne de picaña al grill, queso mozzarella, queso amarillo, tocineta, vegetales frescos (lechuga y tomate), salsa misrrely de la casa y cebolla caramelizada con trozos de tajada.'],
    ['Hamburguesa Colosal', 'Pan whopper, carne de picaña al grill, pulled pork, doble queso mozzarella, queso amarillo, tocineta, pepinillos frescos, vegetales frescos (lechuga y tomate) y salsa de la casa.'],
  ],
  'La Burguesa': [
    ['La Complicada', 'Blend de carne arrollada con tocineta, queso cheddar ahumado y salsa barbacoa asiática.'],
    ['La Zuliana', '180 gramos de blend de carne, queso de mano empanizado y frito, tajadas y salsa tártara.'],
  ],
  'Barril Grill': [
    ['Rodeo Grill', '140 gr pan de papa sellado a la plancha con mantequilla, 200 gr de carne de novillo al grill, 30 gr de queso mozzarella, 30 gr queso cheddar, 40 gr tocineta, 100gr de cebolla caramelizada, salsa ketza de la casa.'],
    ['La Ternera Top', '140 gr de pan de papa sellado a la plancha con mantequilla, 200 gr de carne de novillo al grill, 100 gr chuleta ahumada al barril, 100 gr de queso cebú, 30 gr queso cheddar, 50gr reducción de pepinillo, 50 gr de mermelada de tocineta.'],
  ],
  'Dinner King': [
    ['Inspirada en Cordon Bleu', 'Hamburguesa de pollo empanizado crujiente, rellenita con trozos de jamón y queso cheddar, bañada en una cremosa salsa especial y vegetales frescos.'],
    ['Clásica Americana', 'Una verdadera joya de 300g de pura carne jugosa, doble queso cheddar derretido, tocineta crujiente, vegetales frescos y la salsa secreta que te va a enamorar.'],
  ],
  "Maxi's Street Food": [
    ['Niccos', 'Pan brioche, doble carne smash estilo lacy edge, 2 slices de queso cheddar americano, tocineta crunch y rabo de res en cocción lenta, cebolla caramelizada, salsa de ajo rostizado y cebolla encurtida.'],
    ['Lucius', 'Pan de batata, doble medallón de carne de 110gr, 2 slices de queso cheddar americano, mermelada de tocino con cebolla y pimiento rojo asado flameado con ron Santa Teresa 1796, cebolla crispy, pepinillos encurtidos artesanales, salsa Maxi\'s.'],
  ],
  'Burger Pro': [
    ['Categoría Clásica', 'Carne con Fórmula Pro, queso cheddar, tocineta crocante, ajo confitado, cebolla caramelizada y Salsa Tártara Pro.'],
    ['Categoría Premium', 'Carne confitada a baja temperatura, queso mozzarella artesanal hecho en casa, cebolla caramelizada ahumada y tocineta crocante.'],
  ],
  'Dog House': [
    ['Burguer Morena', 'Pan americano sellado, cama de lechuga fresca, 180 g de carne jugosa con queso gouda fundido, tocineta crujiente en tiras, cebollas encurtidas y papas ralladas, todo bañado en nuestra salsa morena de la casa.'],
    ['Burguer Rabakor', 'Pan brioche suave, base de repollo morado, 220 g de pollo crispy agridulce, queso mozzarella gratinado y rábanos encurtidos, coronados con un toque de mayorábano.'],
  ],
  'Pa que Diego': [
    ['La Q Frao', 'Pollo crispy super crocante, queso cebú, queso amarillo, tocineta, repollo fresco, papitas, salsa tártara de la casa y salsa especial.'],
    ['La Maracucha', 'Carne jugosa, queso cebú, queso amarillo, jamón ahumado, tocineta, tajada de plátano maduro, queso frito y un toque de amor maracucho.'],
  ],
  'Pratto': [
    ['La Holly', 'Res, tocineta ahumada en casa, cebolla a la cerveza negra y salsa de ajo confitado.'],
    ['La Cordero Doble', 'Carne de cordero doble con queso y pan pretzel único.'],
  ],
  'Fasto A La Mesa': [
    ['Clásica a la Mesa', 'Pan de papa, 2 facilitas, doble carne con tocineta, cebolla caramelizada, pepinillo y el increíble aderezo smash.'],
    ['La Exótica', 'Pan de papa, macerado de la casa, aderezo ranch con base de aguacate, mermelada de tocineta y carne rellena de pimentón ahumado con queso, facilitas y aros de cebolla crocante.'],
  ],
  'Tanas': [
    ['Flonki', 'Doble carne smash, queso, cebolla brunoise, tocino, pepinillos y una brutal salsa de ajo confitado.'],
    ['Cloc', 'Triple carne smash, queso, un increíble Bacon Jam, pepinillos y la emblemática salsa Cloc.'],
  ],
  'Aliño': [
    ['Hamburguesa Aliño', 'Jugosa carne a la parrilla, queso amarillo, queso de mano, jamón ahumado y nuestra inigualable salsa tártara.'],
    ['Burger Parrillera', 'Carne a la parrilla, filete de pollo, chorizo, queso grillado y una exquisita salsa de pimentón ahumado.'],
  ],
  'Wingers': [
    ['Burger Doble', 'Pan americano suave de 120g, doble jugosa carne 100% de res, doble queso americano, cebolla, pepinillos y la clásica Salsa Winger\'s.'],
    ['Bacon Champiñón', 'Carne 100% res con tocineta tostada muy crujiente, champiñones al grill, queso americano, cebolla, pepinillos y salsa Winger\'s.'],
  ],
  'Pitts Bowling': [
    ['Burger Boys', 'Doble carne smash con doble queso americano derretido, aros de cebolla al panko japonés, crumble de tocineta, pan con sésamo y salsa secreta con BBQ.'],
    ['Pitts Ahogada Supreme', 'Carne de res, lomo de cerdo tipo roast beef, queso frito, cebolla caramelizada, queso americano y gravy de cerdo.'],
  ],
  'La Burger Urbana': [
    ['De la Calle Premium', 'Carne Premium 100% de res coronada con queso fundido americano, queso de mano, jamón ahumado, papas fritas, cebolla asada y salsa de la casa.'],
    ['Rakata', 'Carne Angus con chimichurri, coronada con queso mozzarella, chistorra con tocineta, lechuga crespa, cuadritos de cebolla morada, salsa de la casa y pan pretzel.'],
  ],
};

const TEST_ROWS = [
  { nombre: 'La Clásica', restaurante: 'Burger House' },
  { nombre: 'La Ahumada', restaurante: 'Grill Master' },
  { nombre: 'La Doble Queso', restaurante: 'Cheese Lovers' },
  { nombre: 'La Gourmet', restaurante: 'Prime Burger' },
  { nombre: 'La Trufa', restaurante: 'Chef Station' },
  { nombre: 'La BBQ Premium', restaurante: 'Smoke & Fire' },
];

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (buckets.some((b) => b.name === BUCKET)) {
    console.log(`Bucket "${BUCKET}" ya existe.`);
    return;
  }
  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
  });
  if (createError) throw createError;
  console.log(`Bucket "${BUCKET}" creado (público).`);
}

async function uploadLogos() {
  const files = readdirSync(LOGOS_DIR).filter((f) => f.toLowerCase().endsWith('.png'));
  const urlByRestaurante = {};
  for (const file of files) {
    const restaurante = LOGO_MAP[file];
    if (!restaurante) {
      console.warn(`⚠️  Sin mapeo para el logo: ${file}`);
      continue;
    }
    const buffer = readFileSync(join(LOGOS_DIR, file));
    const path = file;
    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType: 'image/png',
      upsert: true,
    });
    if (error) throw new Error(`Error subiendo ${file}: ${error.message}`);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urlByRestaurante[restaurante] = data.publicUrl;
    console.log(`✓ ${file} -> ${restaurante}`);
  }
  return urlByRestaurante;
}

async function deleteTestVotosYParticipantes() {
  const { error: errVotos, count: countVotos } = await supabase
    .from('votos')
    .delete({ count: 'exact' })
    .not('id', 'is', null);
  if (errVotos) throw errVotos;
  console.log(`Votos de prueba borrados: ${countVotos}`);

  const { error: errPart, count: countPart } = await supabase
    .from('participantes')
    .delete({ count: 'exact' })
    .not('id', 'is', null);
  if (errPart) throw errPart;
  console.log(`Participantes de prueba borrados: ${countPart}`);
}

async function deleteTestRows() {
  let deleted = 0;
  for (const row of TEST_ROWS) {
    const { data, error } = await supabase
      .from('hamburguesas')
      .delete()
      .eq('nombre', row.nombre)
      .eq('restaurante', row.restaurante)
      .select('id');
    if (error) throw error;
    deleted += data.length;
  }
  console.log(`Filas de prueba borradas: ${deleted}`);
}

async function insertHamburguesas(urlByRestaurante) {
  const rows = [];
  for (const [restaurante, menu] of Object.entries(HAMBURGUESAS)) {
    const foto_url = urlByRestaurante[restaurante] ?? null;
    const [item8, item10] = menu;
    rows.push({
      nombre: item8 ? item8[0] : restaurante,
      restaurante,
      categoria: '8_dolares',
      foto_url,
      descripcion: item8 ? item8[1] : MENU_POR_CONFIRMAR,
    });
    rows.push({
      nombre: item10 ? item10[0] : restaurante,
      restaurante,
      categoria: '10_dolares',
      foto_url,
      descripcion: item10 ? item10[1] : MENU_POR_CONFIRMAR,
    });
  }
  const { data, error } = await supabase.from('hamburguesas').insert(rows).select('id');
  if (error) throw error;
  console.log(`Filas insertadas: ${data.length}`);
  return data.length;
}

async function getExistingLogoUrls() {
  const urlByRestaurante = {};
  for (const restaurante of Object.keys(LOGO_MAP).map((f) => LOGO_MAP[f])) {
    const file = Object.keys(LOGO_MAP).find((f) => LOGO_MAP[f] === restaurante);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(file);
    urlByRestaurante[restaurante] = data.publicUrl;
  }
  return urlByRestaurante;
}

async function main() {
  const skipUpload = process.argv.includes('--skip-upload');
  await ensureBucket();
  const urlByRestaurante = skipUpload ? await getExistingLogoUrls() : await uploadLogos();
  await deleteTestVotosYParticipantes();
  await deleteTestRows();
  const inserted = await insertHamburguesas(urlByRestaurante);

  const { count, error } = await supabase
    .from('hamburguesas')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;

  console.log('\n=== RESUMEN ===');
  console.log(`Logos subidos: ${Object.keys(urlByRestaurante).length} / ${Object.keys(LOGO_MAP).length}`);
  console.log(`Filas insertadas: ${inserted}`);
  console.log(`Total filas en hamburguesas: ${count}`);
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
