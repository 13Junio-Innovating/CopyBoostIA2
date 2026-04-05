import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Screen from '../components/Screen';
import { useAuthStore } from '../context/authStore';
import { useBillingStore } from '../context/billingStore';
import { palette } from '../utils/palette';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Subscription'>;

export default function SubscriptionScreen({ navigation }: Props) {
  const logout = useAuthStore((s) => s.logout);
  const status = useBillingStore((s) => s.status);
  const daysLeft = useBillingStore((s) => s.getTrialDaysLeft());
  const subscribe = useBillingStore((s) => s.subscribeMock);

  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [cardName, setCardName] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiry, setExpiry] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');
  const [touched, setTouched] = useState<{
    cardName: boolean;
    cardNumber: boolean;
    expiry: boolean;
    cvv: boolean;
  }>({ cardName: false, cardNumber: false, expiry: false, cvv: false });

  const showTrial = status === 'trial';
  const isExpired = status === 'expired';

  const errors = useMemo(() => {
    const numberDigits = onlyDigits(cardNumber);
    const exp = parseExpiry(expiry);

    const cardNameError =
      touched.cardName && cardName.trim().length < 3 ? 'Informe o nome do titular' : undefined;

    const cardNumberError =
      touched.cardNumber && !isValidCardNumber(numberDigits)
        ? 'Número do cartão inválido'
        : undefined;

    const expiryError =
      touched.expiry && !exp.ok ? 'Validade inválida (MM/AA)' : touched.expiry && exp.expired ? 'Cartão vencido' : undefined;

    const cvvError =
      touched.cvv && !isValidCvv(cvv) ? 'CVV inválido' : undefined;

    return { cardName: cardNameError, cardNumber: cardNumberError, expiry: expiryError, cvv: cvvError };
  }, [cardName, cardNumber, cvv, expiry, touched.cardName, touched.cardNumber, touched.cvv, touched.expiry]);

  const canPay = useMemo(() => {
    const exp = parseExpiry(expiry);
    return (
      cardName.trim().length >= 3 &&
      isValidCardNumber(onlyDigits(cardNumber)) &&
      exp.ok &&
      !exp.expired &&
      isValidCvv(cvv) &&
      !processing
    );
  }, [cardName, cardNumber, cvv, expiry, processing]);

  return (
    <Screen title="Assinatura" scroll>
      <View style={styles.stack}>
        <Card>
          <Text style={styles.title}>CopyBoost IA Pro</Text>
          <Text style={styles.subtitle}>
            Teste grátis por 1 mês. Depois, assine para continuar gerando copies e imagens.
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>R$ 99,00</Text>
            <Text style={styles.priceSuffix}>/ mês</Text>
          </View>

          {showTrial ? (
            <Text style={styles.badge}>
              Teste grátis ativo · {daysLeft} dia{daysLeft === 1 ? '' : 's'} restante
              {daysLeft === 1 ? '' : 's'}
            </Text>
          ) : null}

          {isExpired ? (
            <Text style={styles.badgeExpired}>Teste grátis expirado · Assine para continuar</Text>
          ) : null}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>O que você recebe</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Geração de copy com variações (curta/longa/agressiva)</Text>
            <Text style={styles.listItem}>• CTA automático e texto formatado pronto para colar</Text>
            <Text style={styles.listItem}>• Geração de imagem a partir da copy</Text>
            <Text style={styles.listItem}>• Histórico local para reutilizar conteúdo</Text>
          </View>

          <View style={{ height: 14 }} />
          {!showPayment ? (
            <Button
              title="Assinar por R$ 99,00/mês"
              onPress={() => {
                setShowPayment(true);
                setTouched({ cardName: false, cardNumber: false, expiry: false, cvv: false });
              }}
            />
          ) : (
            <View style={styles.payment}>
              <Text style={styles.sectionTitle}>Dados do cartão</Text>
              <Text style={styles.paymentHint}>
                Pagamento simulado. Use qualquer cartão válido (Luhn) para testar.
              </Text>

              <Input
                label="Nome no cartão"
                value={cardName}
                onChangeText={setCardName}
                onBlur={() => setTouched((t) => ({ ...t, cardName: true }))}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Ex: Junio Chaves"
                error={errors.cardName}
                textContentType={Platform.OS === 'ios' ? 'name' : undefined}
              />

              <Input
                label="Número do cartão"
                value={cardNumber}
                onChangeText={(v) => setCardNumber(formatCardNumber(v))}
                onBlur={() => setTouched((t) => ({ ...t, cardNumber: true }))}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                placeholder="0000 0000 0000 0000"
                error={errors.cardNumber}
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Input
                    label="Validade (MM/AA)"
                    value={expiry}
                    onChangeText={(v) => setExpiry(formatExpiry(v))}
                    onBlur={() => setTouched((t) => ({ ...t, expiry: true }))}
                    keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                    placeholder="MM/AA"
                    error={errors.expiry}
                  />
                </View>
                <View style={styles.col}>
                  <Input
                    label="CVV"
                    value={cvv}
                    onChangeText={(v) => setCvv(onlyDigits(v).slice(0, 4))}
                    onBlur={() => setTouched((t) => ({ ...t, cvv: true }))}
                    keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                    placeholder="123"
                    error={errors.cvv}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={{ height: 6 }} />
              <Button
                title="Confirmar pagamento"
                loading={processing}
                disabled={!canPay}
                onPress={async () => {
                  setTouched({ cardName: true, cardNumber: true, expiry: true, cvv: true });
                  if (!canPay) return;
                  try {
                    setProcessing(true);
                    await subscribe();
                    navigation.replace('Tabs', { screen: 'HomeTab' });
                  } finally {
                    setProcessing(false);
                  }
                }}
              />
              <View style={{ height: 10 }} />
              <Button
                title="Cancelar"
                variant="secondary"
                onPress={() => setShowPayment(false)}
                disabled={processing}
              />
            </View>
          )}
          <View style={{ height: 10 }} />
          <Button
            title="Voltar"
            variant="secondary"
            onPress={() => navigation.replace('Tabs', { screen: 'HomeTab' })}
          />
          <View style={{ height: 10 }} />
          <Button title="Sair da conta" variant="ghost" onPress={() => void logout()} />
        </Card>

        <Text style={styles.legal}>
          Pagamento aqui está simulado. Para publicar com cobrança real, integre compras in-app
          (App Store / Google Play).
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14, paddingTop: 10 },
  title: { color: palette.textDark, fontSize: 18, fontWeight: '900' },
  subtitle: { color: palette.mutedDark, fontSize: 12, lineHeight: 18, marginTop: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 14 },
  price: { color: palette.white, fontSize: 30, fontWeight: '900' },
  priceSuffix: { color: palette.mutedDark, fontSize: 14, fontWeight: '800', paddingBottom: 4 },
  badge: {
    marginTop: 12,
    color: palette.success,
    fontSize: 12,
    fontWeight: '800',
  },
  badgeExpired: {
    marginTop: 12,
    color: palette.warning,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: { color: palette.textDark, fontSize: 14, fontWeight: '900' },
  list: { gap: 8, marginTop: 10 },
  listItem: { color: palette.mutedDark, fontSize: 12, lineHeight: 18 },
  legal: { color: palette.mutedDark, fontSize: 11, lineHeight: 16, opacity: 0.85 },
  payment: { gap: 12 },
  paymentHint: { color: palette.mutedDark, fontSize: 12, lineHeight: 18, marginTop: 6 },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
});

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function formatCardNumber(input: string): string {
  const digits = onlyDigits(input).slice(0, 19);
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 4) parts.push(digits.slice(i, i + 4));
  return parts.join(' ');
}

