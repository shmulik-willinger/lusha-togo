import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, SearchX } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { ContactCard } from '../src/components/ContactCard';
import { CompanyCard } from '../src/components/CompanyCard';
import { ContactCardSkeleton } from '../src/components/ui/Skeleton';
import { useRecommendations, useCompanyRecommendations } from '../src/hooks/useRecommendations';
import { SearchContact, SearchCompany } from '../src/api/search';
import { RecommendedCompanyItem } from '../src/api/recommendations';

function toSearchCompany(c: RecommendedCompanyItem): SearchCompany {
  return {
    company_lid: String(c.companyId),
    company_id: String(c.companyId),
    name: c.name,
    logo_url: c.logoUrl,
    industry: c.primaryIndustry ? { primary_industry: c.primaryIndustry } : undefined,
    company_size: c.companySize
      ? { min: c.companySize.min ?? 0, max: c.companySize.max ?? 0 }
      : undefined,
    location: c.headquarter
      ? { country: c.headquarter.country, city: c.headquarter.city }
      : undefined,
  };
}

export default function RecommendationsScreen() {
  const [tab, setTab] = useState<'contacts' | 'companies'>('contacts');
  const [search, setSearch] = useState('');

  const {
    data: contactData,
    isLoading: isLoadingContacts,
    refetch: refetchContacts,
    isRefetching: isRefetchingContacts,
  } = useRecommendations();

  const {
    data: companyData,
    isLoading: isLoadingCompanies,
    refetch: refetchCompanies,
    isRefetching: isRefetchingCompanies,
  } = useCompanyRecommendations();

  const contacts = contactData?.leads ?? [];
  const companies = (companyData?.companies ?? []).map(toSearchCompany);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.full.toLowerCase().includes(q) ||
        c.job_title?.title?.toLowerCase().includes(q) ||
        c.company?.name?.toLowerCase().includes(q),
    );
  }, [contacts, search]);

  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry?.primary_industry?.toLowerCase().includes(q) ||
        c.location?.country?.toLowerCase().includes(q) ||
        c.location?.city?.toLowerCase().includes(q),
    );
  }, [companies, search]);

  const isLoading = tab === 'contacts' ? isLoadingContacts : isLoadingCompanies;
  const isRefetching = tab === 'contacts' ? isRefetchingContacts : isRefetchingCompanies;

  const handleRefresh = () => {
    refetchContacts();
    refetchCompanies();
  };

  const countLabel =
    tab === 'contacts'
      ? `${filteredContacts.length} contact${filteredContacts.length !== 1 ? 's' : ''}`
      : `${filteredCompanies.length} compan${filteredCompanies.length !== 1 ? 'ies' : 'y'}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f7', direction: 'ltr' }}>
      <Stack.Screen options={{ title: 'Recommended Leads' }} />

      {/* Toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: '#f3efff', borderRadius: 10, padding: 3, marginHorizontal: 16, marginTop: 12 }}>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: tab === 'contacts' ? '#6f45ff' : 'transparent', alignItems: 'center' }}
          onPress={() => { setTab('contacts'); setSearch(''); }}
          activeOpacity={0.8}
        >
          <Text style={{ color: tab === 'contacts' ? '#fff' : '#6f45ff', fontWeight: '600', fontSize: 14 }}>
            Contacts {isLoadingContacts ? '' : `(${contacts.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: tab === 'companies' ? '#6f45ff' : 'transparent', alignItems: 'center' }}
          onPress={() => { setTab('companies'); setSearch(''); }}
          activeOpacity={0.8}
        >
          <Text style={{ color: tab === 'companies' ? '#fff' : '#6f45ff', fontWeight: '600', fontSize: 14 }}>
            Companies {isLoadingCompanies ? '' : `(${companies.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }}>
        <View style={{ direction: 'ltr', backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <SearchIcon size={16} color="#a3a3a3" strokeWidth={2} style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, color: '#262626', fontSize: 14 }}
            placeholder={tab === 'contacts' ? 'Search contacts...' : 'Search companies...'}
            placeholderTextColor="#a3a3a3"
            value={search}
            onChangeText={setSearch}
            textAlign="left"
          />
          {search.length > 0 && (
            <Text style={{ color: '#a3a3a3', fontSize: 20, marginLeft: 8 }} onPress={() => setSearch('')}>×</Text>
          )}
        </View>
      </View>

      {/* Count */}
      <Text style={{ color: '#a3a3a3', fontSize: 12, paddingHorizontal: 16, marginBottom: 4 }}>
        {isLoading ? '' : countLabel}
      </Text>

      {isLoading ? (
        <View style={{ flex: 1 }}>
          {[...Array(5)].map((_, i) => <ContactCardSkeleton key={i} />)}
        </View>
      ) : tab === 'contacts' ? (
        filteredContacts.length === 0 ? (
          <NoResults search={search} type="contacts" />
        ) : (
          <FlashList
            data={filteredContacts}
            keyExtractor={(item: SearchContact) => item.contactId}
            estimatedItemSize={120}
            renderItem={({ item }) => <ContactCard contact={item as SearchContact} />}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor="#6f45ff" />
            }
          />
        )
      ) : (
        filteredCompanies.length === 0 ? (
          <NoResults search={search} type="companies" />
        ) : (
          <FlashList
            data={filteredCompanies}
            keyExtractor={(item: SearchCompany) => item.company_lid}
            estimatedItemSize={90}
            renderItem={({ item }) => <CompanyCard company={item as SearchCompany} />}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor="#6f45ff" />
            }
          />
        )
      )}
    </SafeAreaView>
  );
}

function NoResults({ search, type }: { search: string; type: 'contacts' | 'companies' }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <SearchX size={40} color="#a3a3a3" strokeWidth={1.5} style={{ marginBottom: 12 }} />
      <Text style={{ color: '#262626', fontWeight: '600', fontSize: 16 }}>
        {search ? 'No matches' : `No ${type} recommendations`}
      </Text>
    </View>
  );
}
