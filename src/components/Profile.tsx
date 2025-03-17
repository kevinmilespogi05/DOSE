import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Shield, Edit } from 'lucide-react';
import axiosInstance from '../utils/axios';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get('/api/user/profile');
        setProfile(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch profile');
        setLoading(false);
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div className="p-4">Loading profile...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!profile) return <div className="p-4">No profile data found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-6">
          <div className="flex items-center">
            <div className="bg-white p-3 rounded-full">
              <User className="w-16 h-16 text-blue-600" />
            </div>
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
              <p className="text-blue-100">{profile.role}</p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <Mail className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-lg font-medium">{profile.email}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <Shield className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-lg font-medium capitalize">{profile.role}</p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-lg font-medium">
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end">
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Additional Information */}
        <div className="border-t border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Two-Factor Authentication</span>
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                Enable
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Change Password</span>
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;