function isValidCardNumber(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) return false;
  if (!/^\d+$/.test(digits)) return false;
  return luhn(digits);
}

function luhn(digits: string): boolean {
  let sum = 0;
  let doubleNext = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    const n = digits.charCodeAt(i) - 48;
    if (n < 0 || n > 9) return false;
    let add = n;
    if (doubleNext) {
      add = n * 2;
      if (add > 9) add -= 9;
    }
    sum += add;
    doubleNext = !doubleNext;
  }
  return sum % 10 === 0;
}

function formatExpiry(input: string): string {
  const digits = onlyDigits(input).slice(0, 4);
  const mm = digits.slice(0, 2);
  const yy = digits.slice(2, 4);
  if (digits.length <= 2) return mm;
  return `${mm}/${yy}`;
}

function parseExpiry(input: string): { ok: boolean; expired: boolean } {
  const digits = onlyDigits(input);
  if (digits.length !== 4) return { ok: false, expired: false };
  const mm = Number(digits.slice(0, 2));
  const yy = Number(digits.slice(2, 4));
  if (!Number.isFinite(mm) || !Number.isFinite(yy)) return { ok: false, expired: false };
  if (mm < 1 || mm > 12) return { ok: false, expired: false };

  const now = new Date();
  const currentYY = now.getFullYear() % 100;
  const currentMM = now.getMonth() + 1;
  const expired = yy < currentYY || (yy === currentYY && mm < currentMM);
  return { ok: true, expired };
}

function isValidCvv(input: string): boolean {
  const digits = onlyDigits(input);
  return digits.length === 3 || digits.length === 4;
}
