import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/authContext';
import { colors } from '../../styles/Colors';
import { getProfile } from '../../services/profileService';
import { UserProfile } from '../../types/consultation';

type InfoRowProps = Readonly<{ icon: string; label: string; value: string }>;

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBg}>
        <Ionicons name={icon as any} size={16} color={colors.secondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

export default function ProfileTabScreen() {
  const { user, signOut } = useAuth();

  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getProfile();
      setProfile(p);
    } catch {
      // Profile may not exist yet — silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  function handleLogout() {
    const doSignOut = () => {
      setSigningOut(true);
      signOut().catch(() => setSigningOut(false));
    };
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: doSignOut },
      ],
    );
  }

  const initial = (user?.name ?? 'U')[0].toUpperCase();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.userName}>{user?.name ?? 'Usuario'}</Text>
        <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
      </View>

      {/* Account card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cuenta</Text>
        <InfoRow icon="person-outline"     label="Nombre"  value={user?.name ?? ''} />
        <View style={styles.rowDivider} />
        <InfoRow icon="mail-outline"       label="Correo"  value={user?.email ?? ''} />
      </View>

      {/* Profile card */}
      {loading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.secondary} />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      )}
      {!loading && profile && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información Personal</Text>
          <InfoRow icon="card-outline"       label="RUT"       value={profile.rut} />
          <View style={styles.rowDivider} />
          <InfoRow icon="call-outline"       label="Teléfono"  value={profile.telefono} />
          <View style={styles.rowDivider} />
          <InfoRow icon="home-outline"       label="Dirección" value={profile.direccion} />
          <View style={styles.rowDivider} />
          <InfoRow icon="location-outline"   label="Comuna"    value={profile.comuna} />
          <View style={styles.rowDivider} />
          <InfoRow icon="map-outline"        label="Región"    value={profile.region} />
        </View>
      )}
      {!loading && !profile && (
        <View style={styles.noProfileCard}>
          <Ionicons name="person-add-outline" size={32} color="#CBD5E1" />
          <Text style={styles.noProfileText}>Perfil no configurado</Text>
          <Text style={styles.noProfileSub}>
            Completa tu información para personalizar el análisis
          </Text>
        </View>
      )}

      {/* Stats card */}
      <View style={[styles.card, styles.statsCard]}>
        <View style={styles.statItem}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.secondary} />
          <Text style={styles.statLabel}>Análisis IA</Text>
          <Text style={styles.statSub}>Potenciado por Gemini</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="lock-closed-outline" size={24} color={colors.secondary} />
          <Text style={styles.statLabel}>Datos seguros</Text>
          <Text style={styles.statSub}>Encriptados en GCS</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        disabled={signingOut}
        activeOpacity={0.85}
      >
        {signingOut ? (
          <ActivityIndicator color={colors.danger} />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: colors.background },
  content:  { padding: 20, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  avatar:        { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText:    { fontSize: 34, fontWeight: '700', color: '#fff' },
  userName:      { fontSize: 20, fontWeight: '700', color: colors.primary },
  userEmail:     { fontSize: 13, color: '#64748B', marginTop: 2 },

  card: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 14,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }),
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },

  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  infoIconBg: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  infoValue: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 1 },
  rowDivider: { height: 1, backgroundColor: '#F8FAFC', marginVertical: 2 },

  loadingCard: { backgroundColor: colors.white, borderRadius: 16, padding: 20, alignItems: 'center', gap: 10, marginBottom: 14 },
  loadingText: { fontSize: 13, color: '#94A3B8' },

  noProfileCard: { backgroundColor: colors.white, borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 14 },
  noProfileText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  noProfileSub:  { fontSize: 13, color: '#94A3B8', textAlign: 'center' },

  statsCard:   { flexDirection: 'row', alignItems: 'center', padding: 16 },
  statItem:    { flex: 1, alignItems: 'center', gap: 4 },
  statLabel:   { fontSize: 13, fontWeight: '700', color: colors.primary },
  statSub:     { fontSize: 11, color: '#94A3B8', textAlign: 'center' },
  statDivider: { width: 1, height: 40, backgroundColor: '#E2E8F0' },

  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA', borderRadius: 14, paddingVertical: 14, marginTop: 4 },
  logoutText: { fontSize: 16, fontWeight: '700', color: colors.danger },
});
