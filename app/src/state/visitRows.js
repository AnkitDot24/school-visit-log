const fromServer = (v) => ({
  clientId: v.clientId,
  udiseCode: v.udiseCode,
  schoolName: v.schoolName ?? v.udiseCode,
  visitedAt: v.visitedAt,
  status: 'synced',
  error: null,
  answers: v.answers,
  source: 'server',
});

export const fromQueue = (v) => ({
  clientId: v.clientId,
  udiseCode: v.udiseCode,
  schoolName: v.schoolName,
  visitedAt: v.visitedAt,
  status: v.status,
  error: v.status === 'synced' ? null : v.lastError,
  answers: v.answers,
  source: 'device',
});

export function mergeVisits(server, local) {
  const onServer = new Set(server.map((v) => v.clientId));
  return [...local.filter((v) => !onServer.has(v.clientId)).map(fromQueue), ...server.map(fromServer)].sort((a, b) =>
    b.visitedAt.localeCompare(a.visitedAt),
  );
}

                                                                                                           
const shownRows = new Map();

export function rememberRows(rows) {
  rows.forEach((row) => shownRows.set(row.clientId, row));
}

export function findShownRow(clientId) {
  return shownRows.get(clientId);
}
