import React, { useState } from 'react';
import { useHeaderTopPadding } from '../../utils/useHeaderTopPadding';
import { ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { YStack, XStack, Text, Spinner } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Star, MessageSquare, User } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { productsApi } from '../../api/products';
import { authApi } from '../../api/auth';
import ReviewRules from '../../components/ReviewRules';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../theme/useColors';
import { formatDate } from '../../utils/format';

// ─── Yulduzcha / Star rater ───────────────────────────────────────
const StarRater = ({ value, onChange, size = 36 }: { value: number; onChange: (v: number) => void; size?: number }) => {
  const Colors = useColors();
  return (
    <XStack gap={6}>
      {[1, 2, 3, 4, 5].map(s => (
        <TouchableOpacity key={s} onPress={() => onChange(s)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <Star
            size={size}
            color={Colors.yellow}
            fill={s <= value ? Colors.yellow : 'none'}
          />
        </TouchableOpacity>
      ))}
    </XStack>
  );
};

// ─── Bir review kartasi / Review card ────────────────────────────
const ReviewCard = ({ review, onReport, onBlock }: { review: any; onReport?: () => void; onBlock?: () => void }) => {
  const { t } = useTranslation();
  const Colors = useColors();
  return (
    <YStack backgroundColor={Colors.white} borderRadius={14} padding={14} gap={8}>
      <XStack alignItems="center" gap={10}>
        <YStack width={40} height={40} borderRadius={20} backgroundColor={Colors.yellow}
          alignItems="center" justifyContent="center">
          <User color={Colors.black} size={20} strokeWidth={1.8} />
        </YStack>
        <YStack flex={1}>
          <Text fontWeight="600" color={Colors.black} fontSize={14}>
            {review.user?.firstName} {review.user?.lastName}
          </Text>
          <Text fontSize={11} color={Colors.gray}>{formatDate(review.createdAt)}</Text>
        </YStack>
        <XStack gap={2}>
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} size={13} color="#FFB800" fill={s <= review.rating ? '#FFB800' : 'none'} />
          ))}
        </XStack>
      </XStack>
      {onReport && <TouchableOpacity onPress={onReport} accessibilityRole="button"><Text color={Colors.grayDark}>{t('release.report')}</Text></TouchableOpacity>}
      {onBlock && <TouchableOpacity onPress={onBlock} accessibilityRole="button"><Text color={Colors.grayDark}>{t('release.block')}</Text></TouchableOpacity>}
      {!!review.comment && (
        <Text color={Colors.grayDark} fontSize={14} lineHeight={20}>{review.comment}</Text>
      )}
    </YStack>
  );
};

