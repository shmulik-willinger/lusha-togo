import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchFilters } from '../api/search';
import { Button } from './ui/Button';

interface FilterSheetProps {
  visible: boolean;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  onClose: () => void;
}

const SENIORITY_OPTIONS = ['C-Level', 'VP', 'Director', 'Manager', 'Senior', 'Entry'];
const DEPARTMENT_OPTIONS = [
  'Sales', 'Marketing', 'Engineering', 'Finance', 'HR', 'Operations', 'Product', 'Legal',
];
const COMPANY_SIZE_OPTIONS = [
  { label: '1–10', value: { min: 1, max: 10 } },
  { label: '11–50', value: { min: 11, max: 50 } },
  { label: '51–200', value: { min: 51, max: 200 } },
  { label: '201–500', value: { min: 201, max: 500 } },
  { label: '501–1000', value: { min: 501, max: 1000 } },
  { label: '1000+', value: { min: 1000 } },
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

        <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false}>
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

          <TextFilter
            label="Contact Location"
            value={local.contactLocation?.[0] ?? ''}
            placeholder="e.g. New York, US"
            onChangeText={(v) =>
              setLocal({ ...local, contactLocation: v ? [v] : [] })
            }
          />

          <View className="h-px bg-neutral-200 mb-5" />
          <Text className="text-xs font-sans-semibold text-neutral-400 uppercase tracking-wide mb-4">
            Companies
          </Text>

          <TextFilter
            label="Company Name"
            value={local.companyName?.[0] ?? ''}
            placeholder="e.g. Salesforce"
            onChangeText={(v) => setLocal({ ...local, companyName: v ? [v] : [] })}
          />

          <TextFilter
            label="Industry"
            value={local.companyIndustryLabels?.[0] ?? ''}
            placeholder="e.g. SaaS, Fintech"
            onChangeText={(v) => setLocal({ ...local, companyIndustryLabels: v ? [v] : [] })}
          />

          <ChipGroup
            label="Company Size"
            options={COMPANY_SIZE_OPTIONS}
            selected={
              local.companySize
                ? [`${local.companySize.min ?? ''}–${local.companySize.max ?? ''}`]
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
