import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, Alert, ActivityIndicator, Platform, Linking,
} from 'react-native';
import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../../context/authContext';
import { colors } from '../../styles/Colors';
import { uploadImage, analyzeImage } from '../../services/consultationService';
import {
  ANALYSIS_OPTIONS, AnalysisOption, SecurityAnalysis,
  RiskLevel, Severity,
} from '../../types/consultation';

// ─── helpers ───────────────────────────────────────────────────────────────

const RISK_COLOR: Record<RiskLevel, string> = {
  alto:  '#DC2626',
  medio: '#D97706',
  bajo:  '#059669',
};

const SEV_COLOR: Record<Severity, string> = {
  alta:  '#DC2626',
  media: '#D97706',
  baja:  '#059669',
};

const PRIORITY_LABEL: Record<string, string> = {
  inmediata:    'Inmediata',
  corto_plazo:  'Corto plazo',
  largo_plazo:  'Largo plazo',
};

// ─── sub-components ────────────────────────────────────────────────────────

function OptionCard({
  option, selected, onPress,
}: { option: AnalysisOption; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.optionCard, selected && { borderColor: option.color, backgroundColor: option.color + '10' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.optionIconBg, { backgroundColor: option.color + '18' }]}>
        <Ionicons name={option.icon as any} size={26} color={option.color} />
      </View>
      <Text style={[styles.optionTitle, selected && { color: option.color }]} numberOfLines={2}>
        {option.title}
      </Text>
      <Text style={styles.optionDesc} numberOfLines={3}>{option.description}</Text>
      {selected && (
        <View style={[styles.optionCheck, { backgroundColor: option.color }]}>
          <Ionicons name="checkmark" size={12} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <View style={[styles.riskBadge, { backgroundColor: RISK_COLOR[level] + '18' }]}>
      <View style={[styles.riskDot, { backgroundColor: RISK_COLOR[level] }]} />
      <Text style={[styles.riskText, { color: RISK_COLOR[level] }]}>
        Riesgo {level.charAt(0).toUpperCase() + level.slice(1)}
      </Text>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionCardTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── main screen ───────────────────────────────────────────────────────────

export default function AnalysisScreen() {
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [imageUri, setImageUri]             = useState<string | null>(null);
  const [budget, setBudget]                 = useState('');
  const [isLoading, setIsLoading]           = useState(false);
  const [result, setResult]                 = useState<SecurityAnalysis | null>(null);

  const firstName = user?.name?.split(' ')[0] ?? 'Usuario';
  const canAnalyze = selectedOption !== null && imageUri !== null && !isLoading;

  // ── image picker ──────────────────────────────────────────────────────────

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Debes permitir acceso a la galería.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85 });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Debes permitir acceso a la cámara.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  }

  // ── analyze ───────────────────────────────────────────────────────────────

  async function handleAnalyze() {
    if (!canAnalyze) return;
    setIsLoading(true);
    setResult(null);
    try {
      const imagePath = await uploadImage(imageUri!);
      const budgetNum = budget.trim() ? parseFloat(budget.replace(/\./g, '').replace(',', '.')) : null;
      const analysis = await analyzeImage({
        image_path: imagePath,
        option_id:  selectedOption!,
        budget:     budgetNum,
      });
      setResult(analysis);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    } catch (err: any) {
      Alert.alert(
        'Error en el análisis',
        err?.response?.data?.error ?? err?.message ?? 'Intenta de nuevo.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>¡Hola, {firstName}! 👋</Text>
        <Text style={styles.subtitle}>Analiza la seguridad de tu hogar con IA</Text>
      </View>

      {/* Step 1 – Option selector */}
      <View style={styles.section}>
        <Text style={styles.stepLabel}>
          <Text style={styles.stepNumber}>1</Text>  Tipo de análisis
        </Text>
        <View style={styles.optionsGrid}>
          {ANALYSIS_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.id}
              option={opt}
              selected={selectedOption === opt.id}
              onPress={() => setSelectedOption(opt.id)}
            />
          ))}
        </View>
      </View>

      {/* Step 2 – Image */}
      <View style={styles.section}>
        <Text style={styles.stepLabel}>
          <Text style={styles.stepNumber}>2</Text>  Imagen del hogar
        </Text>
        <View style={styles.imagePreview}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImg} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="home-outline" size={48} color="#CBD5E1" />
              <Text style={styles.imagePlaceholderText}>Sin imagen seleccionada</Text>
            </View>
          )}
        </View>
        <View style={styles.pickerRow}>
          <TouchableOpacity style={styles.pickerBtn} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={20} color={colors.primary} />
            <Text style={styles.pickerBtnText}>Cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerBtn} onPress={pickFromGallery}>
            <Ionicons name="images-outline" size={20} color={colors.primary} />
            <Text style={styles.pickerBtnText}>Galería</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Step 3 – Budget (optional) */}
      <View style={styles.section}>
        <Text style={styles.stepLabel}>
          <Text style={styles.stepNumber}>3</Text>  Presupuesto{' '}
          <Text style={styles.optional}>(opcional)</Text>
        </Text>
        <View style={styles.budgetRow}>
          <Text style={styles.currencyLabel}>$</Text>
          <TextInput
            style={styles.budgetInput}
            placeholder="0"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={budget}
            onChangeText={setBudget}
          />
          <Text style={styles.currencyLabel}>CLP</Text>
        </View>
      </View>

      {/* Analyze button */}
      <TouchableOpacity
        style={[styles.analyzeBtn, !canAnalyze && styles.analyzeBtnDisabled]}
        onPress={handleAnalyze}
        disabled={!canAnalyze}
        activeOpacity={0.85}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="sparkles-outline" size={20} color="#fff" />
            <Text style={styles.analyzeBtnText}>Analizar con IA</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Results */}
      {result && <AnalysisResult result={result} optionId={selectedOption!} />}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── results component ─────────────────────────────────────────────────────

