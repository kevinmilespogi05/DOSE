import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mfaTokenSchema, type MFACredentials } from '../../types/auth';
import api from '../../lib/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/alerts';

const MFASetup: React.FC = () => {
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MFACredentials>({
    resolver: zodResolver(mfaTokenSchema),
  });

  useEffect(() => {
    const checkMFAStatus = async () => {
      try {
        const response = await api.get('/mfa/status');
        setIsEnabled(response.data.isEnabled);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking MFA status:', error);
        showErrorAlert('Error', 'Failed to check MFA status');
      }
    };

    checkMFAStatus();
  }, []);

  const handleSetup = async () => {
    try {
      const response = await api.post('/mfa/setup');
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
    } catch (error) {
      console.error('MFA setup error:', error);
      showErrorAlert('Error', 'Failed to setup MFA');
    }
  };

  const onSubmit = async (data: MFACredentials) => {
    try {
      const response = await api.post('/mfa/enable', data);
      setBackupCodes(response.data.backupCodes);
      setIsEnabled(true);
      showSuccessAlert('Success', 'MFA enabled successfully');
    } catch (error) {
      console.error('MFA enable error:', error);
      showErrorAlert('Error', 'Failed to enable MFA');
    }
  };

  const handleDisable = async (data: MFACredentials) => {
    try {
      await api.post('/mfa/disable', data);
      setIsEnabled(false);
      setQrCode('');
      setSecret('');
      setBackupCodes([]);
      showSuccessAlert('Success', 'MFA disabled successfully');
    } catch (error) {
      console.error('MFA disable error:', error);
      showErrorAlert('Error', 'Failed to disable MFA');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isEnabled) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">MFA is Enabled</h2>
        <form onSubmit={handleSubmit(handleDisable)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Enter MFA Code to Disable
            </label>
            <input
              type="text"
              {...register('token')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter 6-digit code"
            />
            {errors.token && (
              <p className="mt-1 text-sm text-red-600">{errors.token.message}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Disable MFA
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Setup MFA</h2>
      {!qrCode ? (
        <button
          onClick={handleSetup}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Start MFA Setup
        </button>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              1. Scan this QR code with your authenticator app:
            </p>
            <img src={qrCode} alt="QR Code" className="mx-auto" />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">
              2. Or manually enter this secret key:
            </p>
            <code className="block p-2 bg-gray-100 rounded text-sm break-all">
              {secret}
            </code>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                3. Enter the code from your authenticator app:
              </label>
              <input
                type="text"
                {...register('token')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter 6-digit code"
              />
              {errors.token && (
                <p className="mt-1 text-sm text-red-600">{errors.token.message}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Enable MFA
            </button>
          </form>
        </div>
      )}
      {backupCodes.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Backup Codes</h3>
          <p className="text-sm text-gray-600 mb-2">
            Save these backup codes in a secure place. You can use them to access your account if you lose your authenticator device.
          </p>
          <div className="bg-gray-100 p-4 rounded">
            <ul className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <li key={index} className="font-mono text-sm">
                  {code}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MFASetup; 