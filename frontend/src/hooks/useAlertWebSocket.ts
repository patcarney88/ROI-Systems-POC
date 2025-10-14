/**
 * WebSocket Hook for Real-time Alert Updates
 * Manages WebSocket connection and event handling
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Alert,
  WebSocketEventType,
  WebSocketMessage,
  AlertPriority
} from '../types/alert.types';

/**
 * WebSocket connection status
 */
export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
  RECONNECTING = 'RECONNECTING'
}

/**
 * WebSocket hook configuration
 */
interface UseAlertWebSocketConfig {
  userId?: string;
  enabled?: boolean;
  onNewAlert?: (alert: Alert) => void;
  onAlertUpdated?: (alert: Partial<Alert>) => void;
  onAlertAssigned?: (alert: Alert) => void;
  onAlertDeleted?: (alertId: string) => void;
  showNotifications?: boolean;
  notificationPriorities?: AlertPriority[];
}

/**
 * WebSocket hook return type
 */
interface UseAlertWebSocketReturn {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

/**
 * Get WebSocket URL from environment or default
 */
const getWebSocketUrl = (): string => {
  return import.meta.env.VITE_WS_URL || 'http://localhost:3000';
};

/**
 * Show browser notification for critical/high priority alerts
 */
const showBrowserNotification = (alert: Alert) => {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(`${alert.priority} Priority Alert`, {
      body: `${alert.type}: ${alert.user.name} - ${alert.confidenceScore}% confidence`,
      icon: '/alert-icon.png',
      badge: '/alert-badge.png',
      tag: alert.id,
      requireInteraction: alert.priority === AlertPriority.CRITICAL,
      silent: false
    });

    notification.onclick = () => {
      window.focus();
      // Navigate to alert details
      window.location.hash = `#alert/${alert.id}`;
      notification.close();
    };
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        showBrowserNotification(alert);
      }
    });
  }
};

/**
 * Custom hook for WebSocket connection and alert updates
 */
export const useAlertWebSocket = (
  config: UseAlertWebSocketConfig = {}
): UseAlertWebSocketReturn => {
  const {
    userId,
    enabled = true,
    onNewAlert,
    onAlertUpdated,
    onAlertAssigned,
    onAlertDeleted,
    showNotifications = true,
    notificationPriorities = [AlertPriority.CRITICAL, AlertPriority.HIGH]
  } = config;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  /**
   * Initialize WebSocket connection
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    if (!enabled) {
      console.log('WebSocket disabled by configuration');
      return;
    }

    try {
      setConnectionStatus(ConnectionStatus.CONNECTING);
      setError(null);

      const wsUrl = getWebSocketUrl();
      console.log('Connecting to WebSocket:', wsUrl);

      // Create socket connection
      const socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay,
        reconnectionAttempts: maxReconnectAttempts,
        auth: {
          token: localStorage.getItem('auth_token')
        },
        query: userId ? { userId } : undefined
      });

      // Connection successful
      socket.on('connect', () => {
        console.log('WebSocket connected:', socket.id);
        setConnectionStatus(ConnectionStatus.CONNECTED);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Subscribe to user-specific alert channel
        if (userId) {
          socket.emit('subscribe', { userId });
        }
      });

      // Connection error
      socket.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err);
        setConnectionStatus(ConnectionStatus.ERROR);
        setError(new Error(`Connection failed: ${err.message}`));
      });

      // Disconnection
      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setConnectionStatus(ConnectionStatus.DISCONNECTED);

        // Attempt reconnection if not intentional disconnect
        if (reason !== 'io client disconnect' && enabled) {
          attemptReconnect();
        }
      });

      // Reconnection attempt
      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`WebSocket reconnection attempt ${attemptNumber}`);
        setConnectionStatus(ConnectionStatus.RECONNECTING);
        reconnectAttemptsRef.current = attemptNumber;
      });

      // Reconnection successful
      socket.on('reconnect', (attemptNumber) => {
        console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
        setConnectionStatus(ConnectionStatus.CONNECTED);
        setError(null);
        reconnectAttemptsRef.current = 0;
      });

      // Reconnection failed
      socket.on('reconnect_failed', () => {
        console.error('WebSocket reconnection failed');
        setConnectionStatus(ConnectionStatus.ERROR);
        setError(new Error('Failed to reconnect after maximum attempts'));
      });

      // New alert event
      socket.on(WebSocketEventType.NEW_ALERT, (alert: Alert) => {
        console.log('New alert received:', alert);

        const message: WebSocketMessage = {
          type: WebSocketEventType.NEW_ALERT,
          payload: alert,
          timestamp: new Date().toISOString()
        };

        setLastMessage(message);

        // Show notification if configured
        if (
          showNotifications &&
          notificationPriorities.includes(alert.priority)
        ) {
          showBrowserNotification(alert);
        }

        // Call callback if provided
        if (onNewAlert) {
          onNewAlert(alert);
        }
      });

      // Alert updated event
      socket.on(WebSocketEventType.ALERT_UPDATED, (data: Partial<Alert>) => {
        console.log('Alert updated:', data);

        const message: WebSocketMessage = {
          type: WebSocketEventType.ALERT_UPDATED,
          payload: data,
          timestamp: new Date().toISOString()
        };

        setLastMessage(message);

        if (onAlertUpdated) {
          onAlertUpdated(data);
        }
      });

      // Alert assigned event
      socket.on(WebSocketEventType.ALERT_ASSIGNED, (alert: Alert) => {
        console.log('Alert assigned:', alert);

        const message: WebSocketMessage = {
          type: WebSocketEventType.ALERT_ASSIGNED,
          payload: alert,
          timestamp: new Date().toISOString()
        };

        setLastMessage(message);

        if (onAlertAssigned) {
          onAlertAssigned(alert);
        }
      });

      // Alert deleted event
      socket.on(WebSocketEventType.ALERT_DELETED, (alertId: string) => {
        console.log('Alert deleted:', alertId);

        const message: WebSocketMessage = {
          type: WebSocketEventType.ALERT_DELETED,
          payload: { id: alertId },
          timestamp: new Date().toISOString()
        };

        setLastMessage(message);

        if (onAlertDeleted) {
          onAlertDeleted(alertId);
        }
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('Error initializing WebSocket:', err);
      setConnectionStatus(ConnectionStatus.ERROR);
      setError(err as Error);
    }
  }, [
    enabled,
    userId,
    onNewAlert,
    onAlertUpdated,
    onAlertAssigned,
    onAlertDeleted,
    showNotifications,
    notificationPriorities
  ]);

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting WebSocket');
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  /**
   * Manual reconnection
   */
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => connect(), 1000);
  }, [connect, disconnect]);

  /**
   * Attempt automatic reconnection with exponential backoff
   */
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      setConnectionStatus(ConnectionStatus.ERROR);
      setError(new Error('Unable to reconnect to server'));
      return;
    }

    const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
    console.log(`Attempting reconnection in ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      connect();
    }, delay);
  }, [connect]);

  /**
   * Initialize connection on mount
   */
  useEffect(() => {
    if (enabled) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    connectionStatus,
    isConnected: connectionStatus === ConnectionStatus.CONNECTED,
    lastMessage,
    error,
    connect,
    disconnect,
    reconnect
  };
};

export default useAlertWebSocket;
