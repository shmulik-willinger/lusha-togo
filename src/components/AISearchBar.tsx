import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ScrollView } from 'react-native';

const CONTACT_EXAMPLES = [
  'HR managers at SMBs in the US',
  'VP of Sales at fintech companies',
  'Decision makers in finance and tech',
];

const COMPANY_EXAMPLES = [
  'Biotech companies with 100M+ revenue from UK',
  'Consulting companies with 5000 employees from India',
  'SaaS companies founded after 2015',
];

interface AISearchBarProps {
  activeTab: 'contacts' | 'companies';
  onSubmit: (text: string) => void;
  loading?: boolean;
  onClear?: () => void;
  initialText?: string;
  compact?: boolean;
}

export function AISearchBar({ activeTab, onSubmit, loading = false, onClear, initialText, compact }: AISearchBarProps) {
  const [text, setText] = useState(initialText ?? '');
  const examples = activeTab === 'contacts' ? CONTACT_EXAMPLES : COMPANY_EXAMPLES;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed.length >= 5) {
      onSubmit(trimmed);
    }
  };

  return (
    <View style={{ direction: 'ltr' }}>
      {/* Input row */}
      <View
        style={{ direction: 'ltr', marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row', alignItems: compact ? 'center' : 'flex-end', minHeight: compact ? 76 : undefined, paddingHorizontal: 14, paddingVertical: compact ? 16 : 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}
      >
        <Text style={{ fontSize: 18, marginRight: 8, marginBottom: compact ? 0 : 2 }}>✨</Text>
        <TextInput
          style={{ flex: 1, color: '#1a1a1a', fontSize: 15, maxHeight: 100, minHeight: 24, textAlign: 'left', writingDirection: 'ltr' }}
          placeholder={`Describe the ${activeTab} you're looking for...`}
          placeholderTextColor="#a3a3a3"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={200}
          returnKeyType="send"
          blurOnSubmit
          onSubmitEditing={handleSubmit}
        />
        {text.length > 0 && (
          <TouchableOpacity
            onPress={() => { setText(''); onClear?.(); }}
            style={{ marginRight: 4 }}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#9ca3af', fontSize: 22 }}>×</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={text.trim().length < 5 || loading}
          style={{ marginLeft: 8, backgroundColor: '#6f45ff', width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', opacity: text.trim().length < 5 || loading ? 0.35 : 1 }}
          activeOpacity={0.75}
        >
          <Text style={{ color: '#fff', fontSize: 16 }}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Char counter */}
      {text.length > 0 && (
        <Text style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right', marginRight: 20, marginTop: 4 }}>
          {text.length}/200
        </Text>
      )}

      {/* Example prompts */}
      {text.length === 0 && !compact && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, gap: 8, flexDirection: 'row' }}
        >
          {examples.map((example) => (
            <TouchableOpacity
              key={example}
              onPress={() => { setText(example); onSubmit(example); }}
              style={{ backgroundColor: '#f0ecff', borderWidth: 1, borderColor: '#ddd6fe', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#6f45ff', fontSize: 12, fontWeight: '500' }}>{example}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
