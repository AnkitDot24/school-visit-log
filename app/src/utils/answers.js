function isBlank(value) {
  return value === undefined || (typeof value === 'string' && value.trim() === '');
}

function checkQuestion(question, value) {
  switch (question.type) {
    case 'yesNo':
      return typeof value === 'boolean' ? { value } : { error: 'Choose Yes or No.' };
    case 'number': {
      const text = String(value).trim();
      if (!/^-?\d+$/.test(text)) return { error: 'Enter a whole number.' };
      const n = Number(text);
      if (n < question.min || n > question.max) return { error: `Enter a number from ${question.min} to ${question.max}.` };
      return { value: n };
    }
    case 'singleChoice':
      return typeof value === 'string' && question.options.includes(value) ? { value } : { error: 'Choose one option.' };
    case 'text': {
      const text = String(value).trim();
      if (text.length > question.maxLength) return { error: `Use at most ${question.maxLength} characters.` };
      return { value: text };
    }
    default:
      return { error: `Unsupported question type ${question.type}.` };
  }
}

                                                                                                   
export function validateDraft(questionnaire, draft) {
  const answers = [];
  const errors = {};

  for (const question of questionnaire.questions) {
    const value = draft[question.questionId];
    if (isBlank(value)) {
      if (!question.optional) errors[question.questionId] = 'This question is required.';
      continue;
    }
    const result = checkQuestion(question, value);
    if ('error' in result) errors[question.questionId] = result.error;
    else answers.push({ questionId: question.questionId, value: result.value });
  }

  return { answers, errors };
}
