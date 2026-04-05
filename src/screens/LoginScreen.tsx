import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Screen from '../components/Screen';
import { useToast } from '../context/ToastContext';
import { useAuthStore } from '../context/authStore';
import type { AuthStackParamList } from '../navigation/types';
import { palette } from '../utils/palette';
import { isValidEmail, isValidPassword } from '../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const DEMO_EMAIL = 'demo@copyboostia.app';
const DEMO_PASSWORD = '123456';

function shouldAutoLoginDemo(): boolean {
  if (process.env.EXPO_PUBLIC_DISABLE_DEMO_AUTOLOGIN === '1') return false;
  if (Platform.OS !== 'web') return true;
  if (typeof window === 'undefined') return true;
  const params = new URLSearchParams(window.location.search);
  return params.get('autodemo') !== '0';
}

export default function LoginScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const [email, setEmail] = useState<string>(DEMO_EMAIL);
  const [password, setPassword] = useState<string>(DEMO_PASSWORD);
  const [loading, setLoading] = useState<boolean>(false);
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

  useEffect(() => {
    if (!shouldAutoLoginDemo()) return;
    const run = async (): Promise<void> => {
      try {
        setLoading(true);
        setTouched({ email: true, password: true });
        await register(DEMO_EMAIL, DEMO_PASSWORD);
        showToast({
          type: 'success',
          title: 'Login demo ativo',
          message: 'Entrando automaticamente…',
          durationMs: 1600,
        });
      } catch {
        // Se por algum motivo não registrar (ex.: storage indisponível), tenta login.
        try {
          await login(DEMO_EMAIL, DEMO_PASSWORD);
        } catch {
          showToast({
            type: 'error',
            title: 'Falha no login demo',
            message: 'Tente entrar manualmente.',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [login, register, showToast]);

  const errors = useMemo(() => {
    const emailError =
      touched.email && !isValidEmail(email) ? 'Informe um e-mail válido' : undefined;
    const passError =
      touched.password && !isValidPassword(password)
        ? 'A senha deve ter pelo menos 6 caracteres'
        : undefined;
    return { email: emailError, password: passError };
  }, [email, password, touched.email, touched.password]);

  const canSubmit = isValidEmail(email) && isValidPassword(password) && !loading;

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        <View style={styles.hero}>
          <Text style={styles.brand}>CopyBoost IA</Text>
          <Text style={styles.subtitle}>Gere copies e imagens para marketing em segundos.</Text>
        </View>

        <Card>
          <View style={styles.form}>
            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              error={errors.email}
              placeholder="seuemail@exemplo.com"
            />
            <Input
              label="Senha"
              value={password}
              onChangeText={setPassword}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              secureTextEntry
              textContentType="password"
              returnKeyType="done"
              error={errors.password}
              placeholder="••••••••"
            />
            <Button
              title="Entrar"
              onPress={async () => {
                setTouched({ email: true, password: true });
                if (!canSubmit) return;
                try {
                  setLoading(true);
                  await login(email, password);
                  showToast({ type: 'success', title: 'Bem-vindo!', message: 'Login realizado.' });
                } catch (err) {
                  showToast({
                    type: 'error',
                    title: 'Erro no login',
                    message: err instanceof Error ? err.message : 'Tente novamente.',
                  });
                } finally {
                  setLoading(false);
                }
              }}
              loading={loading}
              disabled={!canSubmit}
            />

            <Button
              title="Entrar com conta demo"
              variant="secondary"
              onPress={async () => {
                try {
                  setLoading(true);
                  await register(DEMO_EMAIL, DEMO_PASSWORD);
                  showToast({
                    type: 'success',
                    title: 'Demo',
                    message: 'Login realizado.',
                  });
                } catch {
                  showToast({
                    type: 'error',
                    title: 'Falha no demo',
                    message: 'Tente novamente.',
                  });
                } finally {
                  setLoading(false);
                }
              }}
            />

            <Button
              title="Criar conta"
              variant="secondary"
              onPress={() => navigation.navigate('Register')}
            />
          </View>
        </Card>

        <Text style={styles.footnote}>
          Conta demo: {DEMO_EMAIL} / {DEMO_PASSWORD}. Os dados ficam salvos apenas no dispositivo.
        </Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, gap: 16, paddingTop: 26 },
  hero: { gap: 8, paddingHorizontal: 2, paddingBottom: 4 },
  brand: {
    color: palette.textDark,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: palette.mutedDark,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 340,
  },
  form: {
    gap: 12,
  },
  footnote: {
    color: palette.mutedDark,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
});
