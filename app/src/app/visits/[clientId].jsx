import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, CenteredMessage, colors, StatusBadge } from '@/components/ui';
import { getSavedQuestionnaire } from '@/offline/questionnaireStore';
import { useSync } from '@/state/SyncContext';
import { findShownRow, fromQueue } from '@/state/visitRows';
import { formatIst } from '@/utils/ist';

function FormattedValue({ value }) {
  if (typeof value === 'boolean') {
    return (
      <View
        style={[
          styles.booleanBadge,
          { backgroundColor: value ? colors.successBg : colors.dangerBg },
        ]}
      >
        <Ionicons
          name={value ? 'checkmark-circle' : 'close-circle'}
          size={14}
          color={value ? colors.success : colors.danger}
          style={{ marginRight: 4 }}
        />
        <Text
          style={[
            styles.booleanText,
            { color: value ? colors.successText : colors.dangerText },
          ]}
        >
          {value ? 'Yes' : 'No'}
        </Text>
      </View>
    );
  }

  return <Text style={styles.valueText}>{String(value)}</Text>;
}

export default function VisitDetailsScreen() {
  const { clientId } = useLocalSearchParams();
  const router = useRouter();
  const { queue, discardVisit, syncNow } = useSync();
  const [questionnaire, setQuestionnaire] = useState(null);

  useEffect(() => {
    getSavedQuestionnaire().then(setQuestionnaire);
  }, []);

  const queued = queue.find((v) => v.clientId === clientId);
  const shown = findShownRow(clientId);
  const row = shown?.source === 'server' ? shown : queued ? fromQueue(queued) : shown;

  if (!row) {
    return <CenteredMessage title="Visit not found" icon="search-outline" detail="This record may have been cleared." />;
  }

  const questionMap = new Map(questionnaire?.questions.map((q) => [q.questionId, q.text]) ?? []);

  const onDiscard = () =>
    Alert.alert(
      'Remove this visit?',
      'This visit failed server validation and will not be synced. Removing it will delete it from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await discardVisit(row.clientId);
            router.back();
          },
        },
      ],
    );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.schoolName}>{row.schoolName}</Text>
          <StatusBadge status={row.status} />
        </View>

        <View style={styles.subInfoRow}>
          <View style={styles.infoPill}>
            <Ionicons name="barcode-outline" size={13} color={colors.muted} style={{ marginRight: 4 }} />
            <Text style={styles.infoPillText}>UDISE: {row.udiseCode}</Text>
          </View>
          <View style={styles.infoPill}>
            <Ionicons name="time-outline" size={13} color={colors.muted} style={{ marginRight: 4 }} />
            <Text style={styles.infoPillText}>{formatIst(row.visitedAt)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Sync Details</Text>

        <View style={styles.propRow}>
          <Text style={styles.propLabel}>Client ID</Text>
          <Text style={styles.propCode} selectable>
            {row.clientId}
          </Text>
        </View>

        {queued ? (
          <View style={styles.propRow}>
            <Text style={styles.propLabel}>Send Attempts</Text>
            <Text style={styles.propValue}>{queued.attempts}</Text>
          </View>
        ) : null}

        {row.error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} style={{ marginRight: 6 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>
                {row.status === 'failed' ? 'Validation Error' : 'Pending Retry'}
              </Text>
              <Text style={styles.errorDetail}>{row.error}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.answersHeader}>
          <Text style={styles.cardSectionTitle}>Observation Answers</Text>
          <View style={styles.countTag}>
            <Text style={styles.countTagText}>{row.answers.length} items</Text>
          </View>
        </View>

        <View style={styles.answersList}>
          {row.answers.map((ans, idx) => {
            const text = questionMap.get(ans.questionId) || ans.questionId;
            return (
              <View key={ans.questionId} style={styles.answerItem}>
                <View style={styles.answerQuestionRow}>
                  <Text style={styles.answerIndex}>{idx + 1}.</Text>
                  <Text style={styles.answerQuestionText}>{text}</Text>
                </View>
                <View style={styles.answerValueRow}>
                  <FormattedValue value={ans.value} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {row.status === 'pending' ? (
        <Button
          title="Try Sending Now"
          icon="sync-outline"
          onPress={syncNow}
          style={styles.actionBtn}
        />
      ) : null}

      {row.status === 'failed' ? (
        <Button
          title="Remove Visit from Device"
          icon="trash-outline"
          variant="danger"
          onPress={onDiscard}
          style={styles.actionBtn}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 14,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 1px 4px rgba(15, 23, 42, 0.04)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  schoolName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
    lineHeight: 24,
  },
  subInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoPillText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  propRow: {
    marginBottom: 10,
  },
  propLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  propCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.text,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  propValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.dangerBg,
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dangerText,
    marginBottom: 2,
  },
  errorDetail: {
    fontSize: 12,
    color: colors.dangerText,
    lineHeight: 16,
  },
  answersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  answersList: {
    gap: 12,
  },
  answerItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  answerQuestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  answerIndex: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    marginRight: 6,
    marginTop: 1,
  },
  answerQuestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  answerValueRow: {
    marginLeft: 18,
  },
  booleanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  booleanText: {
    fontSize: 13,
    fontWeight: '700',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  actionBtn: {
    marginTop: 4,
  },
});
