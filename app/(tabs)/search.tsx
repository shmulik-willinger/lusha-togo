import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
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
        />
      </View>

      {/* Clear search button */}
      {hasSearch && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 4 }}>
          <TouchableOpacity
            onPress={() => { clearFilters(); setSearchResetKey((k) => k + 1); }}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#9ca3af', fontSize: 13 }}>✕ Clear search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter + Tab row */}
      <View className="flex-row items-center px-4 py-2 gap-3">
        {/* Filters button */}
        <TouchableOpacity
          onPress={() => setFilterSheetOpen(true)}
          className={`flex-row items-center px-3 py-2 rounded-full border ${
            activeFilterCount > 0
              ? 'bg-primary border-primary'
              : 'bg-white border-neutral-200'
          }`}
          activeOpacity={0.75}
        >
          <Text className={`text-xs font-sans-semibold ${activeFilterCount > 0 ? 'text-white' : 'text-neutral-600'}`}>
            ⚙️ Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
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
        <FlashList
          data={contacts}
          estimatedItemSize={120}
          keyExtractor={(item) => item.contactId}
          renderItem={({ item }) => <ContactCard contact={item} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          onEndReached={() => {
            if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
              searchQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            searchQuery.isFetchingNextPage ? (
              <View className="py-6"><ContactCardSkeleton /></View>
            ) : null
          }
          refreshing={searchQuery.isRefetching}
          onRefresh={() => searchQuery.refetch()}
        />
      ) : (
        <FlashList
          data={companies}
          estimatedItemSize={100}
          keyExtractor={(item) => item.company_lid}
          renderItem={({ item }) => <CompanyCard company={item} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          onEndReached={() => {
            if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
              searchQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            searchQuery.isFetchingNextPage ? (
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
      <Text className="text-5xl mb-4">🔮</Text>
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
      <Text className="text-5xl mb-4">🏢</Text>
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
      <Text className="text-5xl mb-4">🤷</Text>
      <Text className="text-neutral-800 font-sans-semibold text-xl text-center mb-2">
        No results found
      </Text>
      <Text className="text-neutral-500 text-base text-center">
        Try adjusting your filters or search with different terms.
      </Text>
    </View>
  );
}

function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const msg = (error as any)?.response?.data
    ? JSON.stringify((error as any).response.data).substring(0, 200)
    : (error as any)?.message ?? 'Unknown error';
  return (
    <ScrollView className="flex-1 px-8 pt-16">
      <Text className="text-5xl mb-4 text-center">⚠️</Text>
      <Text className="text-neutral-800 font-sans-semibold text-xl text-center mb-2">
        Search failed
      </Text>
      <Text className="text-neutral-500 text-sm text-center mb-4">{msg}</Text>
      <TouchableOpacity
        onPress={onRetry}
        className="bg-primary rounded-xl py-3 items-center"
        activeOpacity={0.85}
      >
        <Text className="text-white font-sans-semibold text-base">Try Again</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
