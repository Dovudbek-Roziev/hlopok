import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Image, KeyboardAvoidingView, Modal,
  Platform, TextInput, TouchableOpacity,
} from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { Star, CircleCheck, Package } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { ordersApi } from '../api/orders';
import { productsApi } from '../api/products';
import { useColors } from '../theme/useColors';
import { getSizeLabel } from '../utils/sizeLabel';

type PendingItem = {
  orderId: string;
  orderNumber: string;
  productId: string;
  name_ru: string;
  name_ky: string;
  image: string | null;
  size: string;
};

const StarRater = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const Colors = useColors();
  return (
    <XStack gap={10} justifyContent="center">
      {[1, 2, 3, 4, 5].map(s => (
        <TouchableOpacity key={s} onPress={() => onChange(s)} hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}>
          <Animated.View>
            <Star size={42} color="#FFB800" fill={s <= value ? '#FFB800' : 'none'} />
          </Animated.View>
        </TouchableOpacity>
      ))}
    </XStack>
  );
};


const RatingModal = () => {
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const isKy = i18n.language === 'ky';
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();

  const [index, setIndex]     = useState(0);
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone]       = useState(false);
  const [skipped, setSkipped] = useState(false);

  const slideAnim = useRef(new Animated.Value(400)).current;
  const doneAnim  = useRef(new Animated.Value(0)).current;

  const { data, refetch } = useQuery({
    queryKey: ['pending-ratings'],
    queryFn:  () => ordersApi.getPendingRatings().then(r => r.data.pending as PendingItem[]),
    enabled:  isAuthenticated,
    staleTime: 0,
  });

  const pending = data || [];
  const current = pending[index];
  const visible = pending.length > 0 && !done && !skipped;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 68, friction: 11 }).start();
    }
  }, [visible]);

  const mutation = useMutation({
    mutationFn: () =>
      productsApi.createReview(current.productId, { rating, comment }),
    onError: (err: any) => {
      const msg = err?.response?.data?.message || t('common.error');
      Alert.alert(t('common.error'), msg);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', current.productId] });
      qc.invalidateQueries({ queryKey: ['can-review', current.productId] });
      qc.invalidateQueries({ queryKey: ['product-rating', current.productId] });
      if (index + 1 < pending.length) {
        Animated.timing(slideAnim, { toValue: -500, duration: 200, useNativeDriver: true }).start(() => {
          setIndex(i => i + 1);
          setRating(0);
          setComment('');
          slideAnim.setValue(400);
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 68, friction: 11 }).start();
        });
      } else {
        setDone(true);
        Animated.timing(doneAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        setTimeout(() => {
          setDone(false);
          setIndex(0);
          setRating(0);
          setComment('');
          refetch();
        }, 2000);
      }
    },
  });

  if (!isAuthenticated || pending.length === 0) return null;

  return (
    <Modal visible={visible || done} transparent animationType="none" statusBarTranslucent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <YStack flex={1} backgroundColor="rgba(0,0,0,0.55)" justifyContent="flex-end">

          {/* Done screen */}
          {done && (
            <Animated.View style={{ opacity: doneAnim }}>
              <YStack
                backgroundColor={Colors.white}
                borderTopLeftRadius={28}
                borderTopRightRadius={28}
                padding={40}
                alignItems="center"
                gap={16}
              >
                <CircleCheck color="#FFD700" size={52} />
                <Text fontSize={20} fontWeight="800" color={Colors.black} textAlign="center">
                  {t('reviews.thanks')}
                </Text>
                <Text fontSize={14} color={Colors.gray} textAlign="center">
                  {t('reviews.thanksMessage')}
                </Text>
              </YStack>
            </Animated.View>
          )}

          {/* Rating sheet */}
          {!done && current && (
            <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
              <YStack
                backgroundColor={Colors.white}
                borderTopLeftRadius={28}
                borderTopRightRadius={28}
                paddingHorizontal={24}
                paddingTop={12}
                paddingBottom={Platform.OS === 'ios' ? 40 : 28}
                gap={20}
              >
                {/* Drag handle */}
                <YStack alignItems="center">
                  <YStack width={44} height={4} borderRadius={2} backgroundColor={Colors.grayLight} />
                </YStack>

                {/* Header */}
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <Text fontSize={18} fontWeight="800" color={Colors.black}>
                      {t('reviews.rateProduct')}
                    </Text>
                    <Text fontSize={12} color={Colors.gray}>
                      {`${t('orders.orderNumber')} #${current.orderNumber}`}
                    </Text>
                  </YStack>
                  {pending.length > 1 && (
                    <YStack backgroundColor={Colors.yellow} borderRadius={20} paddingHorizontal={12} paddingVertical={4}>
                      <Text fontSize={12} fontWeight="700" color={Colors.black}>
                        {index + 1}/{pending.length}
                      </Text>
                    </YStack>
                  )}
                </XStack>

                {/* Product card */}
                <XStack backgroundColor={Colors.bg} borderRadius={16} padding={12} gap={14} alignItems="center">
                  {current.image ? (
                    <Image
                      source={{ uri: current.image }}
                      style={{ width: 72, height: 72, borderRadius: 12 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <YStack width={72} height={72} borderRadius={12}
                      backgroundColor={Colors.grayLight} alignItems="center" justifyContent="center">
                      <Package color="#BDBDBD" size={28} />
                    </YStack>
                  )}
                  <YStack flex={1} gap={4}>
                    <Text fontSize={14} fontWeight="700" color={Colors.black} numberOfLines={2}>
                      {isKy ? current.name_ky : current.name_ru}
                    </Text>
                    <Text fontSize={12} color={Colors.gray}>
                      {`${t('product.size')}: ${getSizeLabel(current.size, isKy ? 'ky' : 'ru')}`}
                    </Text>
                  </YStack>
                </XStack>

                {/* Stars */}
                <YStack gap={10} alignItems="center">
                  <StarRater value={rating} onChange={setRating} />
                  {rating > 0 && (
                    <Text fontSize={14} fontWeight="600" color="#FFB800">
                      {t(`reviews.label${rating}`)}
                    </Text>
                  )}
                </YStack>

                {/* Comment */}
                <TextInput
                  placeholder={t('reviews.comment')}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={300}
                  numberOfLines={3}
                  style={{
                    borderWidth: 1.5,
                    borderColor: Colors.border,
                    borderRadius: 14,
                    padding: 14,
                    fontSize: 14,
                    color: Colors.black,
                    minHeight: 80,
                    textAlignVertical: 'top',
                    backgroundColor: Colors.bg,
                  }}
                  placeholderTextColor={Colors.gray}
                />

                {/* Send button */}
                <TouchableOpacity
                  onPress={() => mutation.mutate()}
                  disabled={rating === 0 || mutation.isPending}
                  style={{
                    backgroundColor: rating > 0 ? Colors.green : Colors.grayLight,
                    borderRadius: 16,
                    height: 56,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text fontSize={16} fontWeight="800" color={rating > 0 ? '#fff' : Colors.gray}>
                    {mutation.isPending ? t('reviews.sending') : t('reviews.send')}
                  </Text>
                </TouchableOpacity>

                {/* Skip */}
                <TouchableOpacity
                  onPress={() => {
                    if (index + 1 < pending.length) {
                      setIndex(i => i + 1);
                      setRating(0);
                      setComment('');
                    } else {
                      setSkipped(true);
                    }
                  }}
                  style={{ alignItems: 'center', paddingBottom: 4 }}
                >
                  <Text fontSize={13} color={Colors.gray}>
                    {t('reviews.later')}
                  </Text>
                </TouchableOpacity>
              </YStack>
            </Animated.View>
          )}

        </YStack>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default RatingModal;
