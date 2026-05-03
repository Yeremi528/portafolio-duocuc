import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, LayoutAnimation,
  UIManager, Linking,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../styles/Colors';
import { listConsultations } from '../../services/consultationService';
import {
  ConsultaSummary, RiskLevel, Severity, Priority,
  ANALYSIS_OPTIONS,
} from '../../types/consultation';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── constants ──────────────────────────────────────────────────────────────

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
const SEV_COLOR: Record<Severity, string> = {
  alta:  '#DC2626',
  media: '#D97706',
  baja:  '#059669',
};
const PRIORITY_LABEL: Record<Priority, string> = {
  inmediata:   'Inmediata',
  corto_plazo: 'Corto plazo',
  largo_plazo: 'Largo plazo',
};
const PRIORITY_COLOR: Record<Priority, string> = {
  inmediata:   '#DC2626',
  corto_plazo: '#D97706',
  largo_plazo: '#059669',
};

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildSodimacURL(term: string) {
  return `https://www.sodimac.cl/sodimac-cl/search?Ntt=${encodeURIComponent(term)}`;
}
function buildMLURL(term: string) {
  return `https://listado.mercadolibre.cl/${encodeURIComponent(term)}`;
}

// ─── sub-components ─────────────────────────────────────────────────────────

function SectionTitle({ icon, label, count }: { icon: string; label: string; count?: number }) {
  return (
    <View style={s.secTitleRow}>
      <Ionicons name={icon as any} size={15} color={colors.secondary} />
      <Text style={s.secTitle}>{label}{count !== undefined ? ` (${count})` : ''}</Text>
    </View>
  );
}

