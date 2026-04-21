import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Upload, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { router } from 'expo-router';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { useRecommendations } from '../../src/hooks/useRecommendations';
import { HomeHero } from '../../src/components/home/HomeHero';
import { SignalCard } from '../../src/components/home/SignalCard';
import { useSignalsStore, ReceivedSignal } from '../../src/store/signalsStore';
import { color, radius } from '../../src/theme/tokens';

function signalKindFromType(t: string): 'funding' | 'jobChange' | 'news' {
  if (t === 'companyChange' || t === 'promotion') return 'jobChange';
  if (t.includes('News') || t.includes('news')) return 'news';
  return 'funding';
}

function signalSubtitle(s: ReceivedSignal): string {
  const d = s.data ?? {};
  if (s.signalType === 'companyChange' && d.currentCompanyName) return `Now at ${d.currentCompanyName}`;
  if (s.signalType === 'promotion' && d.currentTitle) return `Now ${d.currentTitle}`;
  if (d.changeRatePercent != null) return `${Number(d.changeRatePercent) > 0 ? '+' : ''}${d.changeRatePercent}%`;
  return s.signalType;
}

export default function HomeScreen() {
  const { data: recsData, isLoading, refetch, error } = useRecommendations();
  const signals = useSignalsStore((s) => s.signals);

  const recentSignals = signals.slice(0, 3);
  const total = recsData?.leads?.length ?? 0;

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: color.canvas, direction: 'ltr' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <HomeHero />

        {/* Hot signals */}
        {recentSignals.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Hot signals"
              count={recentSignals.length}
              onSeeAll={() => router.push('/(tabs)/signals' as never)}
            />
            <View style={styles.sectionBody}>
              {recentSignals.map((s, i) => (
                <SignalCard
                  key={s.id ?? i}
                  kind={signalKindFromType(s.signalType)}
                  title={s.entityName}
                  subtitle={signalSubtitle(s)}
                  onPress={() => {
                    if (s.entityType === 'company') router.push(`/company/${s.entityId}`);
                    else router.push(`/contact/${s.entityId}`);
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Today's picks */}
        <View style={styles.section}>
          <SectionHeader
            title="Today's picks"
            brandCount={total}
            subtitle="Matched to your ICP"
          />
          <View style={styles.sectionBody}>
            {isLoading ? (
              <CardSkeleton />
            ) : error ? (
              <ErrorCard onRetry={refetch} />
            ) : total === 0 ? (
              <EmptyCard />
            ) : (
              <Pressable
                onPress={() => router.push('/recommendations')}
                style={styles.recCard}
              >
                <View style={styles.recIcon}>
                  <Sparkles size={18} color={color.brand} strokeWidth={2} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.recTitle}>Your Recommendations</Text>
                  <Text style={styles.recSub}>{total} leads ready to explore</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{total}</Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>

        {/* Upload row — compact dashed border */}
        <Pressable
          onPress={() => router.push('/upload-contacts' as never)}
          style={styles.uploadRow}
        >
          <View style={styles.uploadIcon}>
            <Upload size={14} color={color.brand} strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.uploadTitle}>Enrich phone contacts</Text>
            <Text style={styles.uploadSub}>Bulk-upload from device</Text>
          </View>
          <ChevronRight size={16} color={color.muted2} strokeWidth={1.75} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  title, count, brandCount, subtitle, onSeeAll,
}: {
  title: string;
  count?: number;
  brandCount?: number;
  subtitle?: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count != null && <Text style={styles.sectionCount}>· {count}</Text>}
        {brandCount != null && (
          <View style={styles.brandPill}>
            <Text style={styles.brandPillText}>{brandCount}</Text>
          </View>
        )}
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.seeAll}>See all →</Text>
        </Pressable>
      )}
      {subtitle && !onSeeAll && <Text style={styles.sectionSub}>{subtitle}</Text>}
    </View>
  );
}

function EmptyCard() {
  return (
    <View style={styles.recCard}>
      <View style={styles.recIcon}>
        <Sparkles size={18} color={color.brand} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.recTitle}>No recommendations yet</Text>
        <Text style={styles.recSub}>Your recommendations will appear here</Text>
      </View>
    </View>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={[styles.recCard, { flexDirection: 'column', alignItems: 'center', paddingVertical: 20 }]}>
      <AlertTriangle size={28} color="#f97316" strokeWidth={2} style={{ marginBottom: 8 }} />
      <Text style={{ color: color.ink, fontWeight: '600', fontSize: 14 }}>Couldn't load recommendations</Text>
      <Pressable
        onPress={onRetry}
        style={{ marginTop: 12, backgroundColor: color.brand, borderRadius: radius.sm, paddingHorizontal: 20, paddingVertical: 8 }}
      >
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Try Again</Text>
      </Pressable>
    </View>
  );
}

function CardSkeleton() {
  return (
    <View style={styles.recCard}>
      <Skeleton width={44} height={44} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Skeleton width="60%" height={15} />
        <View style={{ marginTop: 6 }}><Skeleton width="40%" height={12} /></View>
      </View>
      <Skeleton width={36} height={24} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: color.ink, letterSpacing: -0.2 },
  sectionCount: { fontSize: 13, color: color.muted2, fontWeight: '600' },
  sectionSub: { fontSize: 11, color: color.muted, marginLeft: 8 },
  brandPill: {
    backgroundColor: color.brandTint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  brandPillText: { fontSize: 11, fontWeight: '700', color: color.brand },
  seeAll: { fontSize: 12, fontWeight: '600', color: color.brand },
  sectionBody: { paddingHorizontal: 16 },

  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 14,
    shadowColor: '#0B0B10',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  recIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: color.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recTitle: { fontSize: 13, fontWeight: '700', color: color.ink },
  recSub: { fontSize: 11, color: color.muted, marginTop: 2 },

  countBadge: {
    backgroundColor: color.brandTint,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: { color: color.brand, fontSize: 13, fontWeight: '700' },

  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D1DB',
    borderRadius: radius.md,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
  },
  uploadIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: color.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: { fontSize: 12, fontWeight: '700', color: color.ink },
  uploadSub: { fontSize: 10, color: color.muted, marginTop: 1, fontWeight: '500' },
});
