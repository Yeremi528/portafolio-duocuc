import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '../styles/Colors';

export default function ProfileScreen({ navigation }) {

  {/* Ejemplo */}
  const user = {
    name: 'Prueba',
    email: 'prueba@email.com',
    photo: null
  };

  const handleLogout = () => {
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {user.photo ? (
          <Image source={{ uri: user.photo }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        )}
      </View>

       {/* Nombre */}
      <Text style={styles.name}>{user.name}</Text>

       {/* Email */} 
      <Text style={styles.email}>{user.email}</Text>

       {/* Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Información</Text>
        <Text style={styles.label}>Correo</Text>
        <Text style={styles.value}>{user.email}</Text>
      </View>

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    alignItems: 'center'
  },

  avatarContainer: {
    marginTop: 20,
    marginBottom: 10
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50
  },

  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },

  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold'
  },

  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 10
  },

  email: {
    color: colors.text,
    marginBottom: 20
  },

  card: {
    width: '100%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    elevation: 3,
    marginBottom: 20
  },

  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.primary
  },

  label: {
    color: '#999'
  },

  value: {
    fontSize: 16,
    marginBottom: 10,
    color: colors.text
  },

  logout: {
    backgroundColor: colors.danger,
    padding: 15,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center'
  },

  logoutText: {
    color: 'white',
    fontWeight: 'bold'
  }
});