function AnalysisResult({ result, optionId }: { result: SecurityAnalysis; optionId: number }) {
  const optionName = ANALYSIS_OPTIONS.find((o) => o.id === optionId)?.title ?? '';

  return (
    <View style={styles.resultsWrapper}>
      <View style={styles.resultsDivider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Resultado</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Summary card */}
      <SectionCard title={optionName}>
        <RiskBadge level={result.overall_risk} />
        <Text style={styles.summaryText}>{result.summary}</Text>
        <View style={styles.priorityRow}>
          <Ionicons name="time-outline" size={14} color="#64748B" />
          <Text style={styles.priorityText}>
            Prioridad: {PRIORITY_LABEL[result.priority] ?? result.priority}
          </Text>
        </View>
      </SectionCard>

      {/* Vulnerabilities */}
      {result.vulnerabilities?.length > 0 && (
        <SectionCard title={`Vulnerabilidades (${result.vulnerabilities.length})`}>
          {result.vulnerabilities.map((v, i) => (
            <View key={i} style={styles.vulnItem}>
              <View style={styles.vulnHeader}>
                <Text style={styles.vulnArea}>{v.area}</Text>
                <View style={[styles.sevBadge, { backgroundColor: SEV_COLOR[v.severity] + '20' }]}>
                  <Text style={[styles.sevText, { color: SEV_COLOR[v.severity] }]}>
                    {v.severity.charAt(0).toUpperCase() + v.severity.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.vulnDesc}>{v.description}</Text>
              {i < result.vulnerabilities.length - 1 && <View style={styles.itemDivider} />}
            </View>
          ))}
        </SectionCard>
      )}

      {/* Recommendations */}
      {result.recommendations?.length > 0 && (
        <SectionCard title="Recomendaciones">
          {result.recommendations.map((rec, i) => (
            <View key={i} style={styles.recItem}>
              <View style={styles.recHeader}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#059669" />
                <Text style={styles.recAction}>{rec.action}</Text>
              </View>
              <Text style={styles.recDesc}>{rec.description}</Text>
              <View style={styles.recFooter}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{rec.category}</Text>
                </View>
                <View style={styles.buyRow}>
                  <TouchableOpacity
                    style={styles.buyBtn}
                    onPress={() => Linking.openURL(`https://www.sodimac.cl/sodimac-cl/search?Ntt=${encodeURIComponent(rec.action)}`)}
                  >
                    <Ionicons name="storefront-outline" size={12} color="#fff" />
                    <Text style={styles.buyBtnText}>Sodimac</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.buyBtn, styles.buyBtnML]}
                    onPress={() => Linking.openURL(`https://listado.mercadolibre.cl/${encodeURIComponent(rec.action)}`)}
                  >
                    <Ionicons name="cart-outline" size={12} color="#333" />
                    <Text style={[styles.buyBtnText, { color: '#333' }]}>MercadoLibre</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {i < result.recommendations.length - 1 && <View style={styles.itemDivider} />}
            </View>
          ))}
        </SectionCard>
      )}

      {/* Insurance suggestions */}
      {result.insurance_suggestions?.length > 0 && (
        <SectionCard title="Seguros Recomendados">
          {result.insurance_suggestions.map((ins, i) => (
            <View key={i} style={styles.insItem}>
              <View style={styles.insHeader}>
                <Ionicons name="umbrella-outline" size={18} color={colors.secondary} />
                <Text style={styles.insType}>{ins.type}</Text>
              </View>
              <Text style={styles.insDesc}>{ins.description}</Text>
              <View style={styles.benefitRow}>
                <Ionicons name="star-outline" size={13} color="#D97706" />
                <Text style={styles.benefitText}>{ins.benefit}</Text>
              </View>
              {i < result.insurance_suggestions.length - 1 && <View style={styles.itemDivider} />}
            </View>
          ))}
        </SectionCard>
      )}

      {/* Estimated cost */}
      {result.estimated_cost && (
        <SectionCard title="Costo Estimado">
          <View style={styles.costRow}>
            <Ionicons name="cash-outline" size={22} color="#059669" />
            <Text style={styles.costAmount}>
              ${result.estimated_cost.min_clp.toLocaleString('es-CL')} –{' '}
              ${result.estimated_cost.max_clp.toLocaleString('es-CL')} CLP
            </Text>
          </View>
          {result.estimated_cost.note ? (
            <Text style={styles.costNote}>{result.estimated_cost.note}</Text>
          ) : null}
        </SectionCard>
      )}
    </View>
  );
}

