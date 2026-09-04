"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Alert } from "@/lib/swal";
import { FaLock, FaUserShield } from "react-icons/fa";

export default function LoginAdmin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await signIn("credentials", {
        redirect: false,
        username: formData.username,
        password: formData.password
      });

      if (res?.error) {
        Alert.fire("Akses Ditolak", "Kredensial Admin tidak valid", "error");
      } else if (res?.ok) {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        
        if (session?.user?.role === "Santri") {
          Alert.fire("Ditolak", "Santri tidak diperkenankan mengakses halaman admin.", "warning");
          // logout them? Assuming they shouldn't log in here. 
          // They will be redirected to /portal by the backend if they force navigate, but let's push them out.
          router.push("/portal"); 
        } else {
          router.push("/admin");
        }
      }
    } catch (error) {
       Alert.fire("Oops", "Terjadi kesalahan sistem.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="card w-full max-w-md mx-4 shadow-2xl relative overflow-hidden bg-[#0d1117] border-gray-800">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-yellow-500"></div>
        <div className="text-center mb-8 mt-2">
          <div className="inline-block p-4 rounded-full bg-red-500/10 text-red-500 mb-4">
            <FaUserShield className="text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Login Administrator</h1>
          <p className="text-gray-500 text-sm">Halaman khusus Pengurus E-Markaz</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <FaUserShield />
              </span>
              <input 
                type="text" 
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                required 
                className="form-control pl-10" 
                placeholder="Username Admin"
              />
            </div>
          </div>
          
          <div className="form-group">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <FaLock />
              </span>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required 
                className="form-control pl-10" 
                placeholder="Password"
              />
            </div>
          </div>
          
          <button type="submit" disabled={isLoading} className="btn w-full py-3 mt-4 text-lg bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20">
            {isLoading ? "Otentikasi..." : "Akses Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
