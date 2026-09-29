import { Ionicons } from '@expo/vector-icons';
import { Redirect, Stack, useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FilterPicker } from '@/components/FilterPicker';
import { Banner, Button, CenteredMessage, colors, Loading, UserAvatar } from '@/components/ui';
import { SEARCH_DEBOUNCE_MS } from '@/config';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSchoolSearch } from '@/hooks/useSchoolSearch';
import { loadBlocks, loadDistricts } from '@/offline/schoolStore';
import { useSync } from '@/state/SyncContext';
import { useUser } from '@/state/UserContext';

const SchoolRow = memo(function SchoolRow({ school, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => onPress(school)}
    >
      <View style={styles.schoolIconWrap}>
        <Ionicons name="school-outline" size={20} color={colors.primary} />
      </View>

      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {school.schoolName}
        </Text>

        <View style={styles.rowSub}>
          <View style={styles.udiseChip}>
            <Text style={styles.udiseText}>{school.udiseCode}</Text>
          </View>
          <View style={styles.locationWrap}>
            <Ionicons name="location-outline" size={12} color={colors.muted} style={{ marginRight: 3 }} />
            <Text style={styles.rowMeta} numberOfLines={1}>
              {school.clusterName ?? '-'} · {school.blockName ?? '-'}
            </Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" style={styles.rowChevron} />
    </Pressable>
  );
});

function useLocationOptions(districtCode) {
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    loadDistricts()
      .then(({ data }) => setDistricts(data.map((d) => ({ value: d.districtCode, label: d.districtName ?? d.districtCode }))))
      .catch(() => setDistricts([]));
  }, []);

  useEffect(() => {
    setBlocks([]);
    if (!districtCode) return;
    let active = true;
    loadBlocks(districtCode)
      .then(({ data }) => active && setBlocks(data.map((b) => ({ value: b.blockCode, label: b.blockName ?? b.blockCode }))))
      .catch(() => active && setBlocks([]));
    return () => {
      active = false;
    };
  }, [districtCode]);

  return { districts, blocks };
}

