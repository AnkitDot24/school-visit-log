import { fetchCurrentQuestionnaire } from '@/api/endpoints';
import { readJson, StorageKeys, writeJson } from '@/storage/storage';

export function getSavedQuestionnaire() {
  return readJson(StorageKeys.questionnaire);
}

                                                                                               
export async function downloadQuestionnaire() {
  const questionnaire = await fetchCurrentQuestionnaire();
  await writeJson(StorageKeys.questionnaire, questionnaire);
  return questionnaire;
}
