import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../styles/Colors';
import { getRiskStats } from '../../services/risksService';
import { Risk, RiskStats } from '../../types/consultation';

const POPULAR_COMMUNES = [
  'Santiago', 'Maipú', 'Puente Alto', 'Las Condes',
  'Ñuñoa', 'La Florida', 'San Miguel', 'Providencia',
];

function probColor(p: number): string {
  if (p >= 0.5) return '#DC2626';
  if (p >= 0.25) return '#D97706';
  return '#059669';
}

function RiskBar({ prob }: Readonly<{ prob: number }>) {
  const pct   = Math.round(prob * 100);
  const color = probColor(prob);
  return (
    <View style={styles.barWrapper}>
      <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function RiskItem({ risk, index }: Readonly<{ risk: Risk; index: number }>) {
  const color = probColor(risk.probabilidad);
  const pct   = Math.round(risk.probabilidad * 100);
  return (
    <View style={styles.riskRow}>
      <View style={styles.riskMeta}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.crimeType}>{risk.tipo_delito}</Text>
          <Text style={[styles.probPct, { color }]}>{pct}%</Text>
        </View>
        <RiskBar prob={risk.probabilidad} />
        <Text style={styles.crimeDesc} numberOfLines={2}>{risk.descripcion}</Text>
      </View>
      {index === 0 && (
        <View style={styles.topBadge}>
          <Ionicons name="trending-up" size={12} color="#DC2626" />
          <Text style={styles.topBadgeText}>Mayor riesgo</Text>
        </View>
      )}
    </View>
  );
}

export default function RisksScreen() {
  const [query, setQuery]     = useState('');
  const [stats, setStats]     = useState<RiskStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function search(commune: string) {
    if (!commune.trim()) return;
    setLoading(true);
    setError(null);
    setStats(null);
    try {
      const result = await getRiskStats(commune.trim());
      setStats(result);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'No se encontró información para esa comuna.');
    } finally {
      setLoading(false);
    }
  }

  const sortedRisks = stats?.risks
    ? [...stats.risks].sort((a, b) => b.probabilidad - a.probabilidad)
    : [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Riesgos por Comuna</Text>
          <Text style={styles.subheading}>Probabilidad de delitos en tu zona</Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <Ionicons name="location-outline" size={18} color="#94A3B8" style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ej: Maipú, Las Condes..."
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => search(query)}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={() => search(query)}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="search" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>

          {/* Quick commune chips */}
          <View style={styles.chipsRow}>
            {POPULAR_COMMUNES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, query === c && styles.chipActive]}
                onPress={() => { setQuery(c); search(c); }}
              >
                <Text style={[styles.chipText, query === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Results */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {stats && (
          <FlatList
            data={sortedRisks}
            keyExtractor={(_, i) => i.toString()}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.resultHeader}>
                <Ionicons name="location" size={16} color={colors.secondary} />
                <Text style={styles.resultComune}>{stats.commune}</Text>
                <Text style={styles.resultCount}>{sortedRisks.length} tipos de delito</Text>
              </View>
            }
            renderItem={({ item, index }) => <RiskItem risk={item} index={index} />}
          />
        )}

        {!stats && !loading && !error && (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Consulta tu zona</Text>
            <Text style={styles.emptySubtitle}>
              Ingresa el nombre de tu comuna para ver las estadísticas de seguridad
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.background },
  header:      { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  heading:     { fontSize: 24, fontWeight: '700', color: colors.primary },
  subheading:  { fontSize: 13, color: '#64748B', marginTop: 2 },

  searchSection: { paddingHorizontal: 20, paddingBottom: 8 },
  searchRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', overflow: 'hidden', marginBottom: 10 },
  searchInput:   { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 14, color: colors.primary },
  searchBtn:     { backgroundColor: colors.secondary, paddingHorizontal: 16, paddingVertical: 12 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:         { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: '#E2E8F0' },
  chipActive:   { backgroundColor: colors.secondary, borderColor: colors.secondary },
  chipText:     { fontSize: 12, color: '#64748B', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  listContent:   { paddingHorizontal: 20, paddingBottom: 20 },
  resultHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, marginTop: 4 },
  resultComune:  { fontSize: 16, fontWeight: '700', color: colors.primary, flex: 1 },
  resultCount:   { fontSize: 12, color: '#94A3B8' },

  riskRow:    { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 10, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
  riskMeta:   {},
  crimeType:  { fontSize: 14, fontWeight: '700', color: colors.primary, flex: 1 },
  probPct:    { fontSize: 14, fontWeight: '700' },
  barWrapper: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginVertical: 8, overflow: 'hidden' },
  barFill:    { height: '100%', borderRadius: 3 },
  crimeDesc:  { fontSize: 12, color: '#64748B', lineHeight: 18 },

  topBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  topBadgeText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },

  errorBox:  { margin: 20, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { flex: 1, fontSize: 13, color: colors.danger },

  emptyState:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 40, paddingTop: 40 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: colors.primary },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});
