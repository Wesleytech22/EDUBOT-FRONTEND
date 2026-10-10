// Texto da próxima sincronização automática da planilha, a partir de
// GET /students/sync-status. A rotina do servidor conta o intervalo desde a
// última tentativa (manual ou automática), então o horário muda a cada
// sincronização.
export const SYNC_POLL_MS = 30 * 1000;

export function describeNextSync(status) {
  if (!status?.configured) return null;
  if (status.syncIntervalMinutes === 0) return 'Sincronização automática desligada — somente manual.';
  if (!status.nextSyncAt) return 'Sincronização automática desligada no servidor.';

  const next = new Date(status.nextSyncAt);
  if (next.getTime() - Date.now() <= 60 * 1000) return 'Próxima sincronização automática: em instantes.';

  const time = next.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const sameDay = next.toDateString() === new Date().toDateString();
  return sameDay
    ? `Próxima sincronização automática: hoje às ${time}.`
    : `Próxima sincronização automática: ${next.toLocaleDateString('pt-BR')} às ${time}.`;
}
