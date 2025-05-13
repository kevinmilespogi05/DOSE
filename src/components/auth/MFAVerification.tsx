import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mfaTokenSchema, backupCodeSchema, type MFACredentials, type BackupCodeCredentials } from '../../types/auth';
import api from '../../lib/api';
import { showErrorAlert } from '../../utils/alerts';

interface MFAVerificationProps {
  email: string;
  onSuccess: (token: string) => void;
}

const MFAVerification: React.FC<MFAVerificationProps> = ({ email, onSuccess }) => {
  const [useBackupCode, setUseBackupCode] = useState(false);
  
  const {
    register: registerToken,
    handleSubmit: handleSubmitToken,
    formState: { errors: tokenErrors },
  } = useForm<MFACredentials>({
    resolver: zodResolver(mfaTokenSchema),
  });

  const {
    register: registerBackup,
    handleSubmit: handleSubmitBackup,
    formState: { errors: backupErrors },
  } = useForm<BackupCodeCredentials>({
    resolver: zodResolver(backupCodeSchema),
  });

  const onSubmitToken = async (data: MFACredentials) => {
    try {
      const response = await api.post('/auth/verify-mfa', {
        email,
        token: data.token,
      });
      onSuccess(response.data.token);
    } catch (error) {
      console.error('MFA verification error:', error);
      showErrorAlert('Error', 'Invalid MFA code');
    }
  };

  const onSubmitBackup = async (data: BackupCodeCredentials) => {
    try {
      const response = await api.post('/auth/verify-backup', {
        email,
        code: data.code,
      });
      onSuccess(response.data.token);
    } catch (error) {
      console.error('Backup code verification error:', error);
      showErrorAlert('Error', 'Invalid backup code');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication</h2>
      {!useBackupCode ? (
        <>
          <form onSubmit={handleSubmitToken(onSubmitToken)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enter the code from your authenticator app
              </label>
              <input
                type="text"
                {...registerToken('token')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter 6-digit code"
                autoComplete="one-time-code"
              />
              {tokenErrors.token && (
                <p className="mt-1 text-sm text-red-600">{tokenErrors.token.message}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Verify
            </button>
          </form>
          <button
            onClick={() => setUseBackupCode(true)}
            className="mt-4 w-full text-sm text-blue-600 hover:text-blue-500"
          >
            Use backup code instead
          </button>
        </>
      ) : (
        <>
          <form onSubmit={handleSubmitBackup(onSubmitBackup)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enter a backup code
              </label>
              <input
                type="text"
                {...registerBackup('code')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter 8-character backup code"
              />
              {backupErrors.code && (
                <p className="mt-1 text-sm text-red-600">{backupErrors.code.message}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Verify
            </button>
          </form>
          <button
            onClick={() => setUseBackupCode(false)}
            className="mt-4 w-full text-sm text-blue-600 hover:text-blue-500"
          >
            Use authenticator app instead
          </button>
        </>
      )}
    </div>
  );
};

export default MFAVerification; 