function ConsultaCard({ item }: Readonly<{ item: ConsultaSummary }>) {
  const [expanded, setExpanded] = useState(false);
  const option    = ANALYSIS_OPTIONS.find((o) => o.id === item.option_id);
  const riskColor = RISK_COLOR[item.overall_risk] ?? '#64748B';
  const riskBg    = RISK_BG[item.overall_risk]    ?? '#F8FAFC';
  const priority  = item.priority as Priority;

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  }

  return (
    <View style={s.card}>
      {/* ── Header ── */}
      <TouchableOpacity style={s.cardHeader} onPress={toggle} activeOpacity={0.8}>
        <View style={[s.iconBg, { backgroundColor: (option?.color ?? colors.secondary) + '18' }]}>
          <Ionicons name={(option?.icon ?? 'analytics-outline') as any} size={20} color={option?.color ?? colors.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{option?.title ?? `Opción ${item.option_id}`}</Text>
          <Text style={s.cardDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={[s.riskBadge, { backgroundColor: riskBg }]}>
            <View style={[s.riskDot, { backgroundColor: riskColor }]} />
            <Text style={[s.riskText, { color: riskColor }]}>
              {item.overall_risk.charAt(0).toUpperCase() + item.overall_risk.slice(1)}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16} color="#94A3B8"
          />
        </View>
      </TouchableOpacity>

      {/* ── Summary + priority ── */}
      <Text style={s.cardSummary} numberOfLines={expanded ? undefined : 3}>{item.summary}</Text>

      {item.priority && (
        <View style={[s.priorityBadge, { backgroundColor: (PRIORITY_COLOR[priority] ?? '#64748B') + '18' }]}>
          <Ionicons name="time-outline" size={13} color={PRIORITY_COLOR[priority] ?? '#64748B'} />
          <Text style={[s.priorityText, { color: PRIORITY_COLOR[priority] ?? '#64748B' }]}>
            Prioridad {PRIORITY_LABEL[priority] ?? item.priority}
          </Text>
        </View>
      )}

      {/* ── Expanded detail ── */}
      {expanded && (
        <View style={s.detail}>

          {/* Vulnerabilidades */}
          {item.vulnerabilities?.length > 0 && (
            <View style={s.section}>
              <SectionTitle icon="warning-outline" label="Vulnerabilidades" count={item.vulnerabilities.length} />
              {item.vulnerabilities.map((v, i) => (
                <View key={i} style={s.vulnItem}>
                  <View style={s.vulnHeader}>
                    <Text style={s.vulnArea}>{v.area}</Text>
                    <View style={[s.sevBadge, { backgroundColor: SEV_COLOR[v.severity as Severity] + '20' }]}>
                      <Text style={[s.sevText, { color: SEV_COLOR[v.severity as Severity] }]}>
                        {v.severity.charAt(0).toUpperCase() + v.severity.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.vulnDesc}>{v.description}</Text>
                  {i < item.vulnerabilities.length - 1 && <View style={s.divider} />}
                </View>
              ))}
            </View>
          )}

          {/* Recomendaciones */}
          {item.recommendations?.length > 0 && (
            <View style={s.section}>
              <SectionTitle icon="checkmark-circle-outline" label="Recomendaciones" count={item.recommendations.length} />
              {item.recommendations.map((rec, i) => (
                <View key={i} style={s.recItem}>
                  <View style={s.recHeader}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
                    <Text style={s.recAction}>{rec.action}</Text>
                  </View>
                  <Text style={s.recDesc}>{rec.description}</Text>
                  <View style={s.recFooter}>
                    <View style={s.catBadge}>
                      <Text style={s.catText}>{rec.category}</Text>
                    </View>
                    <View style={s.buyRow}>
                      <TouchableOpacity
                        style={s.buyBtn}
                        onPress={() => Linking.openURL(buildSodimacURL(rec.action))}
                      >
                        <Ionicons name="storefront-outline" size={13} color="#fff" />
                        <Text style={s.buyBtnText}>Sodimac</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.buyBtn, { backgroundColor: '#FFE600' }]}
                        onPress={() => Linking.openURL(buildMLURL(rec.action))}
                      >
                        <Ionicons name="cart-outline" size={13} color="#333" />
                        <Text style={[s.buyBtnText, { color: '#333' }]}>MercadoLibre</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {i < item.recommendations.length - 1 && <View style={s.divider} />}
                </View>
              ))}
            </View>
          )}

          {/* Seguros */}
          {item.insurance_suggestions?.length > 0 && (
            <View style={s.section}>
              <SectionTitle icon="umbrella-outline" label="Seguros Recomendados" />
              {item.insurance_suggestions.map((ins, i) => (
                <View key={i} style={s.insItem}>
                  <Text style={s.insType}>{ins.type}</Text>
                  <Text style={s.insDesc}>{ins.description}</Text>
                  <View style={s.benefitRow}>
                    <Ionicons name="star-outline" size={12} color="#D97706" />
                    <Text style={s.benefitText}>{ins.benefit}</Text>
                  </View>
                  {i < item.insurance_suggestions.length - 1 && <View style={s.divider} />}
                </View>
              ))}
            </View>
          )}

          {/* Costo estimado */}
          {item.estimated_cost && (
            <View style={s.section}>
              <SectionTitle icon="cash-outline" label="Costo Estimado" />
              <View style={s.costRow}>
                <Ionicons name="cash-outline" size={20} color="#059669" />
                <Text style={s.costAmount}>
                  ${item.estimated_cost.min_clp.toLocaleString('es-CL')} – ${item.estimated_cost.max_clp.toLocaleString('es-CL')} CLP
                </Text>
              </View>
              {item.estimated_cost.note ? (
                <Text style={s.costNote}>{item.estimated_cost.note}</Text>
              ) : null}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={s.empty}>
      <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
      <Text style={s.emptyTitle}>Sin análisis aún</Text>
      <Text style={s.emptySubtitle}>
        Realiza tu primer análisis desde la pestaña Análisis
      </Text>
    </View>
  );
}

// ─── screen ─────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const [data, setData]             = useState<ConsultaSummary[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

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
      <View style={s.centered}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.heading}>Historial</Text>
        <Text style={s.subheading}>
          {data.length} {data.length === 1 ? 'análisis' : 'análisis realizados'}
        </Text>
      </View>

      {error ? (
        <View style={s.errorBox}>
          <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load()}>
            <Text style={s.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConsultaCard item={item} />}
          contentContainerStyle={s.list}
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

// ─── styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  header:     { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  heading:    { fontSize: 24, fontWeight: '700', color: colors.primary },
  subheading: { fontSize: 13, color: '#64748B', marginTop: 2 },

  list: { paddingHorizontal: 20, paddingBottom: 20 },

  card: {
    backgroundColor: colors.white, borderRadius: 14, padding: 14, marginBottom: 12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  iconBg:      { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle:   { fontSize: 14, fontWeight: '700', color: colors.primary },
  cardDate:    { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  riskBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  riskDot:     { width: 7, height: 7, borderRadius: 4 },
  riskText:    { fontSize: 12, fontWeight: '700' },
  cardSummary: { fontSize: 13, color: '#475569', lineHeight: 20 },

  priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 8 },
  priorityText:  { fontSize: 11, fontWeight: '600' },

  detail:  { marginTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 14, gap: 14 },
  section: { gap: 8 },

  secTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  secTitle:    { fontSize: 13, fontWeight: '700', color: colors.primary },

  vulnItem:   { gap: 4 },
  vulnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vulnArea:   { fontSize: 13, fontWeight: '600', color: colors.primary, flex: 1 },
  sevBadge:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  sevText:    { fontSize: 11, fontWeight: '700' },
  vulnDesc:   { fontSize: 12, color: '#475569', lineHeight: 18 },
  divider:    { height: 1, backgroundColor: '#F1F5F9', marginVertical: 6 },

  recItem:   { gap: 4 },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recAction: { fontSize: 13, fontWeight: '600', color: colors.primary, flex: 1 },
  recDesc:   { fontSize: 12, color: '#475569', lineHeight: 18 },
  recFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  catBadge:  { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catText:   { fontSize: 11, fontWeight: '600', color: colors.secondary },
  buyRow:    { flexDirection: 'row', gap: 6 },
  buyBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8340A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  buyBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  insItem:    { gap: 4 },
  insType:    { fontSize: 13, fontWeight: '600', color: colors.primary },
  insDesc:    { fontSize: 12, color: '#475569', lineHeight: 18 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  benefitText: { fontSize: 12, color: '#D97706', fontWeight: '500' },

  costRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  costAmount: { fontSize: 15, fontWeight: '700', color: '#059669' },
  costNote:   { fontSize: 12, color: '#64748B', marginTop: 4 },

  empty:         { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: colors.primary },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 4, paddingHorizontal: 30 },

  errorBox:  { margin: 20, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16, alignItems: 'center', gap: 8 },
  errorText: { fontSize: 14, color: colors.danger, textAlign: 'center' },
  retryText: { fontSize: 14, fontWeight: '700', color: colors.secondary },
});
