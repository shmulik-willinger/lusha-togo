import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchFilters } from '../api/search';
import {
  CompanyNameOption,
  LocationOption,
  IndustryLabelOption,
  fetchCompanyNames,
  fetchContactLocations,
  fetchCompanyLocations,
  fetchIndustryLabels,
  getLocationLabel,
} from '../api/filters';
import { Button } from './ui/Button';

interface FilterSheetProps {
  visible: boolean;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  onClose: () => void;
}

const SENIORITY_OPTIONS = ['Executive', 'Vice President', 'Director', 'Manager', 'Other'];
const DEPARTMENT_OPTIONS = [
  'Business Development', 'Consulting', 'Customer Service', 'Engineering & Technical',
  'Finance', 'General Management', 'Health Care & Medical', 'Human Resources',
  'Legal', 'Marketing', 'Operations', 'Product', 'Research & Analytics', 'Sales', 'Other',
];
const COMPANY_SIZE_OPTIONS = [
  { label: '1–10', value: { min: 1, max: 10 } },
  { label: '11–50', value: { min: 11, max: 50 } },
  { label: '51–100', value: { min: 51, max: 100 } },
  { label: '101–250', value: { min: 101, max: 250 } },
  { label: '251–500', value: { min: 251, max: 500 } },
  { label: '501–1000', value: { min: 501, max: 1000 } },
  { label: '1001–5000', value: { min: 1001, max: 5000 } },
  { label: '5001+', value: { min: 5001 } },
];

