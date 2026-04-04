import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import Screen from '../components/Screen';
import { useBillingStore } from '../context/billingStore';
import { useHistoryStore } from '../context/historyStore';
import { useToast } from '../context/ToastContext';
import type { AppStackParamList } from '../navigation/types';
import { requestGenerateImage } from '../services/imageService';
import { palette } from '../utils/palette';

type Props = NativeStackScreenProps<AppStackParamList, 'Image'>;

export default function ImageScreen({ navigation, route }: Props) {
  const { showToast } = useToast();
  const billingStatus = useBillingStore((s) => s.status);
  const item = useHistoryStore((s) => s.getById(route.params.itemId));
  const setImageUrl = useHistoryStore((s) => s.setImageUrl);
  const [loadingDownload, setLoadingDownload] = useState<boolean>(false);
  const [loadingShare, setLoadingShare] = useState<boolean>(false);
  const [loadingRegenerate, setLoadingRegenerate] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(true);

  const imageUrl = item?.imageUrl ?? null;
  const fileName = useMemo(
    () => `${route.params.itemId.replace(/[^a-zA-Z0-9_]/g, '')}.png`,
    [route.params.itemId]
  );

  if (!item || !imageUrl) {
    return (
      <Screen
        title="Imagem"
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
          Nenhuma imagem encontrada para este item.
        </Text>
      </Screen>
    );
  }

  const itemValue = item;
  const imageUrlValue: string = imageUrl;

  async function downloadToCache(): Promise<string> {
    const dir = FileSystem.Paths.cache.uri;
    const localUri = `${dir}${fileName}`;
    const downloaded = await FileSystem.downloadAsync(imageUrlValue, localUri);
    return downloaded.uri;
  }

  return (
    <Screen
      title="Imagem"
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
        <Card padding={10}>
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: imageUrlValue }}
              style={styles.image}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
            {imageLoading ? (
              <View style={styles.imageOverlay} pointerEvents="none">
                <Spinner />
              </View>
            ) : null}
          </View>
        </Card>

        <Card>
          <Text style={styles.caption}>Preview gerado a partir da copy.</Text>
          <View style={{ height: 12 }} />
          <Button
            title="Regerar imagem"
            variant="secondary"
            onPress={async () => {
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
                setLoadingRegenerate(true);
                const promptForImage = itemValue.text.slice(0, 380);
                const res = await requestGenerateImage({ prompt: promptForImage });
                await setImageUrl(itemValue.id, res.imageUrl);
                showToast({ type: 'success', title: 'Atualizado', message: 'Nova imagem gerada.' });
              } catch (err) {
                showToast({
                  type: 'error',
                  title: 'Falha ao regerar',
                  message: err instanceof Error ? err.message : 'Tente novamente.',
                });
              } finally {
                setLoadingRegenerate(false);
              }
            }}
            loading={loadingRegenerate}
          />
          <View style={{ height: 10 }} />
          <Button
            title="Baixar imagem"
            onPress={async () => {
              try {
                setLoadingDownload(true);
                const perm = await MediaLibrary.requestPermissionsAsync();
                if (!perm.granted) {
                  showToast({
                    type: 'info',
                    title: 'Permissão necessária',
                    message: 'Ative o acesso à galeria para salvar a imagem.',
                  });
                  return;
                }

                const uri = await downloadToCache();
                const asset = await MediaLibrary.createAssetAsync(uri);
                await MediaLibrary.createAlbumAsync('CopyBoost IA', asset, false);
                showToast({ type: 'success', title: 'Salvo!', message: 'Imagem na galeria.' });
              } catch (err) {
                showToast({
                  type: 'error',
                  title: 'Falha ao baixar',
                  message: err instanceof Error ? err.message : 'Tente novamente.',
                });
              } finally {
                setLoadingDownload(false);
              }
            }}
            loading={loadingDownload}
          />
          <View style={{ height: 10 }} />
          <Button
            title="Compartilhar"
            variant="secondary"
            onPress={async () => {
              try {
                setLoadingShare(true);
                const uri = await downloadToCache();
                const canShare = await Sharing.isAvailableAsync();
                if (!canShare) {
                  showToast({
                    type: 'info',
                    title: 'Compartilhamento indisponível',
                    message: 'Seu dispositivo não suporta compartilhamento.',
                  });
                  return;
                }
                await Sharing.shareAsync(uri);
              } catch (err) {
                showToast({
                  type: 'error',
                  title: 'Falha ao compartilhar',
                  message: err instanceof Error ? err.message : 'Tente novamente.',
                });
              } finally {
                setLoadingShare(false);
              }
            }}
            loading={loadingShare}
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14, paddingTop: 10 },
  imageWrap: { position: 'relative' },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#000000',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
  },
  caption: { color: palette.mutedDark, fontSize: 12, lineHeight: 18 },
});
