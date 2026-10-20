import { useState } from 'react';

// Logo del evento: logo_url (version para fondo oscuro) o logo_color_url (version a color, para el ticket).
// Si el evento no tiene logo (o la imagen no carga) se muestra el texto "BURGER FEST" con la tipografia de la app,
// que no lleva el nombre de ninguna ciudad.
const TEXTO = {
  blanco: 'text-crema',
  color: 'text-[#1a1a1a]',
};

export default function LogoEvento({ evento, variante = 'blanco', className = '', claseTexto = '' }) {
  const [fallo, setFallo] = useState(false);
  const url = variante === 'color' ? evento?.logo_color_url : evento?.logo_url;

  if (url && !fallo) {
    return <img src={url} alt="Burger Fest" className={className} onError={() => setFallo(true)} />;
  }

  return (
    <p
      className={`text-center font-display font-extrabold uppercase leading-[0.9] ${TEXTO[variante] || TEXTO.blanco} ${claseTexto}`}
    >
      Burger
      <br />
      Fest
    </p>
  );
}
