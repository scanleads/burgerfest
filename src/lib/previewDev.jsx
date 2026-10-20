import Confirmacion from '../components/Confirmacion.jsx';
import PantallaBienvenida from '../components/PantallaBienvenida.jsx';
import RevisionVoto from '../components/RevisionVoto.jsx';
import { useEffect, useState } from 'react';

// Solo desarrollo (npm run dev): ?preview=bienvenida | revision | confirmacion
// Datos ficticios fijos, sin llamadas a Supabase. main.jsx lo importa solo si import.meta.env.DEV.

const evento = {
  ciudad: 'Ciudad de ejemplo',
  lema: 'La última mordida es tuya.',
  lugar: 'LUGAR DE EJEMPLO',
  fecha_texto: '17 Y 18 OCT',
};

const burger8 = { id: 'demo-8', nombre: 'La Llanera', restaurante: 'Siria', categoria: '8_dolares' };
const burger10 = {
  id: 'demo-10',
  nombre: 'La Bestia (Burger Crispy)',
  restaurante: 'Siria',
  categoria: '10_dolares',
};

function Bienvenida() {
  // &fase=pausada muestra el mensaje "abre en breve"; por defecto, cuenta regresiva a 3 dias.
  const pausada = new URLSearchParams(window.location.search).get('fase') === 'pausada';
  const [objetivo] = useState(() => Date.now() + 3 * 86400000);
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <PantallaBienvenida
      evento={evento}
      fase={pausada ? 'pausada' : 'antes'}
      falta={Math.max(0, objetivo - ahora)}
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
