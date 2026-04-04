import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../utils/palette';
import type { CopyKind } from '../utils/copyKinds';
import { copyKindLabels } from '../utils/copyKinds';

type Props = {
  value: CopyKind;
  onChange: (next: CopyKind) => void;
};

const options: CopyKind[] = ['sales', 'instagram', 'ad', 'email'];

export default function CopyKindSelect({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              styles.option,
              selected ? styles.optionSelected : null,
              selected ? styles.optionGlow : null,
            ]}
          >
            <Text style={[styles.text, selected ? styles.textSelected : null]}>
              {copyKindLabels[opt]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: palette.cardDark,
  },
  optionSelected: {
    borderColor: 'transparent',
    backgroundColor: palette.brand,
  },
  optionGlow: {
    shadowColor: palette.brand2,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  text: {
    color: palette.mutedDark,
    fontSize: 12,
    fontWeight: '700',
  },
  textSelected: {
    color: palette.white,
  },
});
