import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import Screen from '../components/Screen';
import { useBillingStore } from '../context/billingStore';
import { useHistoryStore, type HistoryItem } from '../context/historyStore';
import { useToast } from '../context/ToastContext';
import type { AppStackParamList, AppTabParamList } from '../navigation/types';
import { copyKindLabels } from '../utils/copyKinds';
import { palette } from '../utils/palette';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, 'HistoryTab'>,
  NativeStackScreenProps<AppStackParamList, 'Tabs'>
>;

export default function HistoryScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const items = useHistoryStore((s) => s.items);
  const clear = useHistoryStore((s) => s.clear);
  const billingStatus = useBillingStore((s) => s.status);

  return (
    <Screen
      title="Histórico"
      headerRight={
        <View style={styles.headerActions}>
          {billingStatus !== 'subscribed' ? (
            <Button
              title="Assinar"
              variant="ghost"
              fullWidth={false}
              onPress={() => navigation.navigate('Subscription')}
            />
          ) : null}
          {items.length > 0 ? (
            <Button
              title="Limpar"
              variant="ghost"
              fullWidth={false}
              onPress={() => {
                void clear().then(() => {
                  showToast({ type: 'success', title: 'Limpo', message: 'Histórico apagado.' });
                });
              }}
            />
          ) : null}
        </View>
      }
    >
      <View style={{ paddingTop: 10 }}>
        {items.length === 0 ? (
          <Card>
            <Text style={styles.emptyTitle}>Nada por aqui ainda</Text>
            <Text style={styles.emptyText}>
              Gere uma copy na aba “Criar” e ela vai aparecer aqui automaticamente.
            </Text>
          </Card>
        ) : (
          <FlatList<HistoryItem>
            data={items}
            keyExtractor={(it) => it.id}
            contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => navigation.navigate('Result', { itemId: item.id })}
                style={({ pressed }) => [pressed ? { opacity: 0.9 } : null]}
              >
                <Card>
                  <View style={styles.row}>
                    <Text style={styles.kind}>{copyKindLabels[item.kind]}</Text>
                    <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <Text numberOfLines={2} style={styles.prompt}>
                    {item.prompt}
                  </Text>
                  <View style={{ height: 10 }} />
                  <Text numberOfLines={3} style={styles.preview}>
                    {item.text}
                  </Text>
                  {item.imageUrl ? (
                    <Text style={styles.badge}>Imagem gerada</Text>
                  ) : (
                    <Text style={styles.badgeMuted}>Sem imagem</Text>
                  )}
                </Card>
              </Pressable>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${mi}`;
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', gap: 10 },
  emptyTitle: { color: palette.textDark, fontSize: 16, fontWeight: '900' },
  emptyText: { color: palette.mutedDark, fontSize: 12, lineHeight: 18, marginTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  kind: { color: palette.textDark, fontSize: 12, fontWeight: '800' },
  date: { color: palette.mutedDark, fontSize: 12, fontWeight: '700' },
  prompt: { color: palette.textDark, fontSize: 13, lineHeight: 18, marginTop: 8 },
  preview: { color: palette.mutedDark, fontSize: 12, lineHeight: 18 },
  badge: { marginTop: 10, color: palette.success, fontSize: 12, fontWeight: '800' },
  badgeMuted: { marginTop: 10, color: palette.mutedDark, fontSize: 12, fontWeight: '800' },
});
