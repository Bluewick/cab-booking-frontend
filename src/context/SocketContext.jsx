import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { SocketContext } from './socketContextInstance';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5213';

/**
 * Obsidian Geist Socket Provider
 * Robust Socket.IO v4 client managing JWT handshake, room lifecycle,
 * mid-trip auto-reconnection resubscriptions, and driver telemetry dispatches.
 */
export function SocketProvider({ children }) {
  const { token, user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(() =>
    token ? 'connecting' : 'disconnected'
  );
  const [socketId, setSocketId] = useState(null);
  const [activeRooms, setActiveRooms] = useState([]);
  const [activeRideId, setActiveRideId] = useState(null);

  const socketRef = useRef(null);
  const activeRideIdRef = useRef(null);

  // Synchronize ref with state for event callbacks
  useEffect(() => {
    activeRideIdRef.current = activeRideId;
  }, [activeRideId]);

  useEffect(() => {
    // Only establish WebSocket connection when authenticated with a JWT token
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setSocketId(null);
        setActiveRooms([]);
        setActiveRideId(null);
      }
      return;
    }

    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    const newSocket = io(SOCKET_URL, {
      auth: {
        token: cleanToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      setSocket(newSocket);
      setIsConnected(true);
      setConnectionStatus('connected');
      setSocketId(newSocket.id);

      // Resubscribe to mid-ride room if client reconnected after a network blip
      if (activeRideIdRef.current) {
        const rideToRejoin = activeRideIdRef.current;
        newSocket.emit('ride:join', { ride_id: rideToRejoin }, (response) => {
          if (response?.success) {
            setActiveRooms((prev) => Array.from(new Set([...prev, `ride:${rideToRejoin}`])));
          }
        });
      }
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      setSocketId(null);

      if (reason === 'io server disconnect') {
        // Disconnection was initiated by server, manual reconnect required
        setConnectionStatus('disconnected');
        newSocket.connect();
      } else {
        // Temporary network drop, Socket.IO automatically attempts reconnect
        setConnectionStatus('reconnecting');
      }
    });

    newSocket.on('connect_error', (error) => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      console.warn('[WebSocket] Handshake or transport error:', error.message);
    });

    newSocket.io.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting');
    });

    newSocket.io.on('reconnect', () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      showToast('Real-time connection restored', 'success');
    });

    // Global Emergency Alert Listeners
    newSocket.on('admin:emergency_alert', (payload) => {
      showToast(`EMERGENCY SOS: Ride #${payload.ride_id.slice(0, 8)} - ${payload.message}`, 'error');
    });

    newSocket.on('sos:alert_broadcast', (payload) => {
      showToast(`SOS Triggered: ${payload.message || 'Emergency services notified.'}`, 'error');
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [isAuthenticated, token, showToast]);

  /**
   * Joins dedicated room for an active ride (e.g. `ride:uuid`)
   */
  const joinRide = useCallback((rideId) => {
    return new Promise((resolve) => {
      if (!rideId) {
        return resolve({ success: false, message: 'rideId is required' });
      }

      setActiveRideId(rideId);

      if (!socketRef.current || !socketRef.current.connected) {
        setActiveRooms((prev) => Array.from(new Set([...prev, `ride:${rideId}`])));
        return resolve({
          success: true,
          pending: true,
          message: 'Saved active ride; will sync once connected.',
        });
      }

      socketRef.current.emit('ride:join', { ride_id: rideId }, (res) => {
        if (res?.success) {
          setActiveRooms((prev) => Array.from(new Set([...prev, `ride:${rideId}`])));
          resolve(res);
        } else {
          resolve(res || { success: false, message: 'Failed to join ride room.' });
        }
      });
    });
  }, []);

  /**
   * Leaves dedicated room for a completed or cancelled ride
   */
  const leaveRide = useCallback((rideId) => {
    return new Promise((resolve) => {
      if (!rideId) {
        return resolve({ success: false, message: 'rideId is required' });
      }

      setActiveRideId((current) => (current === rideId ? null : current));
      setActiveRooms((prev) => prev.filter((r) => r !== `ride:${rideId}`));

      if (!socketRef.current || !socketRef.current.connected) {
        return resolve({ success: true, message: 'Left ride room locally.' });
      }

      socketRef.current.emit('ride:leave', { ride_id: rideId }, (res) => {
        resolve(res || { success: true, message: `Left room ride:${rideId}` });
      });
    });
  }, []);

  /**
   * Emits live driver telemetry to backend and currently assigned ride room
   */
  const updateDriverLocation = useCallback((telemetry) => {
    return new Promise((resolve) => {
      if (!socketRef.current || !socketRef.current.connected) {
        return resolve({ success: false, message: 'WebSocket offline' });
      }

      socketRef.current.emit('driver:update_location', telemetry, (res) => {
        resolve(res || { success: true });
      });
    });
  }, []);

  /**
   * Subscribes to an incoming WebSocket event with automatic unsubscription cleanup
   */
  const subscribe = useCallback((eventName, handler) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(eventName, handler);
    return () => {
      socketRef.current?.off(eventName, handler);
    };
  }, []);

  const contextValue = {
    socket,
    isConnected,
    connectionStatus,
    socketId,
    activeRooms,
    activeRideId,
    userRole: user?.role,
    joinRide,
    leaveRide,
    updateDriverLocation,
    subscribe,
  };

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
}

export default SocketProvider;
