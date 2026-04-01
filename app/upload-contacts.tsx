import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Contacts from 'expo-contacts';
import { FlashList } from '@shopify/flash-list';
import { useUploadContacts } from '../src/hooks/useUploadContacts';
import { PhoneContactForUpload } from '../src/api/csvUpload';

interface DeviceContact {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  displayName: string;
  phone?: string;
  email?: string;
}

function sanitizeName(s?: string | null): string {
  if (!s) return '';
  const t = s.trim();
  // Samsung keeps soft-deleted contacts with literal "null" / "undefined" strings
  if (t.toLowerCase() === 'null' || t.toLowerCase() === 'undefined') return '';
  return t;
}

function buildDisplayName(c: Contacts.Contact): string {
  const first = sanitizeName(c.firstName);
  const last = sanitizeName(c.lastName);
  const full = [first, last].filter(Boolean).join(' ');
  return full || sanitizeName(c.company) || sanitizeName(c.name) || '';
}

function ContactRow({
  contact,
  selected,
  onToggle,
}: {
  contact: DeviceContact;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.rowSelected]}
      onPress={() => onToggle(contact.id)}
      activeOpacity={0.75}
    >
      {/* Checkbox */}
      <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </View>

      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(contact.firstName[0] || contact.displayName[0] || '?').toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {contact.displayName}
        </Text>
        {(contact.company || contact.title) ? (
          <Text style={styles.rowSub} numberOfLines={1}>
            {[contact.title, contact.company].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

type ScreenState = 'loading' | 'permission_denied' | 'ready' | 'uploading' | 'success';

export default function UploadContactsScreen() {
  const insets = useSafeAreaInsets();
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [allContacts, setAllContacts] = useState<DeviceContact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const uploadMutation = useUploadContacts();

  // Load device contacts on mount
  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setScreenState('permission_denied');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.Company,
          Contacts.Fields.JobTitle,
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
        sort: Contacts.SortTypes.FirstName,
      });

      let mapped: DeviceContact[] = data
        .filter((c) => c.id)
        .map((c) => ({
          id: c.id!,
          firstName: sanitizeName(c.firstName),
          lastName: sanitizeName(c.lastName),
          company: sanitizeName(c.company),
          title: sanitizeName(c.jobTitle),
          displayName: buildDisplayName(c),
          phone: c.phoneNumbers?.[0]?.number ?? undefined,
          email: c.emails?.[0]?.email ?? undefined,
        }))
        .filter((c) => c.displayName.length > 0);

      // Inject mock contacts in dev mode when device has none (e.g. emulator)
      if (__DEV__ && mapped.length === 0) {
        mapped = [
          { id: 'mock-1', firstName: 'John', lastName: 'Smith', company: 'Acme Corp', title: 'VP Sales', displayName: 'John Smith' },
          { id: 'mock-2', firstName: 'Sarah', lastName: 'Johnson', company: 'TechStart', title: 'CTO', displayName: 'Sarah Johnson' },
        ];
      }

      setAllContacts(mapped);
      setScreenState('ready');
    })();
  }, []);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return allContacts;
    const q = search.toLowerCase();
    return allContacts.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q),
    );
  }, [allContacts, search]);

  const toggleContact = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
    }
  }, [filteredContacts, selectedIds.size]);

  const handleUpload = useCallback(async () => {
    const selected = allContacts.filter((c) => selectedIds.has(c.id));
    if (selected.length === 0) {
      Alert.alert('No contacts selected', 'Please select at least one contact to upload.');
      return;
    }

    const payload: PhoneContactForUpload[] = selected.map((c) => ({
      fullName: c.displayName,
      company: c.company,
      email: c.email,
    }));

    setScreenState('uploading');
    uploadMutation.mutate(payload, {
      onSuccess: () => {
        setScreenState('success');
      },
      onError: (err) => {
        setScreenState('ready');
        Alert.alert(
          'Upload failed',
          err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        );
      },
    });
  }, [allContacts, selectedIds, uploadMutation]);

  const selectedCount = selectedIds.size;
  const allVisibleSelected =
    filteredContacts.length > 0 && filteredContacts.every((c) => selectedIds.has(c.id));

  // ── Render states ──────────────────────────────────────────────────────────

  if (screenState === 'loading') {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#6f45ff" />
        <Text style={styles.loadingText}>Loading contacts…</Text>
      </SafeAreaView>
    );
  }

  if (screenState === 'permission_denied') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🔒</Text>
        <Text style={styles.emptyTitle}>Contacts permission required</Text>
        <Text style={styles.emptySub}>
          Please allow Lusha ToGo to access your contacts in Settings.
        </Text>
        <TouchableOpacity style={[styles.uploadBtn, styles.doneBtn]} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.uploadBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (screenState === 'uploading') {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#6f45ff" />
        <Text style={styles.loadingText}>Uploading {selectedCount} contacts…</Text>
        <Text style={[styles.emptySub, { marginTop: 6 }]}>This may take a moment</Text>
      </SafeAreaView>
    );
  }

  if (screenState === 'success') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ fontSize: 56, marginBottom: 12 }}>✅</Text>
        <Text style={styles.emptyTitle}>Upload complete!</Text>
        <Text style={styles.successSub}>
          {selectedCount} contact{selectedCount !== 1 ? 's' : ''} sent to Lusha for enrichment.
          {'\n'}Check your new list for results.
        </Text>
        <TouchableOpacity
          style={[styles.uploadBtn, styles.doneBtn]}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Text style={styles.uploadBtnText}>Done</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Main contact picker ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f7' }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={8}>
          <Text style={styles.headerBtnText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Contacts</Text>
        <TouchableOpacity onPress={selectAll} style={styles.headerBtn} hitSlop={8}>
          <Text style={styles.headerBtnText}>
            {allVisibleSelected ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts…"
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
      </View>

      {/* Count bar */}
      <View style={styles.countBar}>
        <Text style={styles.countBarText}>
          {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
          {search ? ' matching' : ''}
        </Text>
        {selectedCount > 0 && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>{selectedCount} selected</Text>
          </View>
        )}
      </View>

      {/* Contact list */}
      {filteredContacts.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No contacts found</Text>
          {search ? (
            <Text style={styles.emptySub}>Try a different search term.</Text>
          ) : (
            <Text style={styles.emptySub}>No contacts available on this device.</Text>
          )}
        </View>
      ) : (
        <FlashList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          estimatedItemSize={68}
          renderItem={({ item }) => (
            <ContactRow
              contact={item}
              selected={selectedIds.has(item.id)}
              onToggle={toggleContact}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Upload button */}
      {selectedCount > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={handleUpload}
            activeOpacity={0.85}
          >
            <Text style={styles.uploadBtnText}>
              Upload {selectedCount} contact{selectedCount !== 1 ? 's' : ''} to Lusha →
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  successSub: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  doneBtn: {
    alignSelf: 'stretch',
    marginTop: 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerBtn: {
    minWidth: 72,
  },
  headerBtnText: {
    fontSize: 14,
    color: '#6f45ff',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },

  // Count bar
  countBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  countBarText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  selectedBadge: {
    backgroundColor: '#f0ecff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  selectedBadgeText: {
    fontSize: 12,
    color: '#6f45ff',
    fontWeight: '600',
  },

  // Contact row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  rowSelected: {
    backgroundColor: '#faf8ff',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#6f45ff',
    borderColor: '#6f45ff',
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 15,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f0ecff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6f45ff',
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  rowSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },

  // Bottom bar / upload button
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: '#f5f5f7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  uploadBtn: {
    backgroundColor: '#6f45ff',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#6f45ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
