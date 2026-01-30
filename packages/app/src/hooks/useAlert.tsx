import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertDialog, AlertType } from '../components/AlertDialog';
import { useBackHandler } from './useBackHandler';

interface AlertState {
    isOpen: boolean;
    type: AlertType;
    title?: string;
    message: string;
    onClose?: () => void;
}

interface AlertContextType {
    showAlert: (message: string, type?: AlertType, title?: string, onClose?: () => void) => void;
    showSuccess: (message: string, title?: string, onClose?: () => void) => void;
    showError: (message: string, title?: string, onClose?: () => void) => void;
    showWarning: (message: string, title?: string, onClose?: () => void) => void;
    showInfo: (message: string, title?: string, onClose?: () => void) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [alert, setAlert] = useState<AlertState>({
        isOpen: false,
        type: 'info',
        message: ''
    });

    const showAlert = useCallback((message: string, type: AlertType = 'info', title?: string, onClose?: () => void) => {
        console.log('[AlertProvider] showAlert called:', { message, type });
        setAlert({ isOpen: true, type, title, message, onClose });
    }, []);

    const showSuccess = useCallback((message: string, title?: string, onClose?: () => void) => {
        showAlert(message, 'success', title, onClose);
    }, [showAlert]);

    const showError = useCallback((message: string, title?: string, onClose?: () => void) => {
        showAlert(message, 'error', title, onClose);
    }, [showAlert]);

    const showWarning = useCallback((message: string, title?: string, onClose?: () => void) => {
        showAlert(message, 'warning', title, onClose);
    }, [showAlert]);

    const showInfo = useCallback((message: string, title?: string, onClose?: () => void) => {
        showAlert(message, 'info', title, onClose);
    }, [showAlert]);

    const handleClose = useCallback(() => {
        setAlert(prev => {
            if (prev.onClose) prev.onClose();
            return { ...prev, isOpen: false };
        });
    }, []);

    useBackHandler('alert-provider', async () => {
        if (alert.isOpen) {
            handleClose();
            return true;
        }
        return false;
    });

    return (
        <AlertContext.Provider value={{ showAlert, showSuccess, showError, showWarning, showInfo }}>
            {children}
            <AlertDialog
                isOpen={alert.isOpen}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onClose={handleClose}
            />
        </AlertContext.Provider>
    );
};

export const useAlert = (): AlertContextType => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
