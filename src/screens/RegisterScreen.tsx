import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const register = useAuthStore((s) => s.register);

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [touched, setTouched] = useState<{ email: boolean; password: boolean; confirm: boolean }>(
    { email: false, password: false, confirm: false }
  );

  const errors = useMemo(() => {
    const emailError =
      touched.email && !isValidEmail(email) ? 'Informe um e-mail válido' : undefined;
    const passError =
      touched.password && !isValidPassword(password)
        ? 'A senha deve ter pelo menos 6 caracteres'
        : undefined;
    const confirmError =
      touched.confirm && confirm.trim() !== password.trim() ? 'As senhas não conferem' : undefined;
    return { email: emailError, password: passError, confirm: confirmError };
  }, [confirm, email, password, touched.confirm, touched.email, touched.password]);

  const canSubmit =
    isValidEmail(email) &&
    isValidPassword(password) &&
    confirm.trim() === password.trim() &&
    !loading;

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>
            Sua conta é salva localmente (mock). Você pode trocar para um backend real depois.
          </Text>
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
              error={errors.email}
              placeholder="seuemail@exemplo.com"
            />
            <Input
              label="Senha"
              value={password}
              onChangeText={setPassword}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              secureTextEntry
              textContentType="newPassword"
              error={errors.password}
              placeholder="••••••••"
            />
            <Input
              label="Confirmar senha"
              value={confirm}
              onChangeText={setConfirm}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              secureTextEntry
              textContentType="password"
              error={errors.confirm}
              placeholder="••••••••"
            />

            <Button
              title="Cadastrar"
              onPress={async () => {
                setTouched({ email: true, password: true, confirm: true });
                if (!canSubmit) return;
                try {
                  setLoading(true);
                  await register(email, password);
                  showToast({
                    type: 'success',
                    title: 'Conta criada!',
                    message: 'Você já está logado.',
                  });
                } catch {
                  showToast({
                    type: 'error',
                    title: 'Falha ao cadastrar',
                    message: 'Tente novamente.',
                  });
                } finally {
                  setLoading(false);
                }
              }}
              disabled={!canSubmit}
              loading={loading}
            />
            <Button
              title="Já tenho conta"
              variant="secondary"
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, gap: 16, paddingTop: 26 },
  hero: { gap: 8, paddingHorizontal: 2, paddingBottom: 4 },
  title: { color: palette.textDark, fontSize: 24, fontWeight: '900' },
  subtitle: { color: palette.mutedDark, fontSize: 13, lineHeight: 18, maxWidth: 360 },
  form: { gap: 12 },
});

