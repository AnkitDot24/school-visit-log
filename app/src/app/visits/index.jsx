import { Ionicons } from '@expo/vector-icons';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Banner, Button, CenteredMessage, colors, StatusBadge } from '@/components/ui';
import { API_URL } from '@/config';
import { useServerVisits } from '@/hooks/useServerVisits';
import { useSync } from '@/state/SyncContext';
import { useUser } from '@/state/UserContext';
import { mergeVisits, rememberRows } from '@/state/visitRows';
import { formatIst } from '@/utils/ist';

const Row = memo(function Row({ row, onPress }) {
  const isFailed = row.status === 'failed';
  const isPending = row.status === 'pending';

  return (
    <Pressable
      style={({ pressed }) => [styles.rowCard, pressed && styles.rowCardPressed]}
      onPress={() => onPress(row.clientId)}
    >
      <View style={styles.rowHeader}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {row.schoolName}
        </Text>
        <StatusBadge status={row.status} size="small" />
      </View>

      <View style={styles.rowMetaLine}>
        <View style={styles.udiseChip}>
          <Text style={styles.udiseText}>{row.udiseCode}</Text>
        </View>
        <View style={styles.dateWrap}>
          <Ionicons name="time-outline" size={13} color={colors.muted} style={{ marginRight: 4 }} />
          <Text style={styles.rowDate}>{formatIst(row.visitedAt)}</Text>
        </View>
      </View>

      <View style={styles.rowFooter}>
        <Text style={styles.rowId} numberOfLines={1}>
          ID: {row.clientId.slice(0, 18)}…
        </Text>
        <View style={styles.detailsPrompt}>
          <Text style={styles.detailsPromptText}>Details</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      </View>

      {isFailed && row.error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={14} color={colors.danger} style={{ marginRight: 6 }} />
          <Text style={styles.errorText} numberOfLines={2}>
            {row.error}
          </Text>
        </View>
      ) : null}

      {isPending && row.error ? (
        <View style={styles.pendingBox}>
          <Ionicons name="hourglass-outline" size={13} color={colors.warning} style={{ marginRight: 6 }} />
          <Text style={styles.pendingText} numberOfLines={2}>
            Will retry: {row.error}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
});

const CONNECTION = {
  online: { label: 'Online', color: colors.success },
  'server-down': { label: 'No server', color: colors.danger },
  offline: { label: 'Offline', color: colors.warning },
  checking: { label: 'Checking…', color: colors.muted },
};

export default function MyVisitsScreen() {
  const { user } = useUser();
  if (!user) return <Redirect href="/choose-user" />;
  return <MyVisits user={user} />;
}

function MyVisits({ user }) {
  const router = useRouter();
  const { queue, connection, isSyncing, syncNow, reportServerUp } = useSync();
  const local = useMemo(() => queue.filter((v) => v.userId === user.userId), [queue, user.userId]);
  const server = useServerVisits(user.userId, queue);
  const { refresh } = server;

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const newlySynced = useMemo(() => {
    const onServer = new Set(server.items.map((v) => v.clientId));
    return local
      .filter((v) => v.status === 'synced' && !onServer.has(v.clientId))
      .map((v) => v.clientId)
      .join(',');
  }, [local, server.items]);

  useEffect(() => {
    if (newlySynced && !server.offline) refresh();
  }, [newlySynced, server.offline, refresh]);

  useEffect(() => {
    if (server.offline) reportServerUp(false);
  }, [server.offline, reportServerUp]);

  const rows = useMemo(() => mergeVisits(server.items, local), [server.items, local]);
  useEffect(() => rememberRows(rows), [rows]);

  const counts = useMemo(
    () => ({
      synced: rows.filter((v) => v.status === 'synced').length,
      pending: local.filter((v) => v.status === 'pending').length,
      failed: local.filter((v) => v.status === 'failed').length,
    }),
    [rows, local],
  );

  const openRow = useCallback((clientId) => router.push({ pathname: '/visits/[clientId]', params: { clientId } }), [router]);
  const renderItem = useCallback(({ item }) => <Row row={item} onPress={openRow} />, [openRow]);

  const status = CONNECTION[connection];

  return (
    <View style={styles.container}>
      <View style={styles.statsCard}>
        <View style={styles.statusRow}>
          <View style={styles.connectionBadge}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.connectionText, { color: status.color }]}>{status.label}</Text>
            {isSyncing ? <Text style={styles.syncingText}>· Syncing…</Text> : null}
          </View>

          <Button
            title="Sync Now"
            icon="sync-outline"
            variant="secondary"
            onPress={syncNow}
            disabled={connection === 'offline' || counts.pending === 0}
            loading={isSyncing}
            style={styles.syncBtn}
            textStyle={{ fontSize: 13 }}
          />
        </View>

        <View style={styles.countersRow}>
          <View style={[styles.counterTile, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
            <Text style={[styles.counterNumber, { color: colors.successText }]}>{counts.synced}</Text>
            <Text style={[styles.counterLabel, { color: colors.successText }]}>Synced</Text>
          </View>
          <View style={[styles.counterTile, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
            <Text style={[styles.counterNumber, { color: colors.warningText }]}>{counts.pending}</Text>
            <Text style={[styles.counterLabel, { color: colors.warningText }]}>Pending</Text>
          </View>
          <View style={[styles.counterTile, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]}>
            <Text style={[styles.counterNumber, { color: colors.dangerText }]}>{counts.failed}</Text>
            <Text style={[styles.counterLabel, { color: colors.dangerText }]}>Failed</Text>
          </View>
        </View>
      </View>

      {connection === 'server-down' ? (
        <Banner icon="server-outline" type="danger">
          Cannot reach the server at {API_URL}. {server.offline ? 'Showing cached visits. ' : ''}
          Pending visits stay queued and sync once it answers.
        </Banner>
      ) : connection === 'offline' ? (
        <Banner icon="cloud-offline" type="warning">
          Offline: showing cached visits. Pending visits sync when the network returns.
        </Banner>
      ) : server.error ? (
        <Banner icon="alert-circle" type="warning">
          Could not load visits from the server: {server.error}
        </Banner>
      ) : null}

      <FlatList
        data={rows}
        keyExtractor={(row) => row.clientId}
        renderItem={renderItem}
        onEndReached={server.loadMore}
        onEndReachedThreshold={0.5}
        refreshing={server.loading && rows.length > 0}
        onRefresh={refresh}
        contentContainerStyle={rows.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          server.loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
          ) : (
            <CenteredMessage
              title="No Visits Logged Yet"
              icon="clipboard-outline"
              detail="Visits you complete in the school form will appear here with live sync status."
              actionLabel="Find a School"
              onAction={() => router.push('/schools')}
            />
          )
        }
        ListFooterComponent={server.loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={colors.primary} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  syncingText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  syncBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  countersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  counterTile: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  counterNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  counterLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  listContent: {
    padding: 14,
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
  },
  rowCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 1px 4px rgba(15, 23, 42, 0.04)',
  },
  rowCardPressed: {
    backgroundColor: '#f8fafc',
    transform: [{ scale: 0.995 }],
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  rowMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  udiseChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  udiseText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowDate: {
    fontSize: 12,
    color: colors.muted,
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  rowId: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'monospace',
    flex: 1,
  },
  detailsPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsPromptText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: colors.dangerText,
    fontWeight: '500',
    flex: 1,
  },
  pendingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  pendingText: {
    fontSize: 12,
    color: colors.warningText,
    fontWeight: '500',
    flex: 1,
  },
});
