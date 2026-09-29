import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export const colors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#eff6ff',
  primaryBorder: '#bfdbfe',
  text: '#0f172a',
  textSecondary: '#334155',
  muted: '#64748b',
  border: '#e2e8f0',
  surface: '#ffffff',
  background: '#f8fafc',
  divider: '#f1f5f9',


  success: '#16a34a',
  successBg: '#f0fdf4',
  successBorder: '#bbf7d0',
  successText: '#15803d',

  warning: '#d97706',
  warningBg: '#fffbeb',
  warningBorder: '#fde68a',
  warningText: '#b45309',

  danger: '#dc2626',
  dangerBg: '#fef2f2',
  dangerBorder: '#fecaca',
  dangerText: '#b91c1c',
};

export function Button({ title, onPress, variant = 'primary', icon, disabled, loading, style, textStyle }) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        variant === 'ghost' && styles.buttonGhost,
        (pressed || isDisabled) && styles.buttonPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'secondary' || variant === 'ghost' ? colors.primary : '#fff'} />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={variant === 'secondary' || variant === 'ghost' ? colors.primary : '#fff'}
              style={styles.buttonIcon}
            />
          ) : null}
          <Text
            style={[
              styles.buttonText,
              (variant === 'secondary' || variant === 'ghost') && { color: colors.primary },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const STATUS_CONFIG = {
  synced: {
    label: 'Synced',
    icon: 'checkmark-circle',
    bg: colors.successBg,
    border: colors.successBorder,
    fg: colors.successText,
    iconColor: colors.success,
  },
  pending: {
    label: 'Pending',
    icon: 'time',
    bg: colors.warningBg,
    border: colors.warningBorder,
    fg: colors.warningText,
    iconColor: colors.warning,
  },
  failed: {
    label: 'Failed',
    icon: 'alert-circle',
    bg: colors.dangerBg,
    border: colors.dangerBorder,
    fg: colors.dangerText,
    iconColor: colors.danger,
  },
};

export function StatusBadge({ status, size = 'medium' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: cfg.bg, borderColor: cfg.border },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Ionicons name={cfg.icon} size={isSmall ? 12 : 14} color={cfg.iconColor} style={styles.badgeIcon} />
      <Text style={[styles.badgeText, { color: cfg.fg }, isSmall && styles.badgeTextSmall]}>{cfg.label}</Text>
    </View>
  );
}

const bannerTones = {
  warning: { bg: colors.warningBg, border: colors.warningBorder, icon: colors.warning, text: colors.warningText },
  danger: { bg: colors.dangerBg, border: colors.dangerBorder, icon: colors.danger, text: colors.dangerText },
  info: { bg: colors.primaryLight, border: colors.primaryBorder, icon: colors.primary, text: colors.primary },
};

export function Banner({ children, icon = 'cloud-offline-outline', type = 'warning' }) {
  const tone = bannerTones[type] ?? bannerTones.info;
  return (
    <View style={[styles.banner, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Ionicons name={icon} size={18} color={tone.icon} style={styles.bannerIcon} />
      <Text style={[styles.bannerText, { color: tone.text }]}>{children}</Text>
    </View>
  );
}

export function UserAvatar({ name = '', size = 38, color = colors.primary }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CenteredMessage({ title, detail, icon = 'alert-circle-outline', actionLabel, onAction }) {
  return (
    <View style={styles.centered}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={36} color={colors.muted} />
      </View>
      <Text style={styles.centeredTitle}>{title}</Text>
      {detail ? <Text style={styles.centeredDetail}>{detail}</Text> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: 18, minWidth: 140 }} />
      ) : null}
    </View>
  );
}

export function Loading({ label }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={[styles.centeredDetail, { marginTop: 12 }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    boxShadow: '0px 2px 4px rgba(37, 99, 235, 0.2)',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
    boxShadow: '0px 2px 4px rgba(220, 38, 38, 0.2)',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badgeTextSmall: {
    fontSize: 11,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  bannerIcon: {
    marginRight: 8,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 6px rgba(15, 23, 42, 0.04)',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  centeredTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  centeredDetail: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
