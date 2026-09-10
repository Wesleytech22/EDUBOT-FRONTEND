import { useCallback, useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import '../styles/sobre-nos.css';

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function SobreNos() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputs = useRef({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/team');
      setItems(data.items);
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível carregar a equipe.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePhotoChange(memberId, file) {
    if (!file) return;
    setUploadingId(memberId);
    setError('');
    try {
      const formData = new FormData();
      formData.append('photo', file);
      await api.put(`/team/${memberId}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível atualizar a foto.');
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <Layout title="Sobre Nós">
      <div className="card sobre-intro">
        <h3>Conheça a equipe de desenvolvimento do software</h3>
        <p className="sobre-hint">
          Equipe da disciplina de Análise e Desenvolvimento de Sistemas por trás da plataforma.
        </p>
      </div>

      {error && <p className="field error">{error}</p>}
      {loading && <p className="sobre-hint">Carregando…</p>}

      {!loading && (
        <div className="sobre-grid">
          {items.map((member) => (
            <div key={member.id} className="card sobre-card">
              <div className="sobre-photo-wrap">
                {member.photoDataUrl ? (
                  <img className="sobre-photo" src={member.photoDataUrl} alt={member.name} />
                ) : (
                  <div className="sobre-photo sobre-photo-placeholder">{initials(member.name)}</div>
                )}

                {isAdmin && (
                  <>
                    <input
                      ref={(el) => (fileInputs.current[member.id] = el)}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handlePhotoChange(member.id, e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      className="sobre-photo-btn"
                      disabled={uploadingId === member.id}
                      onClick={() => fileInputs.current[member.id]?.click()}
                    >
                      {uploadingId === member.id ? 'Enviando…' : 'Trocar foto'}
                    </button>
                  </>
                )}
              </div>

              <h4 className="sobre-name">{member.name}</h4>
              <span className="badge sobre-role">{member.role}</span>
              <p className="sobre-bio">{member.bio}</p>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
