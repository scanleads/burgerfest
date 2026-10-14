import Confirmacion from '../components/Confirmacion.jsx';
import PantallaBienvenida from '../components/PantallaBienvenida.jsx';
import RevisionVoto from '../components/RevisionVoto.jsx';
import { fechasEvento, useAhora } from './faseEvento.js';

// Solo desarrollo (npm run dev): ?preview=bienvenida | revision | confirmacion
// Datos ficticios fijos, sin llamadas a Supabase. main.jsx lo importa solo si import.meta.env.DEV.

const config = {
  ciudad_activa: 'Barquisimeto',
  inicio_evento: '2026-10-17T10:00:00-04:00',
  fin_evento: '2026-10-18T23:00:00-04:00',
};

const burger8 = { id: 'demo-8', nombre: 'La Llanera', restaurante: 'Siria', categoria: '8_dolares' };
const burger10 = {
  id: 'demo-10',
  nombre: 'La Bestia (Burger Crispy)',
  restaurante: 'Siria',
  categoria: '10_dolares',
};

function Bienvenida() {
  // &ahora=... simula la hora; &inicio=... &fin=... cambian las fechas (ver faseEvento.js).
  // &fase=durante fuerza el mensaje "abre en breve".
  const fechas = fechasEvento(config) || { inicio: Date.now() + 3 * 86400000, fin: Date.now() + 5 * 86400000 };
  const ahora = useAhora(fechas);
  const forzarDurante = new URLSearchParams(window.location.search).get('fase') === 'durante';
  const fase = forzarDurante || ahora >= fechas.inicio ? 'durante' : 'antes';

  return (
    <PantallaBienvenida
      config={config}
      fase={fase}
      falta={fechas.inicio - ahora}
      onVerMenu={() => {}}
    />
  );
}

export default function PreviewDev({ tipo }) {
  if (tipo === 'bienvenida') return <Bienvenida />;

  if (tipo === 'revision') {
    return (
      <RevisionVoto
        selectedByCategory={{ '8_dolares': burger8.id, '10_dolares': burger10.id }}
        votesByCategory={{}}
        hamburguesas={[burger8, burger10]}
        onChangeCategory={() => {}}
        onVotar={() => {}}
        busy={false}
        error=""
      />
    );
  }

  if (tipo === 'confirmacion') {
    return (
      <Confirmacion
        votos={{
          '8_dolares': { categoria: '8_dolares', hamburguesa: burger8 },
          '10_dolares': { categoria: '10_dolares', hamburguesa: burger10 },
        }}
      />
    );
  }

  return <p style={{ padding: 20 }}>?preview= bienvenida | revision | confirmacion</p>;
}
