import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import { Colors } from '../theme/colors';

const AuthTopBar = () => {
  const navigation = useNavigation<any>();

  const handleClose = () => {
    const parent = (navigation as any).getParent();
    if (parent?.canGoBack()) {
      parent.goBack();
    } else {
      parent?.navigate('MainApp');
    }
  };

  return (
    <View style={styles.row}>
      <View />
      <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
        <X color={Colors.grayDark} size={22} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AuthTopBar;
