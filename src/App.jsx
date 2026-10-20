import { useEffect, useMemo, useState } from 'react';
import Confirmacion from './components/Confirmacion.jsx';
import Loading from './components/Loading.jsx';
import MenuCompleto from './components/MenuCompleto.jsx';
import PantallaCerrada from './components/PantallaCerrada.jsx';
import RegistroForm from './components/RegistroForm.jsx';
import RevisionVoto from './components/RevisionVoto.jsx';
import VotacionCategoria from './components/VotacionCategoria.jsx';
import { getDeviceId } from './lib/device.js';
import { slugDeUrl, useEventoActual } from './lib/evento.js';
import { supabase } from './lib/supabase.js';

const CATEGORY_8 = '8_dolares';
const CATEGORY_10 = '10_dolares';
const CATEGORIES = [CATEGORY_8, CATEGORY_10];

// Pantallas del flujo en las que una votacion cerrada saca al usuario (la confirmacion final se conserva)
const STATUS_EN_FLUJO = ['loading', 'registro', 'voto_8', 'voto_10', 'revision'];

function tieneCodigo(error, codigo) {
  return String(error?.message || '').includes(codigo);
}

function friendlySupabaseError(error) {
  if (!error) {
    return 'Ocurrio un error inesperado. Intenta de nuevo.';
  }

  if (tieneCodigo(error, 'dominio_bloqueado')) {
    return 'Usa tu correo personal para votar.';
  }

  if (tieneCodigo(error, 'consentimiento_requerido')) {
    return 'Para votar necesitas aceptar recibir información. Marca la casilla y continúa.';
  }

  if (tieneCodigo(error, 'correo_en_otro_evento')) {
    return 'Este correo ya participó en otra edición. Usa otro correo para votar en esta.';
  }

  if (tieneCodigo(error, 'evento_no_disponible')) {
    return 'Este evento ya no está disponible.';
  }

  if (tieneCodigo(error, 'votacion_cerrada')) {
    return 'La votación está cerrada en este momento.';
  }

  return 'No pudimos conectar con la base de datos. Revisa tu senal e intenta otra vez.';
}

function zonaHoraria() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

function nextStepFromVotes(votesByCategory) {
  if (!votesByCategory[CATEGORY_8]) {
    return CATEGORY_8;
  }

  if (!votesByCategory[CATEGORY_10]) {
    return CATEGORY_10;
  }

  return 'confirmacion';
}

function statusFromCategory(category) {
  return category === CATEGORY_10 ? 'voto_10' : 'voto_8';
}

function categoryFromStatus(status) {
  return status === 'voto_10' ? CATEGORY_10 : CATEGORY_8;
}

