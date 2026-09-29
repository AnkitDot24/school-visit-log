import { Redirect } from 'expo-router';
import { Loading } from '@/components/ui';
import { useUser } from '@/state/UserContext';

export default function Index() {
  const { user, loading } = useUser();
  if (loading) return <Loading />;
  return <Redirect href={user ? '/schools' : '/choose-user'} />;
}
