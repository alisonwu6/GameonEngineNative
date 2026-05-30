import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { login as apiLogin, register as apiRegister } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('player');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    if (isRegister && !name.trim()) { setError('Name is required.'); return; }

    setLoading(true);
    try {
      const data = isRegister
        ? await apiRegister(name, email, password, role)
        : await apiLogin(email, password);

      await login(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>GameOn</Text>
          <Text style={styles.subtitle}>Sports Venue Booking</Text>

          <View style={styles.card}>
            <Text style={styles.heading}>{isRegister ? 'Create Account' : 'Welcome Back'}</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {isRegister && (
              <>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  autoCapitalize="words"
                />
                <Text style={styles.label}>Role</Text>
                <View style={styles.roleRow}>
                  {['player', 'manager'].map((r) => (
                    <Pressable
                      key={r}
                      style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                      onPress={() => setRole(r)}
                    >
                      <Text style={[styles.roleTxt, role === r && styles.roleTxtActive]}>
                        {r === 'player' ? 'Player' : 'Venue Manager'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              secureTextEntry
            />

            <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.submitTxt}>{isRegister ? 'Register' : 'Sign In'}</Text>
              )}
            </Pressable>

            <Pressable onPress={() => { setIsRegister(!isRegister); setError(''); }}>
              <Text style={styles.toggle}>
                {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F6F1' },
  container: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 36, fontWeight: '800', color: '#4A7A4A', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: '#333' },
  error: { backgroundColor: '#FDECEA', color: '#C0392B', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#FAFAFA' },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  roleBtn: { flex: 1, borderWidth: 1, borderColor: '#D9E7CB', borderRadius: 10, padding: 10, alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#D9E7CB', borderColor: '#4A7A4A' },
  roleTxt: { fontSize: 13, color: '#666' },
  roleTxtActive: { color: '#4A7A4A', fontWeight: '700' },
  submitBtn: { backgroundColor: '#4A7A4A', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toggle: { color: '#4A7A4A', textAlign: 'center', marginTop: 16, fontSize: 13 },
});
