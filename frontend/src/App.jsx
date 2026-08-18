import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { initNativeAppListeners } from './lib/native/nativeManager';

function App() {
  useEffect(() => {
    initNativeAppListeners(() => {
      console.log('App resumed: Triggering resync...');
    });
  }, []);

  return (
    <AuthProvider>
      <WebSocketProvider>
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
