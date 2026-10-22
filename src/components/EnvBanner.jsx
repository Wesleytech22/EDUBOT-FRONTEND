import '../styles/envBanner.css';

// Faixa de ambiente (Sprint 05): DEV e QA mostram no topo de todas as telas
// em que ambiente a pessoa está, para ninguém validar no lugar errado nem
// confundir dados de teste com os de produção. Em produção (VITE_APP_ENV
// vazio ou "prod") nada aparece.
const ENVIRONMENTS = {
  dev: { label: 'Ambiente de DEV', detail: 'integração das funcionalidades — dados de teste' },
  qa: { label: 'Ambiente de QA', detail: 'validação antes da produção — dados de teste' },
};

export default function EnvBanner() {
  const env = String(import.meta.env.VITE_APP_ENV || '').toLowerCase();
  const info = ENVIRONMENTS[env];
  if (!info) return null;

  return (
    <div className={`env-banner env-banner-${env}`} role="status">
      <strong>{info.label}</strong>
      <span>{info.detail}</span>
    </div>
  );
}
