import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from './ui';

function YesNoChoice({ label, value, selected, onPress }) {
  const isYes = value === true;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.yesNoBtn,
        selected && (isYes ? styles.yesBtnSelected : styles.noBtnSelected),
        pressed && styles.choicePressed,
      ]}
    >
      <Ionicons
        name={isYes ? 'checkmark-circle' : 'close-circle'}
        size={18}
        color={selected ? '#ffffff' : isYes ? colors.success : colors.danger}
        style={{ marginRight: 6 }}
      />
      <Text style={[styles.yesNoText, selected && styles.yesNoTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function OptionCard({ label, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        selected && styles.optionCardSelected,
        pressed && styles.choicePressed,
      ]}
    >
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? colors.primary : '#94a3b8'}
        style={{ marginRight: 10 }}
      />
      <Text style={[styles.optionCardText, selected && styles.optionCardTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function Input({ question, value, onChange }) {
  const set = (next) => onChange(question.questionId, next);

  switch (question.type) {
    case 'yesNo':
      return (
        <View style={styles.yesNoRow}>
          <YesNoChoice label="Yes" value={true} selected={value === true} onPress={() => set(true)} />
          <YesNoChoice label="No" value={false} selected={value === false} onPress={() => set(false)} />
        </View>
      );

    case 'number':
      return (
        <View style={styles.numberContainer}>
          <TextInput
            style={styles.numberInput}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#94a3b8"
            value={typeof value === 'string' ? value : ''}
            onChangeText={(text) => set(text.replace(/[^\d]/g, ''))}
            maxLength={String(question.max).length}
          />
          <View style={styles.rangeBadge}>
            <Text style={styles.rangeBadgeText}>
              Min: {question.min} · Max: {question.max}
            </Text>
          </View>
        </View>
      );

    case 'singleChoice':
      return (
        <View style={styles.optionsWrap}>
          {question.options.map((option) => (
            <OptionCard
              key={option}
              label={option}
              selected={value === option}
              onPress={() => set(option)}
            />
          ))}
        </View>
      );

    case 'text': {
      const text = typeof value === 'string' ? value : '';
      return (
        <View style={styles.textInputWrap}>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            maxLength={question.maxLength}
            value={text}
            onChangeText={set}
            placeholder={question.optional ? 'Add any notes or observations (optional)...' : 'Enter your remarks here...'}
            placeholderTextColor="#94a3b8"
          />
          <View style={styles.counterWrap}>
            <Text style={styles.counterText}>
              {text.length}/{question.maxLength}
            </Text>
          </View>
        </View>
      );
    }

    default:
      return <Text style={styles.error}>Unsupported question type: {question.type}</Text>;
  }
}

export const QuestionField = memo(function QuestionField({ index, question, value, error, onChange }) {
  const hasError = Boolean(error);
  return (
    <View style={[styles.card, hasError && styles.cardError]}>
      <View style={styles.headerRow}>
        <View style={[styles.qBadge, hasError && styles.qBadgeError]}>
          <Text style={[styles.qBadgeText, hasError && styles.qBadgeTextError]}>Q{index + 1}</Text>
        </View>
        <View style={styles.questionTextWrap}>
          <Text style={styles.questionText}>{question.text}</Text>
          {question.optional ? (
            <View style={styles.optionalPill}>
              <Text style={styles.optionalText}>Optional</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.inputArea}>
        <Input question={question} value={value} onChange={onChange} />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={14} color={colors.danger} style={{ marginRight: 5 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    boxShadow: '0px 2px 4px rgba(15, 23, 42, 0.03)',
  },
  cardError: {
    borderColor: colors.danger,
    backgroundColor: '#fffdfd',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  qBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    marginRight: 10,
    marginTop: 1,
  },
  qBadgeError: {
    backgroundColor: colors.dangerBg,
  },
  qBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  qBadgeTextError: {
    color: colors.danger,
  },
  questionTextWrap: {
    flex: 1,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
  },
  optionalPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  optionalText: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  inputArea: {
    marginTop: 4,
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
  },
  yesBtnSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  noBtnSelected: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  yesNoText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  yesNoTextSelected: {
    color: '#ffffff',
  },
  numberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  numberInput: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    backgroundColor: '#f8fafc',
    marginRight: 12,
  },
  rangeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  rangeBadgeText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  optionsWrap: {
    gap: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  optionCardTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  textInputWrap: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
  },
  textInput: {
    minHeight: 80,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  counterWrap: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  counterText: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
  },
  choicePressed: {
    opacity: 0.8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: colors.dangerBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  errorText: {
    color: colors.dangerText,
    fontSize: 12,
    fontWeight: '600',
  },
});
