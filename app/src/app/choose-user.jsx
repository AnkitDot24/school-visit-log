import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/components/ui';
import { DEMO_USERS, useUser } from '@/state/UserContext';

const USER_ACCENTS = {
  U1001: { color: '#2563eb', bg: '#eff6ff', roleBg: '#dbeafe', roleColor: '#1d4ed8' },
  U1002: { color: '#0d9488', bg: '#f0fdfa', roleBg: '#ccfbf1', roleColor: '#0f766e' },
  U1003: { color: '#7c3aed', bg: '#f5f3ff', roleBg: '#ede9fe', roleColor: '#6d28d9' },
};

export default function ChooseUserScreen() {
  const router = useRouter();
  const { user: current, chooseUser } = useUser();

  const onChoose = async (user) => {
    await chooseUser(user);
    router.replace('/schools');
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandHeader}>
        <View style={styles.logoBadge}>
          <Ionicons name="school" size={32} color={colors.primary} />
        </View>
        <Text style={styles.brandTitle}>Field Officer Login</Text>
        <Text style={styles.brandSubtitle}>
          Select your profile to record school visits and offline logs.
        </Text>
      </View>

      <View style={styles.list}>
        {DEMO_USERS.map((user) => {
          const selected = current?.userId === user.userId;
          const theme = USER_ACCENTS[user.userId] || {
            color: colors.primary,
            bg: colors.primaryLight,
            roleBg: '#e2e8f0',
            roleColor: colors.textSecondary,
          };

          const initials = user.userName
            .split(' ')
            .map((p) => p[0])
            .join('')
            .toUpperCase();

          return (
            <Pressable
              key={user.userId}
              accessibilityRole="button"
              onPress={() => onChoose(user)}
              style={({ pressed }) => [
                styles.card,
                selected && styles.selectedCard,
                pressed && styles.pressedCard,
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: theme.color }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{user.userName}</Text>
                  <View style={styles.idBadge}>
                    <Text style={styles.idText}>{user.userId}</Text>
                  </View>
                </View>

                <View style={styles.roleContainer}>
                  <View style={[styles.roleBadge, { backgroundColor: theme.roleBg }]}>
                    <Ionicons name="shield-checkmark-outline" size={12} color={theme.roleColor} style={{ marginRight: 4 }} />
                    <Text style={[styles.roleText, { color: theme.roleColor }]}>{user.role}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionIconWrap}>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footerNote}>
        <Ionicons name="information-circle-outline" size={16} color={colors.muted} style={{ marginRight: 6 }} />
        <Text style={styles.footerNoteText}>
          Your choice is saved on this device. You can switch users anytime.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: colors.background,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0px 2px 6px rgba(15, 23, 42, 0.04)',
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: '#f8fafc',
    boxShadow: '0px 2px 8px rgba(37, 99, 235, 0.1)',
  },
  pressedCard: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  idBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  idText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    fontFamily: 'monospace',
  },
  roleContainer: {
    marginTop: 4,
    flexDirection: 'row',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionIconWrap: {
    marginLeft: 6,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  footerNoteText: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    flex: 1,
  },
});
