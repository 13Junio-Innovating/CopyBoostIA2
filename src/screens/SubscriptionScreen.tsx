import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
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

  const showTrial = status === 'trial';
  const isExpired = status === 'expired';

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
          <Button
            title="Assinar por R$ 99,00/mês"
            onPress={async () => {
              await subscribe();
              navigation.replace('Tabs', { screen: 'HomeTab' });
            }}
          />
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
});
