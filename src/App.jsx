import { useEffect, useMemo, useState } from 'react';
import Confirmacion from './components/Confirmacion.jsx';
import Loading from './components/Loading.jsx';
import MenuCompleto from './components/MenuCompleto.jsx';
import PantallaCerrada from './components/PantallaCerrada.jsx';
import RegistroForm from './components/RegistroForm.jsx';
import RevisionVoto from './components/RevisionVoto.jsx';
import VotacionCategoria from './components/VotacionCategoria.jsx';
import { getDeviceId } from './lib/device.js';
import { supabase } from './lib/supabase.js';

const CATEGORY_8 = '8_dolares';
const CATEGORY_10 = '10_dolares';
const CATEGORIES = [CATEGORY_8, CATEGORY_10];

function friendlySupabaseError(error) {
  if (!error) {
    return 'Ocurrio un error inesperado. Intenta de nuevo.';
  }

  return 'No pudimos conectar con la base de datos. Revisa tu senal e intenta otra vez.';
}

function normalizeConfig(rows = []) {
  return rows.reduce((acc, row) => {
    acc[row.clave] = row.valor;
    return acc;
  }, {});
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
  const [status, setStatus] = useState('loading');
  const [config, setConfig] = useState({});
  const [hamburguesas, setHamburguesas] = useState([]);
  const [participante, setParticipante] = useState(null);
  const [votesByCategory, setVotesByCategory] = useState({});
  const [selectedByCategory, setSelectedByCategory] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editingFromRevision, setEditingFromRevision] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const activeCategory = categoryFromStatus(status);

  useEffect(() => {
    async function boot() {
      setStatus('loading');

      const { data, error: configError } = await supabase
        .from('config')
        .select('clave, valor');

      if (configError) {
        setConfig({
          titulo_evento: 'Burger Fest Maracaibo 2026',
          ciudad_activa: 'Maracaibo',
          mensaje_cierre:
            'No pudimos verificar si la votacion esta abierta. Intenta de nuevo en unos minutos.',
        });
        setStatus('cerrado');
        return;
      }

      const loadedConfig = normalizeConfig(data);
      setConfig(loadedConfig);

      if (loadedConfig.estado !== 'abierto') {
        setStatus('cerrado');
        return;
      }

      const { data: burgers, error: burgerError } = await supabase
        .from('hamburguesas')
        .select('id, nombre, restaurante, categoria, foto_url, descripcion, orden, activa')
        .eq('activa', true)
        .order('orden', { ascending: true });

      if (burgerError) {
        setError(friendlySupabaseError(burgerError));
      } else {
        setHamburguesas(burgers || []);
      }

      setStatus('registro');
    }

    boot();
  }, []);

  const burgersByCategory = useMemo(() => {
    return CATEGORIES.reduce((acc, category) => {
      acc[category] = hamburguesas.filter((burger) => burger.categoria === category);
      return acc;
    }, {});
  }, [hamburguesas]);

  async function loadParticipantVotes(participanteId) {
    const { data, error: votesError } = await supabase.rpc('mis_categorias_votadas', {
      p_participante_id: participanteId,
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

  async function handleRegister(form) {
    setBusy(true);
    setError('');

    const ciudad = config.ciudad_activa || 'Maracaibo';

    const { data: participanteId, error: rpcError } = await supabase.rpc('registrar_participante', {
      p_nombre: form.nombre,
      p_apellido: form.apellido,
      p_correo: form.correo,
      p_edad: form.edad || null,
      p_hamburguesas_probadas: form.hamburguesas_probadas || null,
      p_acepta_marketing: form.acepta_marketing || false,
      p_device_id: getDeviceId(),
      p_ciudad: ciudad,
    });

    if (rpcError || !participanteId) {
      setBusy(false);
      setError(friendlySupabaseError(rpcError));
      return;
    }

    setParticipante({ id: participanteId, ciudad });
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

      const { data: resultado, error: voteError } = await supabase.rpc('registrar_voto', {
        p_participante_id: participante.id,
        p_hamburguesa_id: burger.id,
        p_categoria: category,
        p_ciudad: participante.ciudad || config.ciudad_activa || 'Maracaibo',
      });

      if (voteError) {
        setVotesByCategory(nextVotes);
        setBusy(false);
        setError(`No pudimos registrar tu voto en la categoria ${category === CATEGORY_8 ? '$8' : '$10'}. ${friendlySupabaseError(voteError)}`);
        return;
      }

      if (resultado === 'cerrado') {
        setVotesByCategory(nextVotes);
        setBusy(false);
        setStatus('cerrado');
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
    return <PantallaCerrada config={config} />;
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
