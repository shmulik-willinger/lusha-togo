import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useQuery } from '@tanstack/react-query';
import { SearchCompany, searchProspects, SearchContact } from '../../src/api/search';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { useCompanyStore } from '../../src/store/companyStore';
import { useContactStore } from '../../src/store/contactStore';
import { revealContact } from '../../src/api/contacts';
import { useMutation } from '@tanstack/react-query';

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
      <Text style={{ color: '#9ca3af', fontSize: 13 }}>{label}</Text>
      <Text style={{ color: '#1a1a1a', fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 16 }}>{value}</Text>
    </View>
  );
}

function LinkedInBadge() {
  return (
    <View style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: '#0077B5', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', lineHeight: 14 }}>in</Text>
    </View>
  );
}

function LinkRow({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
      activeOpacity={0.7}
    >
      <View style={{ width: 28, alignItems: 'center' }}>{typeof icon === 'string' ? <Text style={{ fontSize: 18 }}>{icon}</Text> : icon}</View>
      <Text style={{ flex: 1, marginLeft: 8, color: '#6f45ff', fontWeight: '500', fontSize: 14 }}>{label}</Text>
      <Text style={{ color: '#d1d5db', fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

async function openLinkedInCompany(linkedinUrl: string) {
  const slug = linkedinUrl.replace(/.*\/company\//, '').replace(/\/$/, '');
  const appUrl = `linkedin://company/${slug}`;
  const canOpen = await Linking.canOpenURL(appUrl);
  if (canOpen) {
    Linking.openURL(appUrl);
  } else {
    WebBrowser.openBrowserAsync(
      linkedinUrl.startsWith('http') ? linkedinUrl : `https://linkedin.com/company/${slug}`,
    );
  }
}

function DecisionMakerCard({ contact }: { contact: SearchContact }) {
  const setSelectedContact = useContactStore((s) => s.setSelectedContact);
  const [revealed, setRevealed] = React.useState(contact.isShown ?? false);
  const [phone, setPhone] = React.useState(
    contact.phones?.find((p) => !p.is_do_not_call)?.normalized_number ??
    contact.phones?.find((p) => !p.is_do_not_call)?.number
  );
  const [email, setEmail] = React.useState(contact.emails?.[0]?.address);

  const revealMutation = useMutation({
    mutationFn: () => revealContact(contact),
    onSuccess: (data: any) => {
      const items: any[] = data?.contacts ?? data?.data?.data?.contacts ?? data?.data?.contacts ?? [];
      const item = items[0];
      if (item?.phones?.length) {
        const p = item.phones[0];
        setPhone(p.value ?? p.number ?? p.normalized_number);
      }
      if (item?.emails?.length) {
        const e = item.emails[0];
        setEmail(e.value ?? e.address);
      }
      setRevealed(true);
    },
  });

  const jobLine = [contact.job_title?.title, contact.job_title?.seniority]
    .filter(Boolean).join(' · ');

  return (
    <TouchableOpacity
      onPress={() => { setSelectedContact(contact); router.push(`/contact/${contact.contactId}`); }}
      activeOpacity={0.85}
      style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0ecff', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          <Text style={{ color: '#6f45ff', fontWeight: '700', fontSize: 13 }}>
            {`${contact.name.first?.[0] ?? ''}${contact.name.last?.[0] ?? ''}`.toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', color: '#1a1a1a', fontSize: 14 }} numberOfLines={1}>
            {contact.name.full}
          </Text>
          {!!jobLine && (
            <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 1 }} numberOfLines={1}>
              {jobLine}
            </Text>
          )}
        </View>
        {!revealed ? (
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); revealMutation.mutate(); }}
            disabled={revealMutation.isPending}
            style={{ backgroundColor: '#6f45ff', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5, opacity: revealMutation.isPending ? 0.6 : 1 }}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
              {revealMutation.isPending ? 'Revealing…' : 'Show details'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ alignItems: 'flex-end' }}>
            {phone && <Text style={{ color: '#374151', fontSize: 12 }}>📞 {phone}</Text>}
            {email && <Text style={{ color: '#374151', fontSize: 11, marginTop: 2 }} numberOfLines={1}>✉ {email}</Text>}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function CompanyDetailScreen() {
  const company = useCompanyStore((s) => s.selectedCompany);

  const { data: dmData, isLoading: dmLoading } = useQuery({
    queryKey: ['company-contacts', company?.name],
    queryFn: () => searchProspects({
      filters: { companyName: [company!.name] },
      pageSize: 5,
      tab: 'contacts',
    }),
    enabled: !!company?.name,
    staleTime: 10 * 60 * 1000,
  });

  if (!company) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f7' }}>
        <Stack.Screen options={{ title: 'Company' }} />
        <CompanyDetailSkeleton />
      </SafeAreaView>
    );
  }

  const sizeLabel = company.company_size?.min != null && company.company_size?.max != null
    ? `${company.company_size.min.toLocaleString()}–${company.company_size.max.toLocaleString()}`
    : company.company_size?.employees_in_linkedin
    ? company.company_size.employees_in_linkedin.toLocaleString()
    : null;

  const decisionMakers = dmData?.contacts?.slice(0, 5) ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f7' }}>
      <Stack.Screen options={{ title: company.name }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            {company.logo_url ? (
              <Image
                source={{ uri: company.logo_url }}
                style={{ width: 60, height: 60, borderRadius: 12, marginRight: 14 }}
                resizeMode="contain"
              />
            ) : (
              <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: '#f0ecff', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Text style={{ color: '#6f45ff', fontSize: 22, fontWeight: '700' }}>
                  {company.name?.[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#1a1a1a', fontSize: 20, fontWeight: '700' }}>{company.name}</Text>
              {company.industry?.primary_industry && (
                <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 2 }}>
                  {company.industry.primary_industry}
                </Text>
              )}
              {company.location?.city && (
                <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 2 }}>
                  📍 {[company.location.city, company.location.country].filter(Boolean).join(', ')}
                </Text>
              )}
            </View>
          </View>

          {/* Quick stats row */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {sizeLabel && (
              <View style={{ backgroundColor: '#f9fafb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: '#374151', fontSize: 12 }}>👥 {sizeLabel} employees</Text>
              </View>
            )}
            {company.founded && (
              <View style={{ backgroundColor: '#f9fafb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: '#374151', fontSize: 12 }}>📅 Founded {company.founded}</Text>
              </View>
            )}
            {company.revenue_range?.string && (
              <View style={{ backgroundColor: '#f9fafb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: '#374151', fontSize: 12 }}>💰 {company.revenue_range.string}</Text>
              </View>
            )}
          </View>

          {company.description && (
            <Text style={{ color: '#6b7280', fontSize: 13, lineHeight: 19, marginTop: 12 }} numberOfLines={4}>
              {company.description}
            </Text>
          )}
        </View>

        {/* Company Info */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 8, marginBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
            Company Info
          </Text>
          {company.industry?.primary_industry && (
            <StatRow label="Primary industry" value={company.industry.primary_industry} />
          )}
          {company.secondary_industry && (
            <StatRow label="Secondary industry" value={company.secondary_industry} />
          )}
          {sizeLabel && <StatRow label="Employees" value={`${sizeLabel}`} />}
          {company.revenue_range?.string && (
            <StatRow label="Revenue" value={company.revenue_range.string} />
          )}
          {company.founded && <StatRow label="Founded" value={String(company.founded)} />}
          {company.linkedin_followers != null && (
            <StatRow label="LinkedIn followers" value={
              company.linkedin_followers >= 1_000_000
                ? `${(company.linkedin_followers / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
                : company.linkedin_followers >= 1_000
                ? `${Math.round(company.linkedin_followers / 1000)}K`
                : String(company.linkedin_followers)
            } />
          )}
          {company.sic && <StatRow label="SIC" value={company.sic} />}
          {company.naics && <StatRow label="NAICS" value={company.naics} />}
          {(company.specialties?.length ?? 0) > 0 && (
            <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <Text style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8 }}>Specialties</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {company.specialties!.map((s, i) => (
                  <View key={i} style={{ backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 12, color: '#374151' }}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <View style={{ height: 8 }} />
        </View>

        {/* Potential Decision Makers */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 8, marginBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
            Potential Decision Makers
          </Text>
          {dmLoading ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#6f45ff" />
            </View>
          ) : decisionMakers.length === 0 ? (
            <Text style={{ color: '#9ca3af', fontSize: 13, paddingVertical: 12 }}>No contacts found</Text>
          ) : (
            decisionMakers.map((c) => (
              <DecisionMakerCard key={c.contactId} contact={c} />
            ))
          )}
          <View style={{ height: 8 }} />
        </View>

        {/* Links */}
        {(company.homepage_url || company.social?.linkedin || company.social?.twitter || company.social?.crunchbase) && (
          <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
              Links
            </Text>
            {company.homepage_url && (
              <LinkRow
                icon="🌐"
                label={company.homepage_url}
                onPress={() => {
                  const url = company.homepage_url!.startsWith('http')
                    ? company.homepage_url!
                    : `https://${company.homepage_url}`;
                  WebBrowser.openBrowserAsync(url);
                }}
              />
            )}
            {company.social?.linkedin && (
              <LinkRow
                icon={<LinkedInBadge />}
                label="LinkedIn Company Page"
                onPress={() => openLinkedInCompany(company.social!.linkedin!)}
              />
            )}
            {company.social?.twitter && (
              <LinkRow
                icon="🐦"
                label={`@${company.social.twitter.replace(/.*twitter\.com\//i, '')}`}
                onPress={() =>
                  WebBrowser.openBrowserAsync(
                    company.social!.twitter!.startsWith('http')
                      ? company.social!.twitter!
                      : `https://twitter.com/${company.social!.twitter}`,
                  )
                }
              />
            )}
            {company.social?.crunchbase && (
              <LinkRow
                icon="🚀"
                label="Crunchbase Profile"
                onPress={() =>
                  WebBrowser.openBrowserAsync(
                    company.social!.crunchbase!.startsWith('http')
                      ? company.social!.crunchbase!
                      : `https://crunchbase.com/${company.social!.crunchbase}`,
                  )
                }
              />
            )}
            <View style={{ height: 8 }} />
          </View>
        )}

        {/* Funding */}
        {(company.funding_rounds?.length ?? 0) > 0 && (
          <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
              Funding
            </Text>
            {company.funding_summary?.last_funding_round && (
              <StatRow label="Last round" value={company.funding_summary.last_funding_round} />
            )}
            {company.funding_rounds?.slice(0, 4).map((round: any, i) => {
              const usd = round.money_raised_usd ?? round.moneyRaisedUsd;
              const rawDate = round.announced_on ?? round.announcedOn;
              let dateStr = '';
              if (rawDate) {
                if (typeof rawDate === 'number') {
                  // Unix timestamp (seconds or ms) → year only
                  const ts = rawDate > 1e10 ? rawDate : rawDate * 1000;
                  dateStr = new Date(ts).getFullYear().toString();
                } else {
                  // String like "2023-01-15" or "2023" → first 7 chars
                  dateStr = String(rawDate).substring(0, 7);
                }
              }
              const amtStr = usd
                ? usd >= 1_000_000_000
                  ? `$${(usd / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
                  : `$${(usd / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
                : 'Undisclosed';
              return (
                <View key={i} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                  <Text style={{ color: '#1a1a1a', fontWeight: '600', fontSize: 13 }}>{round.title}</Text>
                  <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                    {amtStr}{dateStr ? ` · ${dateStr}` : ''}
                  </Text>
                </View>
              );
            })}
            <View style={{ height: 8 }} />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CompanyDetailSkeleton() {
  return (
    <View style={{ padding: 16 }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Skeleton width={60} height={60} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Skeleton width="55%" height={20} />
            <View style={{ marginTop: 8 }}><Skeleton width="40%" height={14} /></View>
          </View>
        </View>
      </View>
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20 }}>
        {[...Array(5)].map((_, i) => (
          <View key={i} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Skeleton height={14} />
          </View>
        ))}
      </View>
    </View>
  );
}
