// Asosiy tab navigatsiya / Main tab navigation
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { House, Grid3X3, ShoppingCart, Package, User } from 'lucide-react-native';
import RatingModal from '../components/RatingModal';
import { useTranslation } from 'react-i18next';
import { useColors } from '../theme/useColors';
import { useCartStore } from '../store/cartStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import HomeScreen           from '../screens/home/HomeScreen';
import CatalogScreen        from '../screens/catalog/CatalogScreen';
import CategoryScreen       from '../screens/catalog/CategoryScreen';
import ProductScreen        from '../screens/product/ProductScreen';
import ReviewsScreen        from '../screens/product/ReviewsScreen';
import CartScreen           from '../screens/cart/CartScreen';
import CheckoutScreen       from '../screens/checkout/CheckoutScreen';
import PaymentScreen        from '../screens/checkout/PaymentScreen';
import OrderSuccessScreen   from '../screens/checkout/OrderSuccessScreen';
import OrdersScreen         from '../screens/order/OrdersScreen';
import OrderDetailScreen    from '../screens/order/OrderDetailScreen';
import ProfileScreen        from '../screens/profile/ProfileScreen';
import EditProfileScreen    from '../screens/profile/EditProfileScreen';
import FavoritesScreen      from '../screens/profile/FavoritesScreen';
import BonusScreen          from '../screens/bonus/BonusScreen';
import SupportScreen        from '../screens/profile/SupportScreen';
import StoreInfoScreen      from '../screens/profile/StoreInfoScreen';
import FAQScreen            from '../screens/profile/FAQScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import ContactsScreen       from '../screens/contacts/ContactsScreen';
import PromotionsScreen       from '../screens/promotions/PromotionsScreen';
import PromotionDetailScreen  from '../screens/promotions/PromotionDetailScreen';
import NotificationsScreen    from '../screens/notifications/NotificationsScreen';

const Tab = createBottomTabNavigator();
const HomeStack    = createStackNavigator();
const CatalogStack = createStackNavigator();
const CartStack    = createStackNavigator();
const OrdersStack  = createStackNavigator();
const ProfileStack = createStackNavigator();

const HomeStackNav = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="Home"             component={HomeScreen} />
    <HomeStack.Screen name="Notifications"    component={NotificationsScreen} />
    <HomeStack.Screen name="Product"          component={ProductScreen} />
    <HomeStack.Screen name="Reviews"          component={ReviewsScreen} />
    <HomeStack.Screen name="Category"         component={CategoryScreen} />
    <HomeStack.Screen name="Support"          component={SupportScreen} />
    <HomeStack.Screen name="Promotions"       component={PromotionsScreen} />
    <HomeStack.Screen name="PromotionDetail"  component={PromotionDetailScreen} />
  </HomeStack.Navigator>
);

const CatalogStackNav = () => (
  <CatalogStack.Navigator screenOptions={{ headerShown: false }}>
    <CatalogStack.Screen name="Catalog"   component={CatalogScreen} />
    <CatalogStack.Screen name="Category"  component={CategoryScreen} />
    <CatalogStack.Screen name="Product"   component={ProductScreen} />
    <CatalogStack.Screen name="Reviews"   component={ReviewsScreen} />
    <CatalogStack.Screen name="Contacts"  component={ContactsScreen} />
  </CatalogStack.Navigator>
);

const CartStackNav = () => (
  <CartStack.Navigator screenOptions={{ headerShown: false }}>
    <CartStack.Screen name="Cart"         component={CartScreen} />
    <CartStack.Screen name="Checkout"     component={CheckoutScreen} />
    <CartStack.Screen name="Payment"      component={PaymentScreen} />
    <CartStack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
  </CartStack.Navigator>
);

const OrdersStackNav = () => (
  <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
    <OrdersStack.Screen name="Orders"      component={OrdersScreen} />
    <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} />
  </OrdersStack.Navigator>
);

const ProfileStackNav = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="Profile"        component={ProfileScreen} />
    <ProfileStack.Screen name="EditProfile"    component={EditProfileScreen} />
    <ProfileStack.Screen name="Favorites"      component={FavoritesScreen} />
    <ProfileStack.Screen name="Product"        component={ProductScreen} />
    <ProfileStack.Screen name="Reviews"        component={ReviewsScreen} />
    <ProfileStack.Screen name="BonusCard"      component={BonusScreen} />
    <ProfileStack.Screen name="StoreInfo"      component={StoreInfoScreen} />
    <ProfileStack.Screen name="FAQ"            component={FAQScreen} />
    <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
  </ProfileStack.Navigator>
);

const MainNavigator = () => {
  const { t } = useTranslation();
  const Colors = useColors();
  const totalItems = useCartStore(s => s.totalItems());
  const insets = useSafeAreaInsets();

  return (
    <>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   Colors.yellow,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNav}
        listeners={({ navigation: nav }) => ({
          tabPress: (e) => {
            e.preventDefault();
            nav.navigate('HomeTab', { screen: 'Home' });
          },
        })}
        options={{ tabBarLabel: t('nav.home'), tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }}
      />
      <Tab.Screen
        name="CatalogTab"
        component={CatalogStackNav}
        options={{ tabBarLabel: t('nav.catalog'), tabBarIcon: ({ color, size }) => <Grid3X3 color={color} size={size} /> }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartStackNav}
        options={{
          tabBarLabel: t('nav.cart'),
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.yellow, color: Colors.black },
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNav}
        options={{ tabBarLabel: t('nav.orders'), tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNav}
        listeners={({ navigation: nav }) => ({
          tabPress: (e) => {
            e.preventDefault();
            nav.navigate('ProfileTab', { screen: 'Profile' });
          },
        })}
        options={{ tabBarLabel: t('nav.profile'), tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
    <RatingModal />
    </>
  );
};

export default MainNavigator;