// ─── styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: colors.background },
  content:  { padding: 20 },

  header:    { marginBottom: 24 },
  greeting:  { fontSize: 24, fontWeight: '700', color: colors.primary },
  subtitle:  { fontSize: 14, color: colors.text, marginTop: 4, opacity: 0.7 },

  section:     { marginBottom: 20 },
  stepLabel:   { fontSize: 15, fontWeight: '600', color: colors.primary, marginBottom: 12 },
  stepNumber:  { color: colors.secondary, fontWeight: '700' },
  optional:    { fontSize: 13, color: '#94A3B8', fontWeight: '400' },

  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionCard:  {
    width: '48%', backgroundColor: colors.white,
    borderRadius: 14, padding: 14, borderWidth: 2, borderColor: '#E2E8F0',
    position: 'relative',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }),
  },
  optionIconBg:   { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  optionTitle:    { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  optionDesc:     { fontSize: 11, color: '#64748B', lineHeight: 16 },
  optionCheck:    { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  imagePreview:       { height: 200, borderRadius: 14, overflow: 'hidden', marginBottom: 10, backgroundColor: '#F1F5F9' },
  previewImg:         { width: '100%', height: '100%' },
  imagePlaceholder:   { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  imagePlaceholderText: { fontSize: 13, color: '#94A3B8' },

  pickerRow:    { flexDirection: 'row', gap: 10 },
  pickerBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 10, paddingVertical: 10 },
  pickerBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },

  budgetRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currencyLabel: { fontSize: 16, fontWeight: '700', color: colors.primary },
  budgetInput:   { flex: 1, backgroundColor: colors.white, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, fontSize: 16, color: colors.primary },

  analyzeBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, marginTop: 4 },
  analyzeBtnDisabled: { opacity: 0.45 },
  analyzeBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },

  resultsWrapper: { marginTop: 28 },
  resultsDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText:    { fontSize: 12, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },

  sectionCard:       { backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 12, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
  sectionCardTitle:  { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: 12 },

  riskBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginBottom: 10 },
  riskDot:   { width: 8, height: 8, borderRadius: 4 },
  riskText:  { fontSize: 13, fontWeight: '700' },

  summaryText:  { fontSize: 14, color: '#334155', lineHeight: 21 },
  priorityRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  priorityText: { fontSize: 12, color: '#64748B' },

  vulnItem:   { paddingVertical: 8 },
  vulnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  vulnArea:   { fontSize: 13, fontWeight: '600', color: colors.primary, flex: 1 },
  sevBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sevText:    { fontSize: 11, fontWeight: '700' },
  vulnDesc:   { fontSize: 13, color: '#475569', lineHeight: 19 },
  itemDivider: { height: 1, backgroundColor: '#F1F5F9', marginTop: 8 },

  recItem:    { paddingVertical: 8 },
  recHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  recAction:  { fontSize: 13, fontWeight: '600', color: colors.primary, flex: 1 },
  recDesc:    { fontSize: 13, color: '#475569', lineHeight: 19, marginBottom: 6 },
  recFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryText:  { fontSize: 11, fontWeight: '600', color: colors.secondary },
  buyRow:     { flexDirection: 'row', gap: 6 },
  buyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8340A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  buyBtnML:   { backgroundColor: '#FFE600' },
  buyBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  insItem:    { paddingVertical: 8 },
  insHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  insType:    { fontSize: 13, fontWeight: '600', color: colors.primary, flex: 1 },
  insDesc:    { fontSize: 13, color: '#475569', lineHeight: 19, marginBottom: 6 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  benefitText: { fontSize: 12, color: '#D97706', fontWeight: '500' },

  costRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  costAmount: { fontSize: 16, fontWeight: '700', color: '#059669' },
  costNote:   { fontSize: 12, color: '#64748B', marginTop: 6 },
});
