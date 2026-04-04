import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import Screen from '../components/Screen';
import { useBillingStore } from '../context/billingStore';
import { useHistoryStore } from '../context/historyStore';
import { useToast } from '../context/ToastContext';
import type { AppStackParamList } from '../navigation/types';
import { requestGenerateCopy } from '../services/copyService';
import { requestGenerateImage } from '../services/imageService';
import type { CopyVariant } from '../services/mockBackend';
import { palette } from '../utils/palette';

type Props = NativeStackScreenProps<AppStackParamList, 'Result'>;

export default function ResultScreen({ navigation, route }: Props) {
  const { showToast } = useToast();
  const billingStatus = useBillingStore((s) => s.status);
  const item = useHistoryStore((s) => s.getById(route.params.itemId));
  const updateText = useHistoryStore((s) => s.updateText);
  const setImageUrl = useHistoryStore((s) => s.setImageUrl);

  const [loadingVariant, setLoadingVariant] = useState<CopyVariant | null>(null);
  const [loadingImage, setLoadingImage] = useState<boolean>(false);

  const formatted = useMemo(() => formatToBlocks(item?.text ?? ''), [item?.text]);

  if (!item) {
    return (
      <Screen
        title="Resultado"
        headerLeft={
          <Button
            title="Voltar"
            variant="ghost"
            fullWidth={false}
            onPress={() => navigation.goBack()}
          />
        }
      >
        <Text style={{ color: palette.textDark }}>
          Não foi possível encontrar esse item no histórico.
        </Text>
      </Screen>
    );
  }

  const itemValue = item;

  async function regenerate(variant: CopyVariant): Promise<void> {
    if (billingStatus === 'expired') {
      showToast({
        type: 'info',
        title: 'Assinatura necessária',
        message: 'Seu teste grátis terminou. Assine para continuar.',
      });
      navigation.navigate('Subscription');
      return;
    }
    try {
      setLoadingVariant(variant);
      const res = await requestGenerateCopy({
        prompt: itemValue.prompt,
        kind: itemValue.kind,
        variant,
      });
      await updateText(itemValue.id, res.text);
      showToast({ type: 'success', title: 'Atualizado', message: 'Nova versão gerada.' });
    } catch {
      showToast({
        type: 'error',
        title: 'Falha ao gerar',
        message: 'Tente novamente.',
      });
    } finally {
      setLoadingVariant(null);
    }
  }

  return (
    <Screen
      title="Resultado"
      headerLeft={
        <Button
          title="Voltar"
          variant="ghost"
          fullWidth={false}
          onPress={() => navigation.goBack()}
        />
      }
      scroll
    >
      <View style={styles.stack}>
        <Card>
          <Text style={styles.smallLabel}>Prompt</Text>
          <Text style={styles.prompt}>{itemValue.prompt}</Text>
        </Card>

        <Card>
          <View style={styles.resultHeader}>
            <Text style={styles.smallLabel}>Copy gerada</Text>
            <Button
              title="Copiar"
              variant="secondary"
              fullWidth={false}
              onPress={() => {
                void Clipboard.setStringAsync(itemValue.text).then(() => {
                  showToast({ type: 'success', title: 'Copiado!', message: 'Texto no clipboard.' });
                });
              }}
            />
          </View>

          <ScrollView
            style={styles.resultScroll}
            contentContainerStyle={styles.resultContent}
            nestedScrollEnabled
          >
            {formatted.map((block, idx) => (
              <Text key={`${idx}_${block.slice(0, 12)}`} style={styles.resultText}>
                {block}
              </Text>
            ))}
          </ScrollView>
        </Card>

        <View style={styles.actions}>
          <Text style={styles.actionsTitle}>Ajustes rápidos</Text>
          <View style={styles.actionsRow}>
            <Button
              title="Mais agressivo"
              variant="secondary"
              onPress={() => void regenerate('aggressive')}
              loading={loadingVariant === 'aggressive'}
            />
          </View>
          <View style={styles.actionsRow}>
            <Button
              title="Versão curta"
              variant="secondary"
              onPress={() => void regenerate('short')}
              loading={loadingVariant === 'short'}
            />
            <View style={{ width: 10 }} />
            <Button
              title="Versão longa"
              variant="secondary"
              onPress={() => void regenerate('long')}
              loading={loadingVariant === 'long'}
            />
          </View>
        </View>

        <Card>
          <Text style={styles.actionsTitle}>Imagem</Text>
          <Text style={styles.muted}>
            Gere uma imagem baseada na copy (ótima para anúncios e posts).
          </Text>
          <View style={{ height: 12 }} />
          <Button
            title={itemValue.imageUrl ? 'Ver imagem' : 'Gerar imagem baseada no texto'}
            onPress={async () => {
              if (itemValue.imageUrl) {
                navigation.navigate('Image', { itemId: itemValue.id });
                return;
              }
              if (billingStatus === 'expired') {
                showToast({
                  type: 'info',
                  title: 'Assinatura necessária',
                  message: 'Seu teste grátis terminou. Assine para continuar.',
                });
                navigation.navigate('Subscription');
                return;
              }
              try {
                setLoadingImage(true);
                const promptForImage = itemValue.text.slice(0, 380);
                const res = await requestGenerateImage({ prompt: promptForImage });
                await setImageUrl(itemValue.id, res.imageUrl);
                navigation.navigate('Image', { itemId: itemValue.id });
              } catch {
                showToast({
                  type: 'error',
                  title: 'Falha ao gerar imagem',
                  message: 'Tente novamente.',
                });
              } finally {
                setLoadingImage(false);
              }
            }}
            loading={loadingImage}
          />
        </Card>
      </View>
    </Screen>
  );
}

function formatToBlocks(text: string): string[] {
  const cleaned = text.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return [];
  return cleaned
    .split(/\n{2,}/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const styles = StyleSheet.create({
  stack: { gap: 14, paddingTop: 10 },
  smallLabel: { color: palette.mutedDark, fontSize: 12, fontWeight: '800' },
  prompt: { color: palette.textDark, fontSize: 13, lineHeight: 18, marginTop: 6 },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultScroll: { marginTop: 10, maxHeight: 360 },
  resultContent: { gap: 10, paddingBottom: 2 },
  resultText: { color: palette.textDark, fontSize: 14, lineHeight: 20 },
  actions: { gap: 10 },
  actionsTitle: { color: palette.textDark, fontSize: 14, fontWeight: '900' },
  actionsRow: { flexDirection: 'row' },
  muted: { color: palette.mutedDark, fontSize: 12, lineHeight: 18, marginTop: 6 },
});
