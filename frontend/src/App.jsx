import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';

function App() {
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
