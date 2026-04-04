import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import Button from '../components/Button';
import Card from '../components/Card';
import CopyKindSelect from '../components/CopyKindSelect';
import Input from '../components/Input';
import Screen from '../components/Screen';
import { useAuthStore } from '../context/authStore';
import { useBillingStore } from '../context/billingStore';
import { useHistoryStore } from '../context/historyStore';
import { useToast } from '../context/ToastContext';
import { requestGenerateCopy } from '../services/copyService';
import type { AppStackParamList, AppTabParamList } from '../navigation/types';
import type { CopyKind } from '../utils/copyKinds';
import { palette } from '../utils/palette';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, 'HomeTab'>,
  NativeStackScreenProps<AppStackParamList, 'Tabs'>
>;

export default function HomeScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const logout = useAuthStore((s) => s.logout);
  const createFromCopy = useHistoryStore((s) => s.createFromCopy);
  const billingStatus = useBillingStore((s) => s.status);
  const trialDaysLeft = useBillingStore((s) => s.getTrialDaysLeft());

  const [prompt, setPrompt] = useState<string>('');
  const [kind, setKind] = useState<CopyKind>('sales');
  const [loading, setLoading] = useState<boolean>(false);
  const [listening, setListening] = useState<boolean>(false);

  const canGenerate = prompt.trim().length >= 8 && !loading;

  const headerRight = useMemo(() => {
    return (
      <View style={styles.headerActions}>
        {billingStatus !== 'subscribed' ? (
          <Button
            title="Assinar"
            variant="ghost"
            fullWidth={false}
            onPress={() => navigation.navigate('Subscription')}
          />
        ) : null}
        <Button title="Sair" variant="ghost" fullWidth={false} onPress={() => void logout()} />
      </View>
    );
  }, [billingStatus, logout, navigation]);

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    showToast({
      type: 'error',
      title: 'Microfone',
      message: event.message || 'Falha ao reconhecer a fala.',
    });
  });
  useSpeechRecognitionEvent('result', (event) => {
    const next = event.results[0]?.transcript;
    if (typeof next === 'string' && next.trim().length > 0) {
      setPrompt(next);
    }
  });

  return (
    <Screen title="Criar copy" headerRight={headerRight} scroll>
      <View style={styles.stack}>
        <Card>
          <View style={styles.block}>
            <Text style={styles.label}>Descreva o que você quer criar</Text>
            {billingStatus === 'trial' ? (
              <Text style={styles.trial}>
                Teste grátis: {trialDaysLeft} dia{trialDaysLeft === 1 ? '' : 's'} restante
                {trialDaysLeft === 1 ? '' : 's'}
              </Text>
            ) : null}
            <Input
              label="Prompt"
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Ex: um anúncio para um curso de inglês para iniciantes..."
              multiline
              style={styles.multiline}
              right={
                <Pressable
                  onPress={async () => {
                    if (loading) return;
                    try {
                      const available = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
                      if (!available) {
                        showToast({
                          type: 'info',
                          title: 'Microfone indisponível',
                          message: 'Reconhecimento de fala não disponível neste dispositivo.',
                        });
                        return;
                      }

                      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
                      if (!perm.granted) {
                        showToast({
                          type: 'info',
                          title: 'Permissão necessária',
                          message: 'Ative o microfone para ditar seu prompt.',
                        });
                        return;
                      }

                      if (listening) {
                        ExpoSpeechRecognitionModule.stop();
                        return;
                      }

                      ExpoSpeechRecognitionModule.start({
                        lang: 'pt-BR',
                        interimResults: true,
                        continuous: false,
                        addsPunctuation: true,
                      });
                    } catch (err) {
                      showToast({
                        type: 'error',
                        title: 'Microfone',
                        message: err instanceof Error ? err.message : 'Não foi possível iniciar.',
                      });
                    }
                  }}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={listening ? 'Parar ditado' : 'Ditar prompt'}
                  style={({ pressed }) => [
                    styles.mic,
                    listening ? styles.micActive : null,
                    pressed ? { opacity: 0.9 } : null,
                  ]}
                >
                  <Ionicons
                    name={listening ? 'stop-circle' : 'mic'}
                    size={20}
                    color={listening ? palette.white : palette.mutedDark}
                  />
                </Pressable>
              }
            />

            <Text style={styles.label}>Formato</Text>
            <CopyKindSelect value={kind} onChange={setKind} />

            <View style={{ height: 10 }} />
            <Button
              title="Gerar Copy"
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
                if (!canGenerate) {
                  showToast({
                    type: 'info',
                    title: 'Complete o prompt',
                    message: 'Escreva pelo menos 8 caracteres para gerar uma copy melhor.',
                  });
                  return;
                }
                try {
                  setLoading(true);
                  const res = await requestGenerateCopy({ prompt: prompt.trim(), kind });
                  const item = await createFromCopy({ kind, prompt: prompt.trim(), text: res.text });
                  navigation.navigate('Result', { itemId: item.id });
                } catch {
                  showToast({
                    type: 'error',
                    title: 'Falha ao gerar',
                    message: 'Verifique sua conexão e tente novamente.',
                  });
                } finally {
                  setLoading(false);
                }
              }}
              loading={loading}
              disabled={!canGenerate}
            />
          </View>
        </Card>

        <View style={styles.tip}>
          <Text style={styles.tipTitle}>Diferenciais</Text>
          <Text style={styles.tipText}>
            No resultado você pode pedir versão curta/longa, deixar mais agressivo e gerar imagem
            baseada na copy.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14, paddingTop: 10 },
  headerActions: { flexDirection: 'row', gap: 10 },
  block: { gap: 12 },
  label: { color: palette.mutedDark, fontSize: 12, fontWeight: '700' },
  trial: { color: palette.success, fontSize: 12, fontWeight: '800', marginTop: -2 },
  multiline: { height: 110, paddingTop: 12, textAlignVertical: 'top' },
  mic: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micActive: {
    borderColor: 'transparent',
    backgroundColor: palette.brand,
    shadowColor: palette.brand2,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  tip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: 'rgba(109, 94, 241, 0.08)',
    padding: 14,
    gap: 6,
  },
  tipTitle: { color: palette.textDark, fontSize: 14, fontWeight: '800' },
  tipText: { color: palette.mutedDark, fontSize: 12, lineHeight: 18 },
});
