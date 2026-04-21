import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, SearchX } from 'lucide-react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { getContactListById } from '../../src/api/lists';
import { ContactCard } from '../../src/components/ContactCard';
import { CompanyCard } from '../../src/components/CompanyCard';
import { ContactCardSkeleton } from '../../src/components/ui/Skeleton';
import { ScreenTitle } from '../../src/components/ui/ScreenTitle';
import { SearchContact, SearchCompany } from '../../src/api/search';
import { color } from '../../src/theme/tokens';

export default function ListDetailScreen() {
  const { id, type: typeParam, name: nameParam } = useLocalSearchParams<{ id: string; type?: string; name?: string }>();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [allContacts, setAllContacts] = useState<SearchContact[]>([]);

  const listType = typeParam === 'companies' ? 'companies' : typeParam === 'contacts' ? 'contacts' : undefined;
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['contact-list', id, page, listType],
    queryFn: () => getContactListById(id, page, listType),
    enabled: !!id,
  });

  useEffect(() => {
    if (data?.contacts) {
      if (page === 0) {
        setAllContacts(data.contacts);
      } else {
        setAllContacts((prev) => [...prev, ...data.contacts]);
      }
    }
  }, [data?.contacts, page]);

  // typeParam from URL is the most reliable source (set when navigating from the lists screen)
  const isCompanyList = typeParam === 'companies' || !!(data?.type === 'companies' || (data?.companies && data.companies.length > 0));

  const filtered = useMemo(() => {
    if (isCompanyList) {
      if (!data?.companies?.length) return [];
      if (!search.trim()) return data.companies;
      const q = search.toLowerCase();
      return data.companies.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.industry?.primary_industry?.toLowerCase().includes(q) ||
          c.location?.country?.toLowerCase().includes(q) ||
          c.location?.city?.toLowerCase().includes(q),
      );
    }
    if (!allContacts.length) return [];
    if (!search.trim()) return allContacts;
    const q = search.toLowerCase();
    return allContacts.filter(
      (c) =>
        c.name.full.toLowerCase().includes(q) ||
        c.job_title?.title?.toLowerCase().includes(q) ||
        c.company?.name?.toLowerCase().includes(q),
    );
  }, [allContacts, data?.companies, isCompanyList, search]);

  const hasMore = !isCompanyList && data?.contacts?.length === 50;

  const countLabel = useMemo(() => {
    if (!data) return null;
    if (isCompanyList) {
      const total = data.contactCount || data.companies?.length || 0;
      return `${filtered.length} compan${filtered.length !== 1 ? 'ies' : 'y'}`;
    }
    return `${filtered.length} of ${data.contactCount} contact${data.contactCount !== 1 ? 's' : ''}`;
  }, [data, filtered.length, isCompanyList]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.canvas, direction: 'ltr' }}>
      <Stack.Screen options={{ title: data?.name || (nameParam ? decodeURIComponent(nameParam) : 'List') }} />

      {/* Large title + meta */}
      {data && (
        <ScreenTitle
          title={data.name || (nameParam ? decodeURIComponent(nameParam) : 'List')}
          meta={countLabel ?? undefined}
        />
      )}

      {/* Search within list */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
        <View style={{ direction: 'ltr', backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <SearchIcon size={16} color="#a3a3a3" strokeWidth={2} style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, color: '#262626', fontSize: 14 }}
            placeholder={isCompanyList ? 'Search companies...' : 'Search in this list...'}
            placeholderTextColor="#a3a3a3"
            value={search}
            onChangeText={setSearch}
            textAlign="left"
          />
          {search.length > 0 && (
            <Text
              style={{ color: '#a3a3a3', fontSize: 20, marginLeft: 8 }}
              onPress={() => setSearch('')}
            >
              ×
            </Text>
          )}
        </View>
      </View>

      {isLoading && page === 0 ? (
        <View className="flex-1">
          {[...Array(5)].map((_, i) => <ContactCardSkeleton key={i} />)}
        </View>
      ) : filtered.length === 0 ? (
        <NoResults search={search} isCompanyList={isCompanyList} />
      ) : isCompanyList ? (
        <FlashList
          data={filtered as SearchCompany[]}
          estimatedItemSize={90}
          keyExtractor={(item: SearchCompany) => item.company_lid || item.company_id}
          renderItem={({ item }) => <CompanyCard company={item as SearchCompany} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                setPage(0);
                refetch();
              }}
              tintColor="#6f45ff"
            />
          }
        />
      ) : (
        <FlashList
          data={filtered as SearchContact[]}
          estimatedItemSize={120}
          keyExtractor={(item: SearchContact) => item.contactId}
          renderItem={({ item }) => <ContactCard contact={item as SearchContact} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                setPage(0);
                refetch();
              }}
              tintColor="#6f45ff"
            />
          }
          onEndReached={() => {
            if (hasMore && !isRefetching) setPage((p) => p + 1);
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            hasMore ? <View style={{ paddingVertical: 20 }}><ContactCardSkeleton /></View> : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function NoResults({ search, isCompanyList }: { search: string; isCompanyList?: boolean }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <SearchX size={48} color="#a3a3a3" strokeWidth={1.5} style={{ marginBottom: 16 }} />
      <Text className="text-neutral-800 font-sans-semibold text-lg text-center mb-1">
        {search ? 'No matches' : 'Empty list'}
      </Text>
      <Text className="text-neutral-500 text-sm text-center">
        {search
          ? `No ${isCompanyList ? 'companies' : 'contacts'} match "${search}"`
          : `This list has no ${isCompanyList ? 'companies' : 'contacts'} yet.`}
      </Text>
    </View>
  );
}