export default function App() {
  const slug = useMemo(slugDeUrl, []);
  const { estado: estadoEvento, evento, refrescar } = useEventoActual(slug);

  const [status, setStatus] = useState('loading');
  const [hamburguesas, setHamburguesas] = useState([]);
  const [menuCargadoDe, setMenuCargadoDe] = useState(null);
  const [participante, setParticipante] = useState(null);
  const [votesByCategory, setVotesByCategory] = useState({});
  const [selectedByCategory, setSelectedByCategory] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editingFromRevision, setEditingFromRevision] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const activeCategory = categoryFromStatus(status);
  const eventoId = evento?.id ?? null;
  const eventoSlug = evento?.slug ?? slug;
  const abierto = Boolean(evento?.abierto);

  // Menu del evento (se carga una vez por evento; se puede ver aunque la votacion este cerrada)
  useEffect(() => {
    if (!eventoId) return undefined;

    let activo = true;

    supabase.rpc('menu_evento_v2', { p_slug: eventoSlug }).then(({ data, error: menuError }) => {
      if (!activo) return;

      if (menuError) {
        setError(friendlySupabaseError(menuError));
      } else {
        setHamburguesas(data || []);
      }
      setMenuCargadoDe(eventoId);
    });

    return () => {
      activo = false;
    };
  }, [eventoId, eventoSlug]);

  // Que pantalla corresponde segun el estado del evento (siempre calculado en el servidor)
  useEffect(() => {
    if (estadoEvento === 'loading') return;

    if (estadoEvento !== 'ok' || !evento) {
      // Sin evento (error de red o evento no disponible): pantalla de cerrado, salvo la confirmacion final
      setStatus((actual) => (actual === 'confirmacion' ? actual : 'cerrado'));
      return;
    }

    if (abierto) {
      // Con la votacion abierta se espera al menu para no mostrar el flujo sin hamburguesas
      if (menuCargadoDe !== eventoId) return;
      setStatus((actual) => (actual === 'loading' || actual === 'cerrado' ? 'registro' : actual));
    } else {
      setStatus((actual) => (STATUS_EN_FLUJO.includes(actual) ? 'cerrado' : actual));
    }
  }, [estadoEvento, evento, abierto, eventoId, menuCargadoDe]);

  const burgersByCategory = useMemo(() => {
    return CATEGORIES.reduce((acc, category) => {
      acc[category] = hamburguesas.filter((burger) => burger.categoria === category);
      return acc;
    }, {});
  }, [hamburguesas]);

  async function loadParticipantVotes(participanteId) {
    const { data, error: votesError } = await supabase.rpc('mis_categorias_votadas_v2', {
      p_participante_id: participanteId,
      p_slug: eventoSlug,
    });

    if (votesError) {
      setError(friendlySupabaseError(votesError));
      return {};
    }

    const nextVotes = (data || []).reduce((acc, row) => {
      acc[row.categoria] = { categoria: row.categoria, hamburguesa_id: null, hamburguesa: null };
      return acc;
    }, {});

    setVotesByCategory(nextVotes);
    return nextVotes;
  }

  // La votacion se cerro (o el evento ya no existe) mientras la persona estaba en el flujo
  function irACerrado() {
    setStatus((actual) => (actual === 'confirmacion' ? actual : 'cerrado'));
    refrescar();
  }

  async function handleRegister(form) {
    setBusy(true);
    setError('');

    const { data: participanteId, error: rpcError } = await supabase.rpc('registrar_participante_v2', {
      p_nombre: form.nombre,
      p_apellido: form.apellido,
      p_correo: form.correo,
      p_edad: form.edad || null,
      p_hamburguesas_probadas: form.hamburguesas_probadas || null,
      p_acepta_marketing: form.acepta_marketing || false,
      p_device_id: getDeviceId(),
      p_zona_horaria: zonaHoraria(),
      p_slug: eventoSlug,
    });

    if (rpcError || !participanteId) {
      setBusy(false);

      if (tieneCodigo(rpcError, 'votacion_cerrada')) {
        irACerrado();
        return;
      }

      if (tieneCodigo(rpcError, 'evento_no_disponible')) {
        refrescar();
      }

      setError(friendlySupabaseError(rpcError));
      return;
    }

    setParticipante({ id: participanteId });
    const loadedVotes = await loadParticipantVotes(participanteId);
    const nextStep = nextStepFromVotes(loadedVotes);
    setStatus(nextStep === 'confirmacion' ? 'confirmacion' : statusFromCategory(nextStep));
    setBusy(false);
  }

  function handleSelectBurger(burger) {
    setSelectedByCategory((current) => ({
      ...current,
      [activeCategory]: burger.id,
    }));
  }

  function canOpenCategory(category) {
    if (category === CATEGORY_8) {
      return true;
    }

    return Boolean(votesByCategory[CATEGORY_8]) || activeCategory === CATEGORY_10;
  }

  function handleChangeCategory(category) {
    setError('');
    setEditingFromRevision(false);
    setStatus(statusFromCategory(category));
  }

  function handleEditCategory(category) {
    setError('');
    setEditingFromRevision(true);
    setStatus(statusFromCategory(category));
  }

  function handleConfirmVote() {
    setError('');

    if (votesByCategory[activeCategory]) {
      const missingCategory = CATEGORIES.find(
        (category) => !votesByCategory[category] && !selectedByCategory[category],
      );
      const nextStep = missingCategory || nextStepFromVotes(votesByCategory);

      if (nextStep === 'confirmacion') {
        setStatus('confirmacion');
      } else if (!missingCategory) {
        setStatus('revision');
      } else {
        setStatus(statusFromCategory(nextStep));
      }
      return;
    }

    const hamburguesaId = selectedByCategory[activeCategory];
    const burger = hamburguesas.find((item) => item.id === hamburguesaId);

    if (!participante || !burger) {
      setError('Selecciona una hamburguesa para confirmar tu voto.');
      return;
    }

    if (editingFromRevision) {
      setEditingFromRevision(false);
      setStatus('revision');
      return;
    }

    if (activeCategory === CATEGORY_8) {
      setStatus(votesByCategory[CATEGORY_10] ? 'revision' : 'voto_10');
      return;
    }

    setStatus('revision');
  }

  async function handleVotarFinal() {
    setError('');

    if (!participante) {
      setError('No pudimos validar tu registro. Intenta de nuevo.');
      return;
    }

    const pendingCategories = CATEGORIES.filter((category) => !votesByCategory[category]);
    const missingCategory = pendingCategories.find((category) => !selectedByCategory[category]);

    if (missingCategory) {
      setError('Completa ambas categorias antes de votar.');
      setStatus(statusFromCategory(missingCategory));
      return;
    }

    setBusy(true);

    let nextVotes = { ...votesByCategory };

    for (const category of CATEGORIES) {
      if (nextVotes[category]) {
        continue;
      }

      const hamburguesaId = selectedByCategory[category];
      const burger = hamburguesas.find((item) => item.id === hamburguesaId);

      if (!burger) {
        setBusy(false);
        setError(`Selecciona una hamburguesa valida para la categoria ${category === CATEGORY_8 ? '$8' : '$10'}.`);
        setStatus(statusFromCategory(category));
        return;
      }

      const { data: resultado, error: voteError } = await supabase.rpc('registrar_voto_v2', {
        p_participante_id: participante.id,
        p_hamburguesa_id: burger.id,
        p_categoria: category,
        p_slug: eventoSlug,
      });

      if (voteError) {
        setVotesByCategory(nextVotes);
        setBusy(false);
        setError(`No pudimos registrar tu voto en la categoria ${category === CATEGORY_8 ? '$8' : '$10'}. ${friendlySupabaseError(voteError)}`);
        return;
      }

      if (resultado === 'cerrado' || resultado === 'evento_no_disponible') {
        setVotesByCategory(nextVotes);
        setBusy(false);
        irACerrado();
        return;
      }

      if (resultado === 'ya_voto') {
        const refreshedVotes = await loadParticipantVotes(participante.id);
        nextVotes = { ...nextVotes, ...refreshedVotes };
        setVotesByCategory(nextVotes);
        continue;
      }

      if (resultado === 'error' || resultado !== 'ok') {
        setVotesByCategory(nextVotes);
        setBusy(false);
        setError(`No pudimos registrar tu voto en la categoria ${category === CATEGORY_8 ? '$8' : '$10'}. Intenta de nuevo.`);
        return;
      }

      nextVotes = {
        ...nextVotes,
        [category]: {
          categoria: category,
          hamburguesa_id: burger.id,
          hamburguesa: burger,
        },
      };
      setVotesByCategory(nextVotes);
    }

    setBusy(false);
    setStatus('confirmacion');
  }

  if (status === 'loading') {
    return <Loading />;
  }

  if (status === 'cerrado') {
    const puedeVerMenu = hamburguesas.length > 0;

    if (showMenu && puedeVerMenu) {
      return (
        <MenuCompleto
          hamburguesas={hamburguesas}
          votacionAbierta={false}
          onVolver={() => setShowMenu(false)}
        />
      );
    }

    return (
      <PantallaCerrada
        evento={evento}
        estado={estadoEvento}
        onVerMenu={puedeVerMenu ? () => setShowMenu(true) : undefined}
      />
    );
  }

  if (status === 'registro') {
    if (showMenu) {
      return <MenuCompleto hamburguesas={hamburguesas} onVolver={() => setShowMenu(false)} />;
    }

    return (
      <RegistroForm
        onSubmit={handleRegister}
        busy={busy}
        error={error}
        onVerMenu={() => setShowMenu(true)}
        evento={evento}
      />
    );
  }

  if (status === 'confirmacion') {
    return <Confirmacion votos={votesByCategory} />;
  }

  if (status === 'revision') {
    return (
      <RevisionVoto
        selectedByCategory={selectedByCategory}
        votesByCategory={votesByCategory}
        hamburguesas={hamburguesas}
        onChangeCategory={handleEditCategory}
        onVotar={handleVotarFinal}
        busy={busy}
        error={error}
      />
    );
  }

  return (
    <VotacionCategoria
      categoria={activeCategory}
      hamburguesas={burgersByCategory[activeCategory] || []}
      selectedId={selectedByCategory[activeCategory]}
      existingVote={votesByCategory[activeCategory]}
      onSelect={handleSelectBurger}
      onConfirm={handleConfirmVote}
      onChangeCategory={handleChangeCategory}
      canOpenCategory={canOpenCategory}
      busy={busy}
      error={error}
    />
  );
}
