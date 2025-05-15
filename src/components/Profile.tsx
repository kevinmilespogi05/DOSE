import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { UserProfile, userProfileSchema, type UserProfileFormData } from '../types/user';
import { Camera } from 'lucide-react';
import api from '../lib/api';
import { showSuccessAlert, showErrorAlert } from '../utils/alerts';
import MFASetup from './auth/MFASetup';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema)
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/user/profile');
        
        // Process the profile data to ensure date_of_birth is in the correct format
        const profileData = { ...response.data };
        
        // If date_of_birth exists, convert to YYYY-MM-DD for the date input
        if (profileData.date_of_birth) {
          try {
            // Handle date formats consistently
            const dateObj = new Date(profileData.date_of_birth);
            if (!isNaN(dateObj.getTime())) {
              // Format as YYYY-MM-DD for the input element
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const day = String(dateObj.getDate()).padStart(2, '0');
              profileData.date_of_birth = `${year}-${month}-${day}`;
              
              console.log('Formatted date for display:', profileData.date_of_birth);
            }
          } catch (error) {
            console.error('Error formatting date:', error);
          }
        }
        
        console.log('Loaded profile data:', profileData);
        
        setProfile(profileData);
        reset(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
        showErrorAlert('Error', 'Failed to fetch profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [reset]);

  const onSubmit = async (data: UserProfileFormData) => {
    try {
      // Create a copy of the data to avoid modifying the original
      const formData = { ...data };
      
      // Format date_of_birth properly if it exists
      if (formData.date_of_birth) {
        const dateValue = formData.date_of_birth;
        console.log('Original date value:', dateValue);
        
        // Make sure the date is in YYYY-MM-DD format
        // The date input should already provide this format, but double-check
        if (dateValue) {
          try {
            // Parse the date properly handling various input formats
            let dateObj;
            
            // Check if the date is in DD/MM/YYYY format (European format)
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateValue)) {
              const [day, month, year] = dateValue.split('/').map(Number);
              // Note: JS months are 0-based, so subtract 1 from month
              dateObj = new Date(year, month - 1, day);
              console.log(`Parsed European format date: ${day}/${month}/${year} to:`, dateObj);
            } 
            // Handle ISO format YYYY-MM-DD (from the date input)
            else if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
              dateObj = new Date(dateValue);
              console.log('Parsed ISO format date:', dateObj);
            }
            // Try standard JS Date parsing as fallback
            else {
              dateObj = new Date(dateValue);
              console.log('Parsed date using standard parsing:', dateObj);
            }
            
            if (!isNaN(dateObj.getTime())) {
              // Format as YYYY-MM-DD
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const day = String(dateObj.getDate()).padStart(2, '0');
              formData.date_of_birth = `${year}-${month}-${day}`;
              
              console.log('Formatted date value for submission:', formData.date_of_birth);
            } else {
              console.warn('Invalid date detected, using original value');
            }
          } catch (e) {
            console.error('Error formatting date:', e);
          }
        }
      }
      
      console.log('Submitting profile data:', formData);
      console.log('Date of birth value:', formData.date_of_birth);
      console.log('Gender value:', formData.gender);
      
      const response = await api.put('/user/profile', formData);
      console.log('Profile update response:', response.data);
      
      setProfile({
        ...response.data,
        // Ensure the date is formatted correctly in the UI after update
        date_of_birth: response.data.date_of_birth ? new Date(response.data.date_of_birth).toISOString().split('T')[0] : null
      });
      
      setIsEditing(false);
      showSuccessAlert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Log more detailed error information
      console.error('Response data:', error.response?.data);
      console.error('Status code:', error.response?.status);
      
      if (error.response?.data?.errors) {
        // Show detailed validation errors
        const validationErrors = error.response.data.errors
          .map((err: any) => `${err.param}: ${err.msg}`)
          .join('\n');
        showErrorAlert('Validation Error', validationErrors);
      } else if (error.response?.data?.message) {
        showErrorAlert('Error', error.response.data.message);
      } else {
        showErrorAlert('Error', 'Failed to update profile');
      }
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setProfile(response.data);
      showSuccessAlert('Success', 'Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showErrorAlert('Error', 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Avatar Section */}
          <div className="p-6 bg-gray-50 border-b">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Camera size={32} />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer">
                  <Camera size={16} className="text-white" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <div>
                <h2 className="text-2xl font-semibold">
                  {profile?.first_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : user?.email}
                </h2>
                <p className="text-gray-600">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 required">
                  First Name
                </label>
                <input
                  type="text"
                  {...register('first_name')}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 required">
                  Last Name
                </label>
                <input
                  type="text"
                  {...register('last_name')}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 required">
                  Phone Number
                </label>
                <input
                  type="tel"
                  {...register('phone_number')}
                  disabled={!isEditing}
                  placeholder="+1234567890"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                />
                {errors.phone_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                  value={profile?.date_of_birth || ''}
                  {...register('date_of_birth', {
                    onChange: (e) => {
                      const value = e.target.value;
                      console.log('Date input changed:', value);
                      
                      if (profile) {
                        setProfile({
                          ...profile,
                          date_of_birth: value
                        });
                      }
                    }
                  })}
                />
                {errors.date_of_birth && (
                  <p className="mt-1 text-sm text-red-600">{errors.date_of_birth.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <select
                  {...register('gender')}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                {...register('address')}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  {...register('city')}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State/Province
                </label>
                <input
                  type="text"
                  {...register('state_province')}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                />
                {errors.state_province && (
                  <p className="mt-1 text-sm text-red-600">{errors.state_province.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  type="text"
                  {...register('country')}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                />
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <input
                  type="text"
                  {...register('postal_code')}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                />
                {errors.postal_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.postal_code.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                {...register('bio')}
                disabled={!isEditing}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
              )}
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    reset(profile || undefined);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication</h2>
          <MFASetup />
        </div>
      </div>
    </div>
  );
};

export default Profile;