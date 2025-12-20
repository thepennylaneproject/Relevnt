import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ReactNode } from 'react';
import { LoadingSpinner } from '../shared/Spinner';

interface AuthGuardProps {
    children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner fullScreen size="lg" text="Authenticating..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}