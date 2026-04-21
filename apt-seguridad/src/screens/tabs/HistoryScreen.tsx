import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../styles/Colors';
import { listConsultations } from '../../services/consultationService';
import { ConsultaSummary, RiskLevel, ANALYSIS_OPTIONS } from '../../types/consultation';

const RISK_COLOR: Record<RiskLevel, string> = {
  alto:  '#DC2626',
  medio: '#D97706',
  bajo:  '#059669',
};

const RISK_BG: Record<RiskLevel, string> = {
  alto:  '#FEF2F2',
  medio: '#FFFBEB',
  bajo:  '#F0FDF4',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ConsultaCard({ item }: Readonly<{ item: ConsultaSummary }>) {
  const option   = ANALYSIS_OPTIONS.find((o) => o.id === item.option_id);
  const riskColor = RISK_COLOR[item.overall_risk] ?? '#64748B';
  const riskBg    = RISK_BG[item.overall_risk]    ?? '#F8FAFC';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBg, { backgroundColor: (option?.color ?? colors.secondary) + '18' }]}>
          <Ionicons name={(option?.icon ?? 'analytics-outline') as any} size={20} color={option?.color ?? colors.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{option?.title ?? `Opción ${item.option_id}`}</Text>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={[styles.riskBadge, { backgroundColor: riskBg }]}>
          <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
          <Text style={[styles.riskText, { color: riskColor }]}>
            {item.overall_risk.charAt(0).toUpperCase() + item.overall_risk.slice(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.cardSummary} numberOfLines={3}>{item.summary}</Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>Sin análisis aún</Text>
      <Text style={styles.emptySubtitle}>
        Realiza tu primer análisis desde la pestaña Análisis
      </Text>
    </View>
  );
}

export default function HistoryScreen() {
  const [data, setData]         = useState<ConsultaSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const list = await listConsultations();
      setData(list ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'No se pudo cargar el historial.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Historial</Text>
        <Text style={styles.subheading}>
          {data.length} {data.length === 1 ? 'análisis' : 'análisis realizados'}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConsultaCard item={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.secondary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  header:     { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  heading:    { fontSize: 24, fontWeight: '700', color: colors.primary },
  subheading: { fontSize: 13, color: '#64748B', marginTop: 2 },

  list: { paddingHorizontal: 20, paddingBottom: 20 },

  card: {
    backgroundColor: colors.white, borderRadius: 14, padding: 14, marginBottom: 12,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }),
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  iconBg:      { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle:   { fontSize: 14, fontWeight: '700', color: colors.primary },
  cardDate:    { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  riskBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  riskDot:     { width: 7, height: 7, borderRadius: 4 },
  riskText:    { fontSize: 12, fontWeight: '700' },
  cardSummary: { fontSize: 13, color: '#475569', lineHeight: 20 },

  empty:         { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: colors.primary },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 4, paddingHorizontal: 30 },

  errorBox:  { margin: 20, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16, alignItems: 'center', gap: 8 },
  errorText: { fontSize: 14, color: colors.danger, textAlign: 'center' },
  retryText: { fontSize: 14, fontWeight: '700', color: colors.secondary },
});
