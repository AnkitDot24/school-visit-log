import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './ui';

export function FilterPicker({ label, allLabel, options, value, onChange, disabled, icon = 'filter-outline' }) {
  const [open, setOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const selected = options.find((o) => o.value === value);
  const isSelected = Boolean(value);

  const choose = (next) => {
    setOpen(false);
    setModalSearch('');
    onChange(next);
  };

  const filteredOptions = useMemo(() => {
    const list = [{ value: '', label: allLabel }, ...options];
    if (!modalSearch.trim()) return list;
    const q = modalSearch.trim().toLowerCase();
    return list.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, allLabel, modalSearch]);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? allLabel}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          isSelected && styles.triggerActive,
          disabled && styles.triggerDisabled,
          pressed && styles.triggerPressed,
        ]}
      >
        <View style={styles.triggerLeft}>
          <View style={[styles.triggerIconWrap, isSelected && styles.triggerIconWrapActive]}>
            <Ionicons
              name={icon}
              size={14}
              color={isSelected ? colors.primary : colors.muted}
            />
          </View>
          <View style={styles.triggerTextContainer}>
            <Text style={styles.triggerLabel}>{label}</Text>
            <Text style={[styles.triggerValue, isSelected && styles.triggerValueActive]} numberOfLines={1}>
              {selected?.label ?? allLabel}
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-down"
          size={16}
          color={isSelected ? colors.primary : colors.muted}
        />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <Text style={styles.modalSubtitle}>
                {options.length} {options.length === 1 ? 'option' : 'options'} available
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setOpen(false);
                setModalSearch('');
              }}
              style={styles.closeBtn}
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {options.length > 6 ? (
            <View style={styles.modalSearchWrap}>
              <Ionicons name="search" size={18} color={colors.muted} style={styles.modalSearchIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={`Search ${label.toLowerCase()}...`}
                value={modalSearch}
                onChangeText={setModalSearch}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {modalSearch.length > 0 ? (
                <Pressable onPress={() => setModalSearch('')} hitSlop={6}>
                  <Ionicons name="close-circle" size={16} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.value || '__all__'}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const active = (item.value || undefined) === value;
              return (
                <Pressable
                  style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && styles.optionPressed]}
                  onPress={() => choose(item.value || undefined)}
                >
                  <View style={styles.optionContent}>
                    <View style={[styles.radioCircle, active && styles.radioCircleActive]}>
                      {active ? <View style={styles.radioDot} /> : null}
                    </View>
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{item.label}</Text>
                  </View>
                  {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No matching {label.toLowerCase()}s</Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 52,
    boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.03)',
  },
  triggerActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  triggerDisabled: {
    opacity: 0.5,
    backgroundColor: '#f1f5f9',
  },
  triggerPressed: {
    opacity: 0.8,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  triggerIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  triggerIconWrapActive: {
    backgroundColor: '#dbeafe',
  },
  triggerTextContainer: {
    flex: 1,
  },
  triggerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  triggerValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    marginTop: 1,
  },
  triggerValueActive: {
    color: colors.primary,
  },
  modal: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSearchIcon: {
    marginRight: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  listContent: {
    paddingVertical: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  optionActive: {
    backgroundColor: colors.primaryLight,
  },
  optionPressed: {
    backgroundColor: '#f1f5f9',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 50,
  },
  emptyWrap: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
  },
});
