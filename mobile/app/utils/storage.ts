// Token saqlash / Token storage (expo-secure-store)
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'hlopok_token';
const LANG_KEY  = 'hlopok_lang';

export const saveLang = (lang: string) => AsyncStorage.setItem(LANG_KEY, lang);
export const getLang  = () => AsyncStorage.getItem(LANG_KEY);

export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};
