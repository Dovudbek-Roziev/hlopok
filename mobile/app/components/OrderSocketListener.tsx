import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { toast } from '../store/toastStore';
import { SOCKET_URL } from '../utils/config';

const OrderSocketListener = () => {
  const { token, isAuthenticated } = useAuthStore();
  const { addNotif } = useAppStore();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = io(SOCKET_URL, { auth: { token } });

    socket.on('order_status_updated', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.orderId] });
      if (data.status === 'ready') {
        queryClient.invalidateQueries({ queryKey: ['pending-ratings'] });
      }
      addNotif({
        orderNumber: data.orderNumber,
        status: data.status,
        orderId: data.orderId,
      });
      const tr = tRef.current;
      toast.info(`${tr('orders.orderNumber')} ${data.orderNumber}: ${tr(`orders.status_${data.status}`)}`);
    });

    return () => { socket.disconnect(); };
  }, [isAuthenticated, token]);

  return null;
};

export default OrderSocketListener;
