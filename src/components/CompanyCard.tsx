import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { SearchCompany } from '../api/search';
import { useCompanyStore } from '../store/companyStore';

interface CompanyCardProps {
  company: SearchCompany;
}

function fmtNum(n: number): string {
  const r = Math.round(n);
  if (r >= 1_000_000) return `${(r / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (r >= 1_000) return `${Math.round(r / 1000)}K`;
  return r.toString();
}

function formatSize(size?: SearchCompany['company_size']): string | null {
  if (!size) return null;
  // Prefer the min–max range format (matches the lists screen format)
  if (size.min != null && size.max != null && (size.min > 0 || size.max > 0))
    return `${fmtNum(size.min)}–${fmtNum(size.max)} emp.`;
  return null;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const sizeStr = formatSize(company.company_size);
  console.log('[CompanyCard]', company.name?.substring(0, 20), '| sizeStr:', sizeStr, '| industry:', company.industry?.primary_industry, '| revenue:', company.revenue_range?.string, '| raw_size:', JSON.stringify(company.company_size));
  const setSelectedCompany = useCompanyStore((s) => s.setSelectedCompany);

  return (
    <TouchableOpacity
      onPress={() => { setSelectedCompany(company); router.push(`/company/${company.company_lid}`); }}
      activeOpacity={0.85}
      className="bg-white rounded-xl p-4 mb-3 mx-4 shadow-sm"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 }}
    >
      <View className="flex-row items-start">
        {/* Logo */}
        {company.logo_url ? (
          <Image
            source={{ uri: company.logo_url }}
            className="w-10 h-10 rounded-lg mr-3 flex-shrink-0"
            resizeMode="contain"
          />
        ) : (
          <View
            className="w-10 h-10 rounded-lg items-center justify-center mr-3 flex-shrink-0"
            style={{ backgroundColor: '#6f45ff20' }}
          >
            <Text className="text-primary font-sans-bold text-sm">
              {company.name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}

        {/* Info */}
        <View className="flex-1">
          {/* Name row with inline action buttons */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text className="text-neutral-800 font-sans-semibold text-base" numberOfLines={1} style={{ flex: 1 }}>
              {company.name}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginLeft: 8, flexShrink: 0 }}>
              {company.homepage_url && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    const url = company.homepage_url!.startsWith('http')
                      ? company.homepage_url!
                      : `https://${company.homepage_url}`;
                    WebBrowser.openBrowserAsync(url);
                  }}
                  style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center' }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="globe-outline" size={15} color="#525252" />
                </TouchableOpacity>
              )}
              {company.social?.linkedin && (
                <TouchableOpacity
                  onPress={async (e) => {
                    e.stopPropagation?.();
                    const url = company.social!.linkedin!;
                    const companySlug = url.replace(/.*\/company\//, '').replace(/\/$/, '');
                    const appUrl = `linkedin://company/${companySlug}`;
                    const { Linking } = require('react-native');
                    const canOpen = await Linking.canOpenURL(appUrl);
                    if (canOpen) {
                      Linking.openURL(appUrl);
                    } else {
                      WebBrowser.openBrowserAsync(url.startsWith('http') ? url : `https://linkedin.com/company/${companySlug}`);
                    }
                  }}
                  style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#0a66c2', alignItems: 'center', justifyContent: 'center' }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>in</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text className="text-neutral-500 text-sm mt-0.5" numberOfLines={1}>
            {[company.industry?.primary_industry, sizeStr].filter(Boolean).join(' · ')}
          </Text>
          {company.location?.city && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 3 }}>
              <Ionicons name="location-outline" size={11} color="#a3a3a3" />
              <Text className="text-neutral-400 text-xs" numberOfLines={1} style={{ flexShrink: 1 }}>
                {[company.location.city, company.location.country].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
          {company.revenue_range?.string && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 3 }}>
              <Ionicons name="cash-outline" size={11} color="#a3a3a3" />
              <Text className="text-neutral-400 text-xs" numberOfLines={1} style={{ flexShrink: 1 }}>
                {company.revenue_range.string}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
