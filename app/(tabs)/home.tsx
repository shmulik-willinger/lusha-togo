import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
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
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: '#f2f2f2', direction: 'ltr' }}>

      {/* ── Section 1: AI Search ─────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Find Your Next Lead</Text>
          <Text style={styles.sectionSubtitle}>Describe who you're looking for</Text>
        </View>
        <View style={{ paddingTop: 14 }}>
          <AISearchBar
            activeTab="contacts"
            onSubmit={handleAISearch}
            loading={aiSearch.isPending}
            compact
          />
        </View>
      </View>

      {/* thin separator */}
      <View style={styles.separator} />

      {/* ── Section 2: Recommended Leads ────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Recommendations</Text>
          <Text style={styles.sectionSubtitle}>Tailored to your ICP</Text>
        </View>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
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
            <RecommendationCard
              group={{ id: 'all', name: 'Your Recommendations', total: recsData?.leads?.length ?? 0, leads: [] }}
              onPress={() => router.push('/recommendations')}
            />
          )}
        </ScrollView>
      </View>

      {/* thin separator */}
      <View style={styles.separator} />

      {/* ── Section 3: Enrich ────────────────────────────────────── */}
      <View style={[styles.section, { flex: 0 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Enrich your phone contacts</Text>
          <Text style={styles.sectionSubtitle}>Upload & enrich from your device</Text>
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <TouchableOpacity
            style={styles.uploadContactsBtn}
            onPress={() => router.push('/upload-contacts' as never)}
            activeOpacity={0.82}
          >
            <View style={styles.uploadContactsIcon}>
              <Text style={{ fontSize: 20 }}>📤</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.uploadContactsTitle}>Upload Contacts</Text>
              <Text style={styles.uploadContactsSub}>Enrich your phone contacts with Lusha</Text>
            </View>
            <Text style={{ color: '#6f45ff', fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 0.6 }} />

    </SafeAreaView>
  );
}

function EmptyCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>✨</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardTitle}>No recommendations yet</Text>
          <Text style={styles.cardSubtitle}>Your recommendations will appear here</Text>
        </View>
      </View>
    </View>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={[styles.card, { alignItems: 'center', paddingVertical: 24 }]}>
      <Text style={{ fontSize: 32, marginBottom: 8 }}>⚠️</Text>
      <Text style={{ color: '#262626', fontWeight: '600', fontSize: 15 }}>
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
  section: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#262626',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#a3a3a3',
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
    backgroundColor: '#f3efff',
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
    color: '#262626',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#a3a3a3',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#f3efff',
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
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a3a3a3',
    letterSpacing: 1.5,
    marginHorizontal: 12,
  },
  uploadContactsBtn: {
    direction: 'ltr',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadContactsIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f3efff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  uploadContactsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#262626',
  },
  uploadContactsSub: {
    fontSize: 12,
    color: '#a3a3a3',
    marginTop: 2,
  },
});
