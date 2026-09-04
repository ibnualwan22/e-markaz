"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Alert } from "@/lib/swal";
import Link from "next/link";
import { FaLock, FaUser } from "react-icons/fa";

export default function Login() {
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
        Alert.fire("Akses Ditolak", "Username atau Password Anda salah", "error");
      } else if (res?.ok) {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        
        if (session?.user?.role === "Santri") {
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
      <div className="card w-full max-w-md mx-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
        <div className="text-center mb-8 mt-2">
          <h1 className="text-3xl font-bold text-white mb-2">E-Markaz</h1>
          <p className="text-gray-400">Portal Login Khusus Santri</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <FaUser />
              </span>
              <input 
                type="text" 
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                required 
                className="form-control pl-10" 
                placeholder="Masukkan username"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
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
                placeholder="Masukkan password"
              />
            </div>
          </div>
          
          <button type="submit" disabled={isLoading} className="btn btn-primary w-full py-3 mt-4 text-lg">
            {isLoading ? "Validasi..." : "Masuk"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
