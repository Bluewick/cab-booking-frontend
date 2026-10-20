import { useContext } from 'react';
import { SocketContext } from '../context/socketContextInstance';

/**
 * Custom React hook for consuming WebSocket connectivity, room subscriptions,
 * and real-time ride event listeners.
 */
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export default useSocket;