// ─── Asosiy ekran / Main screen ───────────────────────────────────
const ReviewsScreen = () => {
  const headerTopPadding = useHeaderTopPadding();
  const Colors      = useColors();
  const { t }       = useTranslation();
  const navigation  = useNavigation<any>();
  const route       = useRoute<any>();
  const qc          = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();

  const { productId, productName } = route.params as { productId: string; productName: string };

  const [acceptRules, setAcceptRules] = useState(false);
  const [myRating,  setMyRating]  = useState(0);
  const [myComment, setMyComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Barcha reviewlar
  const { data: reviewPages, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['review-list', productId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => productsApi.getReviews(productId, pageParam).then(r => r.data),
    getNextPageParam: last => last.page < last.pages ? last.page + 1 : undefined,
  });
  const reviewData = reviewPages?.pages[0];

  // Bu foydalanuvchi review yoza oladimi
  const { data: canData } = useQuery({
    queryKey: ['can-review', productId],
    queryFn:  () => productsApi.canReview(productId).then(r => r.data),
    enabled:  isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: () => productsApi.createReview(productId, { rating: myRating, comment: myComment, acceptRules }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', productId] });
      qc.invalidateQueries({ queryKey: ['review-list', productId] });
      qc.invalidateQueries({ queryKey: ['can-review', productId] });
      qc.invalidateQueries({ queryKey: ['product-rating', productId] });
      setMyRating(0);
      setMyComment('');
      setReviewMsg({ text: t('reviews.reviewSent'), ok: true });
    },
    onError: () => {
      setReviewMsg({ text: t('reviews.cannotReview'), ok: false });
    },
  });

  const handleSubmit = () => {
    if (myRating === 0) return;
    mutation.mutate();
  };

  const reviews = reviewPages?.pages.flatMap(page => page.reviews) || [];
  const avgRating  = reviewData?.avgRating || 0;
  const count      = reviewData?.count || 0;
  const canReview  = canData?.canReview ?? false;
  const userReview = canData?.userReview ?? null;

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg}>
      {/* Header */}
      <XStack backgroundColor={Colors.white} paddingTop={headerTopPadding} paddingHorizontal={16}
        paddingBottom={14} alignItems="center" gap={12}
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, elevation: 3 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={Colors.black} size={24} />
        </TouchableOpacity>
        <YStack flex={1}>
          <Text fontSize={16} fontWeight="700" color={Colors.black}>{t('reviews.title')}</Text>
          <Text fontSize={12} color={Colors.gray} numberOfLines={1}>{productName}</Text>
        </YStack>
      </XStack>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 40 }}
        >
          {/* Average rating block */}
          {!isLoading && count > 0 && (
            <YStack backgroundColor={Colors.white} borderRadius={16} padding={20}
              alignItems="center" gap={8}>
              <Text fontSize={48} fontWeight="800" color={Colors.black}>{avgRating}</Text>
              <XStack gap={4}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={22} color="#FFB800"
                    fill={s <= Math.round(avgRating) ? '#FFB800' : 'none'} />
                ))}
              </XStack>
              <Text fontSize={13} color={Colors.gray}>
                {count} {t('reviews.reviewsCount')}
              </Text>
            </YStack>
          )}

          {/* Write review form */}
          {isAuthenticated && canReview && (
            <YStack backgroundColor={Colors.white} borderRadius={16} padding={16} gap={14}>
              <Text fontWeight="700" fontSize={15} color={Colors.black}>{t('reviews.writeReview')}</Text>

              <YStack gap={8}>
                <Text fontSize={13} color={Colors.gray}>{t('reviews.tapToRate')}</Text>
                <StarRater value={myRating} onChange={setMyRating} />
              </YStack>

              <TextInput
                placeholder={t('reviews.commentPlaceholder')}
                value={myComment}
                onChangeText={setMyComment}
                multiline
                maxLength={300}
                numberOfLines={4}
                style={{
                  borderWidth: 1.5,
                  borderColor: Colors.border,
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 14,
                  color: Colors.black,
                  minHeight: 96,
                  textAlignVertical: 'top',
                  backgroundColor: Colors.bg,
                }}
                placeholderTextColor={Colors.gray}
              />

              <ReviewRules value={acceptRules} onChange={setAcceptRules} />
              {!!reviewMsg && (
                <YStack borderRadius={12} padding={12}
                  backgroundColor={reviewMsg.ok ? Colors.greenBg : Colors.redBg}
                  borderWidth={1} borderColor={reviewMsg.ok ? Colors.green : Colors.red}>
                  <Text fontSize={13} color={reviewMsg.ok ? Colors.green : Colors.red}>
                    {reviewMsg.text}
                  </Text>
                </YStack>
              )}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!acceptRules || myRating === 0 || mutation.isPending}
                style={{
                  backgroundColor: myRating > 0 ? Colors.yellow : Colors.grayLight,
                  borderRadius: 14, height: 50,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                {mutation.isPending
                  ? <Spinner color={Colors.black} />
                  : <Text fontWeight="700" fontSize={15} color={Colors.black}>{t('reviews.send')}</Text>
                }
              </TouchableOpacity>
            </YStack>
          )}

          {/* Cannot review hint */}
          {isAuthenticated && !canReview && !userReview && (
            <YStack backgroundColor={Colors.white} borderRadius={14} padding={16}
              borderLeftWidth={3} borderLeftColor={Colors.yellow}>
              <Text fontSize={13} color={Colors.gray} lineHeight={20}>
                {t('reviews.onlyBuyers')}
              </Text>
            </YStack>
          )}

          {/* My existing review */}
          {isAuthenticated && userReview && (
            <YStack gap={6}>
              <Text fontSize={13} fontWeight="600" color={Colors.gray} paddingHorizontal={4}>
                {t('reviews.myReview')}
              </Text>
              <ReviewCard review={userReview} />
            </YStack>
          )}

          {/* Loading */}
          {isLoading && (
            <YStack alignItems="center" paddingVertical={40}>
              <Spinner color={Colors.yellow} size="large" />
            </YStack>
          )}

          {/* Empty state */}
          {!isLoading && count === 0 && (
            <YStack alignItems="center" paddingVertical={48} gap={12}>
              <MessageSquare color={Colors.grayLight} size={52} />
              <Text fontSize={16} fontWeight="600" color={Colors.gray}>{t('reviews.noReviews')}</Text>
              <Text fontSize={13} color={Colors.gray}>{t('reviews.noReviewsHint')}</Text>
            </YStack>
          )}

          {/* Reviews list */}
          {reviews.map((r: any) => (
            <ReviewCard key={r._id} review={r}
              onReport={isAuthenticated ? async () => { try { await productsApi.reportReview(productId, r._id); setReviewMsg({ text: t('release.reported'), ok: true }); } catch { setReviewMsg({ text: t('common.error'), ok: false }); } } : undefined}
              onBlock={isAuthenticated && r.user?._id && r.user._id !== user?._id ? async () => { try { await authApi.setBlock(r.user._id, true); qc.invalidateQueries({ queryKey: ['review-list'] }); } catch { setReviewMsg({ text: t('common.error'), ok: false }); } } : undefined} />
          ))}
          {hasNextPage && <TouchableOpacity disabled={isFetchingNextPage} onPress={() => fetchNextPage()}><Text color={Colors.black}>{t('release.more')}</Text></TouchableOpacity>}
        </ScrollView>
      </KeyboardAvoidingView>
    </YStack>
    </ScreenWrapper>
  );
};

export default ReviewsScreen;
