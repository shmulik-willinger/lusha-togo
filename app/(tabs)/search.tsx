import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, Sparkles, SlidersHorizontal, X, AlertTriangle, SearchX, Gauge } from 'lucide-react-native';
import { AISearchBar } from '../../src/components/AISearchBar';
import { AIThinkingOverlay } from '../../src/components/AIThinkingOverlay';
import { FilterSheet } from '../../src/components/FilterSheet';
import { ContactCard } from '../../src/components/ContactCard';
import { CompanyCard } from '../../src/components/CompanyCard';
import { ContactCardSkeleton } from '../../src/components/ui/Skeleton';
import { useSearchStore } from '../../src/store/searchStore';
import { useAISearch } from '../../src/hooks/useAISearch';
import { useSearch, flattenContacts, flattenCompanies } from '../../src/hooks/useSearch';
import { SearchContact, SearchCompany } from '../../src/api/search';

export default function SearchScreen() {
  const { filters, activeTab, setActiveTab, setFilters, queryText, clearFilters } = useSearchStore();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [searchResetKey, setSearchResetKey] = useState(0);

  const aiSearch = useAISearch();

  const hasFilters = Object.values(filters).some((v) =>
    Array.isArray(v) ? v.length > 0 : v != null,
  );
  const activeFilterCount = Object.values(filters).filter((v) =>
    Array.isArray(v) ? v.length > 0 : v != null,
  ).length;

  const hasCompanyFilters = !!(
    filters.companyName?.length ||
    filters.companySize ||
    filters.companyRevenue ||
    filters.companyIndustryLabels?.length ||
    filters.companyLocation?.length ||
    filters.companyFoundedYear
  );

  const hasSearch = hasFilters || queryText.length > 0;
  // Company search: allow if there are company-specific filters OR a queryText (sent as filters.searchText)
  const companySearchEnabled = activeTab === 'companies' ? (hasCompanyFilters || queryText.length > 0) : hasSearch;

  const searchQuery = useSearch(filters, activeTab, companySearchEnabled);
  const contacts = flattenContacts(searchQuery.data);
  const companies = flattenCompanies(searchQuery.data);

  const isLoading = searchQuery.isLoading || aiSearch.isPending;
  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: '#f5f5f7', direction: 'ltr' }}>
      <AIThinkingOverlay visible={aiSearch.isPending} />

      {/* AI Search bar */}
      <View className="pt-3 pb-2">
        <AISearchBar
          key={`${searchResetKey}-${queryText}`}
          activeTab={activeTab}
          onSubmit={(text) => aiSearch.mutate({ text, tab: activeTab })}
          loading={aiSearch.isPending}
          initialText={queryText}
          onClear={() => { clearFilters(); setSearchResetKey((k) => k + 1); }}
        />
      </View>

      {/* Clear search button */}
      {hasSearch && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 4 }}>
          <TouchableOpacity
            onPress={() => { clearFilters(); setSearchResetKey((k) => k + 1); }}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <X size={13} color="#a3a3a3" strokeWidth={2} />
            <Text style={{ color: '#a3a3a3', fontSize: 13 }}>Clear search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter + Tab row */}
      <View className="flex-row items-center px-4 py-2 gap-3">
        {/* Filters button */}
        <TouchableOpacity
          onPress={() => setFilterSheetOpen(true)}
          className={`flex-row items-center px-3 py-2 rounded-full border gap-1.5 ${
            activeFilterCount > 0
              ? 'bg-primary border-primary'
              : 'bg-white border-neutral-200'
          }`}
          activeOpacity={0.75}
        >
          <SlidersHorizontal size={13} color={activeFilterCount > 0 ? '#ffffff' : '#525252'} strokeWidth={2} />
          <Text className={`text-xs font-sans-semibold ${activeFilterCount > 0 ? 'text-white' : 'text-neutral-600'}`}>
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </TouchableOpacity>

        {/* Tab switcher */}
        <View className="flex-row bg-neutral-200 rounded-full p-0.5 ml-auto">
          {(['contacts', 'companies'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full ${activeTab === tab ? 'bg-white' : ''}`}
              activeOpacity={0.75}
            >
              <Text
                className={`text-xs font-sans-semibold capitalize ${
                  activeTab === tab ? 'text-neutral-800' : 'text-neutral-500'
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results or empty state */}
      {!hasSearch ? (
        <EmptyState />
      ) : isLoading ? (
        <View className="flex-1">
          {[...Array(5)].map((_, i) => (
            <ContactCardSkeleton key={i} />
          ))}
        </View>
      ) : searchQuery.isError ? (
        <ErrorState error={searchQuery.error} onRetry={() => searchQuery.refetch()} />
      ) : activeTab === 'contacts' && contacts.length === 0 ? (
        <NoResultsState />
      ) : activeTab === 'companies' && !companySearchEnabled ? (
        <AddCompanyFiltersState onOpenFilters={() => setFilterSheetOpen(true)} />
      ) : activeTab === 'companies' && companies.length === 0 ? (
        <NoResultsState />
      ) : activeTab === 'contacts' ? (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.contactId}
          renderItem={({ item }) => <ContactCard contact={item} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          onEndReached={() => {
            if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage && contacts.length >= 10) {
              searchQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            searchQuery.isFetchingNextPage && contacts.length >= 10 ? (
              <View className="py-6"><ContactCardSkeleton /></View>
            ) : null
          }
          refreshing={searchQuery.isRefetching}
          onRefresh={() => searchQuery.refetch()}
        />
      ) : (
        <FlatList
          data={companies}
          keyExtractor={(item) => item.company_lid}
          renderItem={({ item }) => <CompanyCard company={item} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          onEndReached={() => {
            if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage && companies.length >= 10) {
              searchQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            searchQuery.isFetchingNextPage && companies.length >= 10 ? (
              <View className="py-6"><ContactCardSkeleton /></View>
            ) : null
          }
          refreshing={searchQuery.isRefetching}
          onRefresh={() => searchQuery.refetch()}
        />
      )}

      <FilterSheet
        visible={filterSheetOpen}
        filters={filters}
        onApply={(f) => setFilters(f)}
        onClose={() => setFilterSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Sparkles size={56} color="#6f45ff" strokeWidth={1.5} style={{ marginBottom: 16 }} />
      <Text className="text-neutral-800 font-sans-semibold text-xl text-center mb-2">
        Find your next prospect
      </Text>
      <Text className="text-neutral-500 text-base text-center">
        Describe who you're looking for above, or tap Filters to build a search.
      </Text>
    </View>
  );
}

function AddCompanyFiltersState({ onOpenFilters }: { onOpenFilters: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Building2 size={56} color="#a3a3a3" strokeWidth={1.5} style={{ marginBottom: 16 }} />
      <Text className="text-neutral-800 font-sans-semibold text-xl text-center mb-2">
        Add company filters
      </Text>
      <Text className="text-neutral-500 text-base text-center mb-6">
        Use the Filters button to search by company name, industry, size, or location.
      </Text>
      <TouchableOpacity
        onPress={onOpenFilters}
        className="bg-primary rounded-xl py-3 px-8 items-center"
        activeOpacity={0.85}
      >
        <Text className="text-white font-sans-semibold text-base">Open Filters</Text>
      </TouchableOpacity>
    </View>
  );
}

function NoResultsState() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <SearchX size={56} color="#a3a3a3" strokeWidth={1.5} style={{ marginBottom: 16 }} />
      <Text className="text-neutral-800 font-sans-semibold text-xl text-center mb-2">
        No results found
      </Text>
      <Text className="text-neutral-500 text-base text-center">
        Try adjusting your filters or search with different terms.
      </Text>
    </View>
  );
}

function QuotaExceededState({ onRetry }: { onRetry: () => void }) {
  // Compute "resets tomorrow at midnight UTC" — most plan quotas reset daily
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const resetsText = tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  return (
    <View className="flex-1 items-center justify-center px-8">
      {/* Circular brand-tint badge with the Gauge icon */}
      <View
        style={{
          width: 88, height: 88, borderRadius: 44,
          backgroundColor: '#F1ECFF',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Gauge size={40} color="#6F45FF" strokeWidth={1.75} />
      </View>
      <Text className="text-neutral-800 font-sans-bold text-center" style={{ fontSize: 22, letterSpacing: -0.3, marginBottom: 8 }}>
        You're out of searches for today
      </Text>
      <Text className="text-neutral-500 text-center" style={{ fontSize: 14, lineHeight: 20, maxWidth: 320, marginBottom: 4 }}>
        Your plan's daily prospecting limit has been reached.
      </Text>
      <Text className="text-neutral-400 text-center" style={{ fontSize: 12, marginBottom: 28 }}>
        Resets on {resetsText}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        className="bg-primary items-center"
        style={{ paddingVertical: 14, paddingHorizontal: 28, borderRadius: 999, minWidth: 200 }}
        activeOpacity={0.85}
      >
        <Text className="text-white font-sans-semibold" style={{ fontSize: 14 }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const err = error as any;
  const isQuota = err?.quotaExceeded === true || err?.response?.data?.searchQuotaExceeded === true;
  if (isQuota) return <QuotaExceededState onRetry={onRetry} />;
  const msg = err?.response?.data
    ? JSON.stringify(err.response.data).substring(0, 200)
    : err?.message ?? 'Unknown error';
  return (
    <View className="flex-1 items-center justify-center px-8">
      <AlertTriangle size={56} color="#f97316" strokeWidth={1.5} style={{ marginBottom: 16 }} />
      <Text className="text-neutral-800 font-sans-semibold text-xl text-center mb-2">
        Search failed
      </Text>
      <Text className="text-neutral-500 text-sm text-center mb-6" style={{ maxWidth: 320 }}>{msg}</Text>
      <TouchableOpacity
        onPress={onRetry}
        className="bg-primary items-center"
        style={{ paddingVertical: 14, paddingHorizontal: 28, borderRadius: 999, minWidth: 200 }}
        activeOpacity={0.85}
      >
        <Text className="text-white font-sans-semibold" style={{ fontSize: 14 }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}