type ChipOption = { label: string; value: string | object };

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: ChipOption[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <View className="mb-5">
      <Text className="text-neutral-700 font-sans-semibold text-sm mb-2">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const val = typeof opt.value === 'string' ? opt.value : opt.label;
          const active = selected.includes(val);
          return (
            <TouchableOpacity
              key={opt.label}
              onPress={() => onToggle(val)}
              className={`px-3 py-1.5 rounded-full border ${
                active ? 'bg-primary border-primary' : 'bg-white border-neutral-200'
              }`}
              activeOpacity={0.75}
            >
              <Text className={`text-xs font-sans-semibold ${active ? 'text-white' : 'text-neutral-600'}`}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function TextFilter({
  label,
  value,
  placeholder,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (val: string) => void;
}) {
  return (
    <View className="mb-5">
      <Text className="text-neutral-700 font-sans-semibold text-sm mb-2">{label}</Text>
      <TextInput
        className="bg-white border border-neutral-200 rounded-lg px-3 py-2.5 text-neutral-800 text-sm"
        placeholder={placeholder}
        placeholderTextColor="#a3a3a3"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function AutocompleteFilter<T>({
  label,
  selected,
  onAddItem,
  onRemoveItem,
  onSearch,
  getLabel,
  placeholder,
  dropdownZIndex = 10,
}: {
  label: string;
  selected: T[];
  onAddItem: (item: T) => void;
  onRemoveItem: (index: number) => void;
  onSearch: (text: string) => Promise<T[]>;
  getLabel: (item: T) => string;
  placeholder: string;
  dropdownZIndex?: number;
}) {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!text.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const results = await onSearch(text);
      setSuggestions(results);
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [text]);

  const showDropdown = !loading && suggestions.length > 0;

  return (
    <View style={{ marginBottom: 20, zIndex: dropdownZIndex, elevation: dropdownZIndex }}>
      <Text className="text-neutral-700 font-sans-semibold text-sm mb-2">{label}</Text>

      {/* Selected chips */}
      {selected.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-2">
          {selected.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => onRemoveItem(i)}
              className="flex-row items-center bg-primary px-3 py-1.5 rounded-full gap-1"
              activeOpacity={0.75}
            >
              <Text className="text-xs text-white font-sans-semibold">{getLabel(item)}</Text>
              <Text className="text-white text-xs" style={{ marginLeft: 4 }}>✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Text input + absolute dropdown */}
      <View style={{ position: 'relative', zIndex: dropdownZIndex, elevation: dropdownZIndex }}>
        <TextInput
          className="bg-white border border-neutral-200 rounded-lg px-3 py-2.5 text-neutral-800 text-sm"
          placeholder={placeholder}
          placeholderTextColor="#a3a3a3"
          value={text}
          onChangeText={setText}
        />

        {/* Loading indicator */}
        {loading && (
          <View style={{ paddingVertical: 8, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#6f45ff" />
          </View>
        )}

        {/* Suggestions — absolute so they overlay content below without pushing layout */}
        {showDropdown && (
          <ScrollView
            style={{
              position: 'absolute',
              top: 44,
              left: 0,
              right: 0,
              maxHeight: 220,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderRadius: 8,
              zIndex: dropdownZIndex + 1,
              elevation: dropdownZIndex + 1,
            }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {suggestions.map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  onAddItem(item);
                  setText('');
                  setSuggestions([]);
                }}
                style={{ paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: i < suggestions.length - 1 ? 1 : 0, borderBottomColor: '#e5e5e5' }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14, color: '#262626' }}>{getLabel(item)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export function FilterSheet({ visible, filters, onApply, onClose }: FilterSheetProps) {
  const [local, setLocal] = useState<SearchFilters>(filters);

  React.useEffect(() => {
    setLocal(filters);
  }, [filters, visible]);

  const activeCount = Object.values(local).filter((v) =>
    Array.isArray(v) ? v.length > 0 : v != null,
  ).length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-neutral-100">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-neutral-200">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-neutral-500 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="font-sans-semibold text-base text-neutral-800">
            Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </Text>
          <TouchableOpacity onPress={() => setLocal({})}>
            <Text className="text-primary text-base">Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text className="text-xs font-sans-semibold text-neutral-400 uppercase tracking-wide mb-4">
            Contacts
          </Text>

          <TextFilter
            label="Contact Name"
            value={local.contactName?.[0] ?? ''}
            placeholder="e.g. John Smith"
            onChangeText={(v) => setLocal({ ...local, contactName: v ? [v] : [] })}
          />

          <TextFilter
            label="Job Title"
            value={local.contactJobTitle?.[0] ?? ''}
            placeholder="e.g. VP of Sales"
            onChangeText={(v) => setLocal({ ...local, contactJobTitle: v ? [v] : [] })}
          />

          <ChipGroup
            label="Seniority"
            options={SENIORITY_OPTIONS.map((s) => ({ label: s, value: s }))}
            selected={local.contactSeniority ?? []}
            onToggle={(v) => setLocal({ ...local, contactSeniority: toggle(local.contactSeniority ?? [], v) })}
          />

          <ChipGroup
            label="Department"
            options={DEPARTMENT_OPTIONS.map((d) => ({ label: d, value: d }))}
            selected={local.contactDepartment ?? []}
            onToggle={(v) => setLocal({ ...local, contactDepartment: toggle(local.contactDepartment ?? [], v) })}
          />

          <AutocompleteFilter<LocationOption>
            label="Contact Location"
            selected={local.contactLocation ?? []}
            onAddItem={(item) => setLocal({ ...local, contactLocation: [...(local.contactLocation ?? []), item] })}
            onRemoveItem={(i) => setLocal({ ...local, contactLocation: (local.contactLocation ?? []).filter((_, idx) => idx !== i) })}
            onSearch={fetchContactLocations}
            getLabel={getLocationLabel}
            placeholder="e.g. United States, New York"
            dropdownZIndex={40}
          />

          <View className="h-px bg-neutral-200 mb-5" />
          <Text className="text-xs font-sans-semibold text-neutral-400 uppercase tracking-wide mb-4">
            Companies
          </Text>

          <AutocompleteFilter<CompanyNameOption>
            label="Company Name"
            selected={local.companyName ?? []}
            onAddItem={(item) => setLocal({ ...local, companyName: [...(local.companyName ?? []), item] })}
            onRemoveItem={(i) => setLocal({ ...local, companyName: (local.companyName ?? []).filter((_, idx) => idx !== i) })}
            onSearch={fetchCompanyNames}
            getLabel={(item) => item.name}
            placeholder="e.g. Salesforce"
            dropdownZIndex={35}
          />

          <AutocompleteFilter<IndustryLabelOption>
            label="Industry"
            selected={local.companyIndustryLabels ?? []}
            onAddItem={(item) => setLocal({ ...local, companyIndustryLabels: [...(local.companyIndustryLabels ?? []), item] })}
            onRemoveItem={(i) => setLocal({ ...local, companyIndustryLabels: (local.companyIndustryLabels ?? []).filter((_, idx) => idx !== i) })}
            onSearch={fetchIndustryLabels}
            getLabel={(item) => item.value}
            placeholder="e.g. Software Development"
            dropdownZIndex={30}
          />

          <AutocompleteFilter<LocationOption>
            label="Company Location"
            selected={local.companyLocation ?? []}
            onAddItem={(item) => setLocal({ ...local, companyLocation: [...(local.companyLocation ?? []), item] })}
            onRemoveItem={(i) => setLocal({ ...local, companyLocation: (local.companyLocation ?? []).filter((_, idx) => idx !== i) })}
            onSearch={fetchCompanyLocations}
            getLabel={getLocationLabel}
            placeholder="e.g. United States, London"
            dropdownZIndex={25}
          />

          <ChipGroup
            label="Company Size"
            options={COMPANY_SIZE_OPTIONS}
            selected={
              local.companySize
                ? [COMPANY_SIZE_OPTIONS.find(
                    (o) => (o.value as any).min === local.companySize?.min
                  )?.label ?? '']
                : []
            }
            onToggle={(v) => {
              const found = COMPANY_SIZE_OPTIONS.find((o) => o.label === v);
              if (found) {
                const same =
                  local.companySize?.min === (found.value as { min?: number; max?: number }).min;
                setLocal({
                  ...local,
                  companySize: same ? undefined : (found.value as SearchFilters['companySize']),
                });
              }
            }}
          />

          <View className="h-20" />
        </ScrollView>

        {/* Apply button */}
        <View className="px-4 pb-6 pt-3 bg-white border-t border-neutral-200">
          <Button onPress={() => { onApply(local); onClose(); }} size="lg">
            Apply Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
