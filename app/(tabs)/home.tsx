import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAISearch } from '../../src/hooks/useAISearch';
import { AISearchBar } from '../../src/components/AISearchBar';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { useRecommendations } from '../../src/hooks/useRecommendations';
import { RecommendationGroup } from '../../src/api/recommendations';

interface RecommendationCardProps {
  group: RecommendationGroup;
  onPress: () => void;
}

function RecommendationCard({ group, onPress }: RecommendationCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>✨</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{group.name}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {group.total} leads ready to explore
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{group.total}</Text>
        </View>
      </View>

      <View style={styles.previewRow}>
        <View style={{ flex: 1 }} />
        <View style={styles.viewBtn}>
          <Text style={styles.viewBtnText}>View All →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CardSkeleton() {
  return (
    <View style={[styles.card, { paddingVertical: 18 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Skeleton width={44} height={44} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton width="60%" height={15} />
          <View style={{ marginTop: 6 }}><Skeleton width="40%" height={12} /></View>
        </View>
        <Skeleton width={36} height={24} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { data: recsData, isLoading, refetch, isRefetching, error } = useRecommendations();
  const aiSearch = useAISearch();

  const groups = recsData?.groups ?? [];

  const handleAISearch = (text: string) => {
    aiSearch.mutate({ text, tab: 'contacts' }, {
      onSettled: () => router.push('/(tabs)/search'),
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f7', direction: 'ltr' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6f45ff" />
        }
      >
        {/* AI Search section */}
        <View style={{ paddingTop: 20, paddingBottom: 20, backgroundColor: '#fff', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 }}>Find Your Next Lead</Text>
            <Text style={{ fontSize: 13, color: '#9ca3af' }}>Describe who you're looking for</Text>
          </View>
          <AISearchBar
            activeTab="contacts"
            onSubmit={handleAISearch}
            loading={aiSearch.isPending}
          />
        </View>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended Leads</Text>
          <Text style={styles.sectionSubtitle}>Tailored to your ICP</Text>
        </View>

        {/* Recommendation group cards */}
        <View style={{ paddingHorizontal: 16 }}>
          {isLoading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : error ? (
            <ErrorCard onRetry={refetch} />
          ) : groups.length === 0 ? (
            <EmptyCard />
          ) : (
            groups.map((group) => (
              <RecommendationCard
                key={group.id}
                group={group}
                onPress={() => router.push(`/recommendations?groupId=${group.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyCard() {
  return (
    <View style={[styles.card, { alignItems: 'center', paddingVertical: 32 }]}>
      <Text style={{ fontSize: 36, marginBottom: 8 }}>✨</Text>
      <Text style={{ color: '#1a1a1a', fontWeight: '600', fontSize: 15, textAlign: 'center' }}>
        No recommendations yet
      </Text>
      <Text style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
        Your recommendation groups will appear here.
      </Text>
    </View>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={[styles.card, { alignItems: 'center', paddingVertical: 24 }]}>
      <Text style={{ fontSize: 32, marginBottom: 8 }}>⚠️</Text>
      <Text style={{ color: '#1a1a1a', fontWeight: '600', fontSize: 15 }}>
        Couldn't load recommendations
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={{ marginTop: 12, backgroundColor: '#6f45ff', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 }}
        activeOpacity={0.85}
      >
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  card: {
    direction: 'ltr',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0ecff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardIconText: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#f0ecff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  countText: {
    color: '#6f45ff',
    fontSize: 13,
    fontWeight: '700',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  viewBtn: {
    backgroundColor: '#6f45ff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  viewBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