export default function SchoolsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { queue, connection, reportServerUp } = useSync();
  const [searchText, setSearchText] = useState('');
  const [districtCode, setDistrictCode] = useState();
  const [blockCode, setBlockCode] = useState();
  const search = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);
  const { districts, blocks } = useLocationOptions(districtCode);
  const list = useSchoolSearch({ districtCode, blockCode, search });

  const unsyncedCount = useMemo(
    () => queue.filter((v) => v.userId === user?.userId && v.status !== 'synced').length,
    [queue, user?.userId],
  );

  useEffect(() => {
    if (list.offline) reportServerUp(false);
  }, [list.offline, reportServerUp]);

  const hasActiveFilters = Boolean(districtCode || blockCode || searchText);

  const clearAllFilters = useCallback(() => {
    setSearchText('');
    setDistrictCode(undefined);
    setBlockCode(undefined);
  }, []);

  const openSchool = useCallback(
    (school) =>
      router.push({
        pathname: '/visit-form',
        params: { udiseCode: school.udiseCode, schoolName: school.schoolName },
      }),
    [router],
  );

  const renderItem = useCallback(({ item }) => <SchoolRow school={item} onPress={openSchool} />, [openSchool]);

  if (!user) return <Redirect href="/choose-user" />;

  const header = (
    <Stack.Screen
      options={{
        title: 'Select School',
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/visits')}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
            hitSlop={8}
          >
            <Ionicons name="document-text-outline" size={17} color={colors.primary} style={{ marginRight: 5 }} />
            <Text style={styles.headerBtnText}>My Visits</Text>
            {unsyncedCount > 0 ? (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unsyncedCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ),
      }}
    />
  );

  const renderBody = () => {
    if (list.loading) return <Loading label="Searching schools database…" />;
    if (list.error) {
      return (
        <CenteredMessage
          title="Could not load schools"
          detail={list.error}
          icon="cloud-offline-outline"
          actionLabel="Try again"
          onAction={list.reload}
        />
      );
    }
    if (list.items.length === 0) {
      return (
        <CenteredMessage
          title="No schools found"
          icon="search-outline"
          detail={
            list.offline
              ? 'You are currently offline. Only schools previously loaded on this device are available.'
              : 'Try adjusting your search terms, district or block filters.'
          }
          actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
          onAction={hasActiveFilters ? clearAllFilters : undefined}
        />
      );
    }

    return (
      <FlatList
        data={list.items}
        keyExtractor={(item) => item.udiseCode}
        renderItem={renderItem}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={11}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
        ListFooterComponent={
          list.loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.footerLoadingText}>Loading more schools…</Text>
            </View>
          ) : list.loadMoreError ? (
            <View style={styles.footerErrorWrap}>
              <Text style={styles.footerError}>{list.loadMoreError}</Text>
              <Button title="Retry" variant="secondary" onPress={list.retryMore} style={{ height: 38 }} />
            </View>
          ) : null
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      {header}
      <View style={styles.topCard}>
        <View style={styles.userBar}>
          <View style={styles.userBarLeft}>
            <UserAvatar name={user.userName} size={32} color={colors.primary} />
            <View style={styles.userBarInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.userName}
              </Text>
              <Text style={styles.userRole}>
                {user.role} · {user.userId}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/choose-user')}
            style={({ pressed }) => [styles.switchBtn, pressed && { opacity: 0.7 }]}
            hitSlop={8}
          >
            <Ionicons name="swap-horizontal" size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.switchBtnText}>Switch</Text>
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search school name or UDISE code..."
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          {searchText.length > 0 ? (
            <Pressable onPress={() => setSearchText('')} hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

    
        <View style={styles.filtersRow}>
          <FilterPicker
            label="District"
            allLabel="All Districts"
            icon="business-outline"
            options={districts}
            value={districtCode}
            onChange={(code) => {
              setDistrictCode(code);
              setBlockCode(undefined);
            }}
          />
          <FilterPicker
            label="Block"
            allLabel={districtCode ? 'All Blocks' : 'Select District first'}
            icon="map-outline"
            options={blocks}
            value={blockCode}
            onChange={setBlockCode}
            disabled={!districtCode}
          />
        </View>

      
        {!list.loading && !list.error && !list.offline ? (
          <View style={styles.metaRow}>
            <View style={styles.countBadge}>
              <Ionicons name="layers-outline" size={13} color={colors.muted} style={{ marginRight: 4 }} />
              <Text style={styles.countText}>
                {list.total.toLocaleString()} {list.total === 1 ? 'school found' : 'schools found'}
              </Text>
            </View>
            {hasActiveFilters ? (
              <Pressable onPress={clearAllFilters} hitSlop={6}>
                <Text style={styles.clearFiltersText}>Reset filters</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {list.offline ? (
        connection === 'server-down' ? (
          <Banner icon="server-outline" type="danger">
            Cannot reach the server. Searching the {list.items.length} schools saved on this device.
          </Banner>
        ) : (
          <Banner icon="cloud-offline" type="warning">
            Offline: searching the {list.items.length} schools saved on this device.
          </Banner>
        )
      ) : null}

      <View style={styles.listContainer}>{renderBody()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  headerBtnPressed: {
    opacity: 0.7,
  },
  headerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  headerBadge: {
    marginLeft: 6,
    backgroundColor: colors.warning,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  topCard: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  userBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  userBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  userBarInfo: {
    marginLeft: 10,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  userRole: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowPressed: {
    backgroundColor: '#f1f5f9',
  },
  schoolIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
    marginRight: 8,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },
  rowSub: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    flexWrap: 'wrap',
    gap: 6,
  },
  udiseChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  udiseText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textSecondary,
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  rowMeta: {
    fontSize: 12,
    color: colors.muted,
    flexShrink: 1,
  },
  rowChevron: {
    marginLeft: 4,
  },
  listSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
  footerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  footerLoadingText: {
    fontSize: 13,
    color: colors.muted,
  },
  footerErrorWrap: {
    padding: 16,
    alignItems: 'center',
  },
  footerError: {
    color: colors.danger,
    marginBottom: 8,
    fontSize: 13,
    textAlign: 'center',
  },
});
