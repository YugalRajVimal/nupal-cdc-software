import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

type TherapistProfile = {
  _id?: string;
  name?: string;
  email?: string;
  mobile1?: string;
  role?: string;
  // Add other relevant fields as per backend response
  [key: string]: any;
};

export default function TherpaistProfile() {
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/therapist/profile`);
        const json = await res.json();
        if (json.success) {
          setProfile(json.data);
        } else {
          setError(json.message || "Failed to load profile");
        }
      } catch (e: any) {
        setError(e?.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-gray-600 text-lg">Loading profile...</div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">Error: {error}</div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-gray-500">No profile found.</div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded shadow">
      <h2 className="text-2xl mb-6 font-bold text-purple-700">Therapist Profile</h2>
      <div className="space-y-4">
        {profile.name && (
          <div>
            <span className="font-semibold">Name:</span> {profile.name}
          </div>
        )}
        {profile.email && (
          <div>
            <span className="font-semibold">Email:</span> {profile.email}
          </div>
        )}
        {profile.mobile1 && (
          <div>
            <span className="font-semibold">Mobile:</span> {profile.mobile1}
          </div>
        )}
        {profile.role && (
          <div>
            <span className="font-semibold">Role:</span> {profile.role}
          </div>
        )}
        {/* You can add more profile fields below as needed */}
        <div className="text-sm text-gray-400 mt-4">ID: {profile._id}</div>
      </div>
    </div>
  );
}
