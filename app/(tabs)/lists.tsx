import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useContactLists } from '../../src/hooks/useLists';
import { ContactList } from '../../src/api/lists';
import { Skeleton } from '../../src/components/ui/Skeleton';

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 4) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

function listInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Deterministic color from list name
const AVATAR_COLORS = ['#6f45ff', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
function listColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function ListItem({ list }: { list: ContactList }) {
  const initials = listInitials(list.name);
  const color = listColor(list.name);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/list/${list.id}?type=${list.type}&name=${encodeURIComponent(list.name)}`)}
      style={{
        direction: 'ltr',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
      activeOpacity={0.8}
    >
      <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color }}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#262626' }} numberOfLines={1}>
          {list.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 }}>
          {list.type === 'companies' && (
            <Ionicons name="business-outline" size={12} color="#737373" />
          )}
          <Text style={{ fontSize: 13, color: '#737373' }} numberOfLines={1}>
            {list.contactCount.toLocaleString()} {list.type === 'companies' ? 'compan' + (list.contactCount !== 1 ? 'ies' : 'y') : 'contact' + (list.contactCount !== 1 ? 's' : '')}
            {'  ·  '}
            <Text style={{ color: '#a3a3a3' }}>{timeAgo(list.updatedAt)}</Text>
          </Text>
        </View>
      </View>
      <Text style={{ color: '#d1d5db', fontSize: 20, marginLeft: 8, fontWeight: '300' }}>›</Text>
    </TouchableOpacity>
  );
}

function ListSkeleton() {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 flex-row items-center mx-4">
      <Skeleton width={48} height={48} />
      <View className="ml-4 flex-1">
        <Skeleton width="55%" height={16} />
        <View className="mt-2"><Skeleton width="30%" height={12} /></View>
      </View>
    </View>
  );
}

export default function ListsScreen() {
  const { data: lists, isLoading, refetch, isRefetching, error } = useContactLists();
  const [search, setSearch] = useState('');

  const filteredLists = useMemo(() => {
    if (!lists) return [];
    if (!search.trim()) return lists;
    const q = search.toLowerCase();
    return lists.filter((l) => l.name.toLowerCase().includes(q));
  }, [lists, search]);

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: '#f2f2f2', direction: 'ltr' }}>
      {isLoading ? (
        <View style={{ paddingTop: 12 }}>
          {[...Array(6)].map((_, i) => <ListSkeleton key={i} />)}
        </View>
      ) : error ? (
        <ErrorState onRetry={refetch} error={error} />
      ) : !lists?.length ? (
        <EmptyState onRetry={refetch} isRefetching={isRefetching} />
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 12, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <Text style={{ fontSize: 15, marginRight: 8 }}>🔍</Text>
            <TextInput
              style={{ flex: 1, fontSize: 15, color: '#262626' }}
              placeholder="Search lists…"
              placeholderTextColor="#a3a3a3"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', lineHeight: 13 }}>✕</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={filteredLists}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ListItem list={item} />}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#6f45ff"
              />
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 48 }}>
                <Text style={{ fontSize: 15, color: '#a3a3a3' }}>No lists match "{search}"</Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

function EmptyState({ onRetry, isRefetching }: { onRetry: () => void; isRefetching: boolean }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-5xl mb-4">📂</Text>
      <Text className="text-neutral-800 font-sans-semibold text-xl text-center mb-2">
        No lists found
      </Text>
      <Text className="text-neutral-500 text-base text-center mb-4">
        If you have lists on the dashboard, please sign out and sign in again to refresh your session.
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        disabled={isRefetching}
        className="bg-primary px-6 py-3 rounded-xl"
        activeOpacity={0.85}
        style={{ opacity: isRefetching ? 0.6 : 1 }}
      >
        <Text className="text-white font-sans-semibold">{isRefetching ? 'Refreshing…' : 'Refresh'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ErrorState({ onRetry, error }: { onRetry: () => void; error: unknown }) {
  const msg = (error as any)?.message ?? (error as any)?.response?.data?.message ?? 'Unknown error';
  const isSessionExpired = msg.includes('Session expired') || (error as any)?.response?.status === 401;

  const handleSignInAgain = async () => {
    await SecureStore.deleteItemAsync('lusha_session').catch(() => {});
    router.replace('/(auth)/login');
  };

  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-5xl mb-4">⚠️</Text>
      <Text className="text-neutral-800 font-sans-semibold text-xl text-center mb-2">
        {isSessionExpired ? 'Session Expired' : 'Couldn\'t load lists'}
      </Text>
      <Text className="text-neutral-500 text-sm text-center mb-6">
        {isSessionExpired
          ? 'Your session has expired. Please sign in again to see your lists.'
          : msg}
      </Text>
      {isSessionExpired ? (
        <TouchableOpacity
          onPress={handleSignInAgain}
          className="bg-primary px-6 py-3 rounded-xl"
          activeOpacity={0.85}
        >
          <Text className="text-white font-sans-semibold">Sign In Again</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onRetry}
          className="bg-primary px-6 py-3 rounded-xl"
          activeOpacity={0.85}
        >
          <Text className="text-white font-sans-semibold">Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
