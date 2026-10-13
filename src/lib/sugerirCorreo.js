// Sugiere un correo corregido cuando el dominio parece un error de tipeo.
// Devuelve el correo corregido o null. Ante la duda, null.

const DOMINIOS_CONOCIDOS = [
  'gmail.com',
  'hotmail.com',
  'hotmail.es',
  'outlook.com',
  'outlook.es',
  'yahoo.com',
  'yahoo.es',
  'icloud.com',
  'live.com',
];

// Dominios legitimos que NUNCA reciben sugerencia.
const DOMINIOS_LEGITIMOS = [
  'ymail.com',
  'mail.com',
  'me.com',
  'mac.com',
  'aol.com',
  'msn.com',
  'gmx.com',
  'rocketmail.com',
  'protonmail.com',
  'proton.me',
  'email.com',
];

const TLD_FUZZY = ['com', 'es'];
const MIN_SLD_ESCRITO = 4; // largo minimo del dominio que escribio el usuario
const MIN_SLD_CONOCIDO = 5; // no se compara contra conocidos de nombre muy corto (ej. live)

// Distancia de edicion con transposicion de letras adyacentes (gmial -> gmail = 1).
function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) d[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) d[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + costo);

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[a.length][b.length];
}

function corregirTerminacion(dominio) {
  return dominio
    .replace(/\.com(\.?com)+$/, '.com')
    .replace(/\.(con|cm|om|vom|comd|co)$/, '.com');
}

export function sugerirCorreo(correo) {
  try {
    const texto = String(correo ?? '').trim().toLowerCase();
    const arroba = texto.lastIndexOf('@');

    if (arroba < 1 || /\s/.test(texto)) return null;

    const local = texto.slice(0, arroba);
    const dominio = texto.slice(arroba + 1);

    if (!dominio.includes('.')) return null;
    if (DOMINIOS_CONOCIDOS.includes(dominio) || DOMINIOS_LEGITIMOS.includes(dominio)) return null;

    const corregido = corregirTerminacion(dominio);

    if (DOMINIOS_LEGITIMOS.includes(corregido)) return null;
    if (DOMINIOS_CONOCIDOS.includes(corregido)) return `${local}@${corregido}`;

    // Distancia de edicion: solo dominios de dos partes (sin subdominios ni .com.ve, .edu, etc.)
    const partes = corregido.split('.');
    if (partes.length !== 2 || !TLD_FUZZY.includes(partes[1])) return null;

    const [sld, tld] = partes;
    if (sld.length < MIN_SLD_ESCRITO) return null;

    let mejor = null;
    let mejorDistancia = Infinity;
    let empate = false;

    for (const conocido of DOMINIOS_CONOCIDOS) {
      const [sldConocido, tldConocido] = conocido.split('.');
      if (tldConocido !== tld || sldConocido.length < MIN_SLD_CONOCIDO) continue;

      const maxima = sldConocido.length >= 7 && sld.length >= 7 ? 2 : 1;
      const d = distancia(sld, sldConocido);
      if (d > maxima) continue;

      if (d < mejorDistancia) {
        mejor = conocido;
        mejorDistancia = d;
        empate = false;
      } else if (d === mejorDistancia) {
        empate = true;
      }
    }

    if (!mejor || empate) return null;

    return `${local}@${mejor}`;
  } catch {
    return null;
  }
}
