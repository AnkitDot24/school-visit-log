import { Ionicons } from '@expo/vector-icons';
import { randomUUID } from 'expo-crypto';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { QuestionField } from '@/components/QuestionField';
import { Button, CenteredMessage, colors, Loading } from '@/components/ui';
import { useCurrentQuestionnaire } from '@/hooks/useCurrentQuestionnaire';
import { useSync } from '@/state/SyncContext';
import { useUser } from '@/state/UserContext';
import { validateDraft } from '@/utils/answers';
import { compareMonths, getIstYearMonth } from '@/utils/ist';

export default function VisitFormScreen() {
  const { udiseCode, schoolName } = useLocalSearchParams();
  const { user } = useUser();
  const { state, reload } = useCurrentQuestionnaire();

  if (!user) return <Redirect href="/choose-user" />;
  if (!udiseCode) return <CenteredMessage title="No school selected" icon="school-outline" />;

  switch (state.status) {
    case 'loading':
      return <Loading label="Loading visit questionnaire…" />;
    case 'outdated':
      return (
        <CenteredMessage
          title="New questionnaire needed"
          icon="cloud-download-outline"
          detail={`The saved questions on this device are for "${state.saved.title}". Please connect to the internet once so the current month's questionnaire can be downloaded.`}
          actionLabel="Try again"
          onAction={reload}
        />
      );
    case 'unavailable':
      return (
        <CenteredMessage
          title="Questionnaire not available"
          icon="alert-circle-outline"
          detail={state.message}
          actionLabel="Try again"
          onAction={reload}
        />
      );
    default:
      return (
        <VisitForm
          key={state.questionnaire.id}
          questionnaire={state.questionnaire}
          userId={user.userId}
          udiseCode={udiseCode}
          schoolName={schoolName ?? udiseCode}
          onMonthChanged={reload}
        />
      );
  }
}

function VisitForm({ questionnaire, userId, udiseCode, schoolName, onMonthChanged }) {
  const router = useRouter();
  const { submitVisit } = useSync();
  const [draft, setDraft] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = useCallback((questionId, value) => {
    setDraft((d) => ({ ...d, [questionId]: value }));
    setErrors((e) => {
      if (!e[questionId]) return e;
      const { [questionId]: _removed, ...rest } = e;
      return rest;
    });
  }, []);

  const onSubmit = async () => {
    if (submitting) return;
    const visitedAt = new Date();

    const { answers, errors: found } = validateDraft(questionnaire, draft);
    const problemCount = Object.keys(found).length;
    if (problemCount > 0) {
      setErrors(found);
      Alert.alert(
        'Required Questions Missing',
        `Please check your responses. ${problemCount} question${problemCount === 1 ? '' : 's'} need${problemCount === 1 ? 's' : ''} attention.`,
      );
      return;
    }

    if (compareMonths(getIstYearMonth(visitedAt), questionnaire) !== 0) {
      Alert.alert(
        'Month Boundary Crossed',
        "These questions were for the previous month. The app will now refresh the current month's questionnaire.",
      );
      onMonthChanged();
      return;
    }

    setSubmitting(true);
    try {
      await submitVisit({
        clientId: randomUUID(),
        userId,
        udiseCode,
        visitedAt: visitedAt.toISOString(),
        answers,
        schoolName,
        questionnaireTitle: questionnaire.title,
        status: 'pending',
        attempts: 0,
        lastError: null,
        lastAttemptAt: null,
        syncedAt: null,
        createdAt: visitedAt.toISOString(),
      });
      router.replace('/visits');
    } catch {
      setSubmitting(false);
      Alert.alert('Could Not Save', 'Failed to save the visit to the device queue. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.schoolIconWrap}>
              <Ionicons name="school" size={24} color={colors.primary} />
            </View>
            <View style={styles.headerTitles}>
              <Text style={styles.schoolName}>{schoolName}</Text>
              <View style={styles.badgesRow}>
                <View style={styles.udiseBadge}>
                  <Text style={styles.udiseText}>UDISE: {udiseCode}</Text>
                </View>
                <View style={styles.monthBadge}>
                  <Ionicons name="calendar-outline" size={12} color="#1e40af" style={{ marginRight: 4 }} />
                  <Text style={styles.monthText}>{questionnaire.title}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.questionsMetaBar}>
            <Text style={styles.questionsMetaText}>
              {questionnaire.questions.length} questions in this observation form
            </Text>
          </View>
        </View>

        {questionnaire.questions.map((question, index) => (
          <QuestionField
            key={question.questionId}
            index={index}
            question={question}
            value={draft[question.questionId]}
            error={errors[question.questionId]}
            onChange={onChange}
          />
        ))}

  
        <View style={styles.submitSection}>
          <Button
            title="Submit School Visit"
            icon="checkmark-circle-outline"
            onPress={onSubmit}
            loading={submitting}
            style={styles.submitBtn}
          />
          <View style={styles.syncNotice}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.muted} style={{ marginRight: 5 }} />
            <Text style={styles.syncNoticeText}>
              Visits are queued safely on this device and synced automatically.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    boxShadow: '0px 2px 6px rgba(15, 23, 42, 0.04)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  schoolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  schoolName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 24,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  udiseBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  udiseText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textSecondary,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  monthText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e40af',
  },
  questionsMetaBar: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  questionsMetaText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  submitSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
  },
  syncNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  syncNoticeText: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 16,
    flex: 1,
  },
});
