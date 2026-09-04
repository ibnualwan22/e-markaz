"use client";

import { useState, useEffect } from "react";
import { Alert } from "@/lib/swal";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Periode { id: string; nama: string; }
interface Program { id: string; nama: string; harga: number; deskripsi: string; }
interface Wilayah { id: string; name: string; }

export default function Pendaftaran() {
  const router = useRouter();
  
  // Data Master
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [provinces, setProvinces] = useState<Wilayah[]>([]);
  const [cities, setCities] = useState<Wilayah[]>([]);
  const [districts, setDistricts] = useState<Wilayah[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    namaLengkap: "",
    jenisKelamin: "",
    tempatLahir: "",
    tanggalLahir: "",
    noWa: "",
    email: "",
    provinsiId: "",
    kotaId: "",
    kecamatanId: "",
    detailAlamat: "",
    periodeId: "",
    programId: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  // Load Initial Data & Cache
  useEffect(() => {
    const cached = localStorage.getItem("emarkaz_form_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setFormData(parsed);
      } catch (e) {}
    }

    fetch("/api/pendaftaran/periode").then(r => r.json()).then(setPeriodes);
    fetch("/api/pendaftaran/program").then(r => r.json()).then(data => {
      // Pastikan ada data dan array valid
      if (Array.isArray(data)) setPrograms(data);
    });
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then(r => r.json()).then(setProvinces).catch(console.error);
  }, []);

  // Save to Cache
  useEffect(() => {
    localStorage.setItem("emarkaz_form_cache", JSON.stringify(formData));
  }, [formData]);

  // Handle cascading dropdown Wilayah
  useEffect(() => {
    if (formData.provinsiId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${formData.provinsiId}.json`)
        .then(r => r.json()).then(setCities).catch(console.error);
    }
  }, [formData.provinsiId]);

  useEffect(() => {
    if (formData.kotaId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${formData.kotaId}.json`)
        .then(r => r.json()).then(setDistricts).catch(console.error);
    }
  }, [formData.kotaId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/pendaftaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        Alert.fire({
          icon: 'success',
          title: 'Pendaftaran Berhasil!',
          html: `
            <div class="text-left mt-4 border-t border-gray-700 pt-4">
              <p>Mohon segera lakukan pembayaran ke Rekening BSI no: <b>1234567890</b></p>
              <br/>
              <p>Total tagihan: <b class="text-xl text-blue-500">Rp ${data.data.totalBiaya.toLocaleString('id-ID')}</b></p>
              <p class="text-sm text-yellow-500">Penting: Transfer nominal HINGGA 3 DIGIT TERAKHIR sesuai total di atas agar validasi cepat.</p>
              <br/>
              <p>Akun santri Anda akan digenerate otomatis setelah admin memvalidasi pembayaran Anda.</p>
            </div>
          `,
          confirmButtonText: 'Kembali Ke Beranda',
        }).then(() => {
          router.push('/');
        });
      } else {
        Alert.fire('Gagal', data.error || 'Terjadi kesalahan sistem', 'error');
      }
    } catch (error) {
      Alert.fire('Oops...', 'Terjadi masalah pada jaringan. Silakan coba lagi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProgram = programs.find(p => p.id === formData.programId);

  return (
    <div className="min-h-screen pt-20 px-4 md:px-8 bg-background">
      <div className="max-w-3xl mx-auto pb-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Formulir Pendaftaran</h1>
            <p className="text-gray-400">Silakan lengkapi data diri Anda.</p>
          </div>
          <Link href="/" className="btn btn-secondary">Kembali</Link>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          
          <div className="border-b border-gray-800 pb-4 mb-4">
            <h2 className="text-xl font-semibold text-blue-400">Pilih Program & Periode</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Periode Pendaftaran <span className="text-red-500">*</span></label>
              <select name="periodeId" value={formData.periodeId} onChange={handleChange} required className="form-control">
                <option value="">-- Pilih Periode Aktif --</option>
                {periodes.map(p => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Program <span className="text-red-500">*</span></label>
              <select name="programId" value={formData.programId} onChange={handleChange} required className="form-control">
                <option value="">-- Pilih Program --</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.nama} - Rp {p.harga.toLocaleString('id-ID')}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedProgram && (
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-200">{selectedProgram.deskripsi}</p>
            </div>
          )}

          <div className="border-b border-gray-800 pb-4 mb-4 mt-8">
            <h2 className="text-xl font-semibold text-blue-400">Data Diri</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Lengkap Sesuai KTP <span className="text-red-500">*</span></label>
            <input type="text" name="namaLengkap" value={formData.namaLengkap} onChange={handleChange} required className="form-control" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Jenis Kelamin <span className="text-red-500">*</span></label>
              <select name="jenisKelamin" value={formData.jenisKelamin} onChange={handleChange} required className="form-control">
                <option value="">-- Pilih --</option>
                <option value="LAKI_LAKI">Ikhwan (Laki-laki)</option>
                <option value="PEREMPUAN">Akhawat (Perempuan)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-control" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Tempat Lahir <span className="text-red-500">*</span></label>
              <input type="text" name="tempatLahir" value={formData.tempatLahir} onChange={handleChange} required className="form-control" />
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal Lahir <span className="text-red-500">*</span></label>
              <input type="date" name="tanggalLahir" value={formData.tanggalLahir} onChange={handleChange} required className="form-control" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">No. WhatsApp <span className="text-red-500">*</span></label>
            <input type="tel" name="noWa" value={formData.noWa} onChange={handleChange} required className="form-control" placeholder="Contoh: 08123456789" />
          </div>

          <div className="border-b border-gray-800 pb-4 mb-4 mt-8">
            <h2 className="text-xl font-semibold text-blue-400">Alamat Lengkap</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Provinsi <span className="text-red-500">*</span></label>
              <select name="provinsiId" value={formData.provinsiId} onChange={handleChange} required className="form-control">
                <option value="">-- Pilih --</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Kabupaten / Kota <span className="text-red-500">*</span></label>
              <select name="kotaId" value={formData.kotaId} onChange={handleChange} required disabled={!formData.provinsiId} className="form-control">
                <option value="">-- Pilih --</option>
                {cities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Kecamatan <span className="text-red-500">*</span></label>
              <select name="kecamatanId" value={formData.kecamatanId} onChange={handleChange} required disabled={!formData.kotaId} className="form-control">
                <option value="">-- Pilih --</option>
                {districts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Detail Alamat (Jalan/Rt/Rw) <span className="text-red-500">*</span></label>
            <textarea name="detailAlamat" value={formData.detailAlamat} onChange={handleChange} required className="form-control" placeholder="Tuliskan nama jalan, no rumah, RT/RW..."></textarea>
          </div>

          <div className="pt-6">
            <button type="submit" disabled={isLoading} className="btn btn-primary w-full justify-center py-3 text-lg font-bold">
              {isLoading ? "Mengirim Data..." : "Submit Pendaftaran"}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
