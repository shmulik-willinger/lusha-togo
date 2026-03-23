import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { ContactCard } from '../src/components/ContactCard';
import { ContactCardSkeleton } from '../src/components/ui/Skeleton';
import { useRecommendations } from '../src/hooks/useRecommendations';
import { SearchContact } from '../src/api/search';

export default function RecommendationsScreen() {
  const [search, setSearch] = useState('');
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const { data, isLoading, refetch, isRefetching } = useRecommendations();

  // Show specific group if groupId provided, otherwise all leads
  const group = groupId ? data?.groups?.find((g) => g.id === groupId) : undefined;
  const leads = group?.leads ?? data?.leads ?? [];
  const screenTitle = group?.name ?? 'Recommended Leads';

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (c) =>
        c.name.full.toLowerCase().includes(q) ||
        c.job_title?.title?.toLowerCase().includes(q) ||
        c.company?.name?.toLowerCase().includes(q),
    );
  }, [leads, search]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f7', direction: 'ltr' }}>
      <Stack.Screen options={{ title: screenTitle }} />

      {/* Search within recommendations */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ direction: 'ltr', backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Text style={{ color: '#9ca3af', marginRight: 8, fontSize: 15 }}>🔍</Text>
          <TextInput
            style={{ flex: 1, color: '#1a1a1a', fontSize: 14 }}
            placeholder="Search recommended leads..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            textAlign="left"
          />
          {search.length > 0 && (
            <Text style={{ color: '#9ca3af', fontSize: 20, marginLeft: 8 }} onPress={() => setSearch('')}>×</Text>
          )}
        </View>
      </View>

      {data && (
        <Text style={{ color: '#9ca3af', fontSize: 12, paddingHorizontal: 16, marginBottom: 4 }}>
          {filtered.length} of {group?.total ?? data.total ?? leads.length} leads
        </Text>
      )}

      {isLoading ? (
        <View style={{ flex: 1 }}>
          {[...Array(5)].map((_, i) => <ContactCardSkeleton key={i} />)}
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>🤷</Text>
          <Text style={{ color: '#1a1a1a', fontWeight: '600', fontSize: 16 }}>
            {search ? 'No matches' : 'No recommendations yet'}
          </Text>
        </View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(item: SearchContact) => item.contactId}
          renderItem={({ item }) => <ContactCard contact={item as SearchContact} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6f45ff" />
          }
        />
      )}
    </SafeAreaView>
  );
}
