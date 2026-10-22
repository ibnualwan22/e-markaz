"use client";

import { useState, useEffect } from "react";
import { Alert } from "@/lib/swal";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Periode { id: string; nama: string; }
interface Program { id: string; nama: string; harga: number; deskripsi: string; }
interface Wilayah { id: string; name: string; }

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-red-400">{message}</p>;
}

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
    username: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fieldClass = (name: string) => `form-control ${errors[name] ? "form-control-error" : ""}`;

  // Load Initial Data & Cache
  useEffect(() => {
    const cached = localStorage.getItem("emarkaz_form_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setFormData(parsed);
      } catch (e) {}
    }

    fetch("/api/pendaftaran/periode").then(r => r.json()).then(data => {
      setPeriodes(data);
      // Auto-pilih periode jika hanya ada satu (statis)
      if (Array.isArray(data) && data.length === 1) {
        setFormData(prev => ({ ...prev, periodeId: data[0].id }));
      }
    });
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
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const f = formData;
    if (!f.username.trim()) e.username = "Username wajib diisi";
    else if (f.username.trim().length < 4) e.username = "Username minimal 4 karakter";
    if (!f.password) e.password = "Password wajib diisi";
    else if (f.password.length < 6) e.password = "Password minimal 6 karakter";
    if (!f.periodeId) e.periodeId = "Periode wajib dipilih";
    if (!f.programId) e.programId = "Program wajib dipilih";
    if (!f.namaLengkap.trim()) e.namaLengkap = "Nama lengkap wajib diisi";
    if (!f.jenisKelamin) e.jenisKelamin = "Jenis kelamin wajib dipilih";
    if (!f.email.trim()) e.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Format email tidak valid";
    if (!f.tempatLahir.trim()) e.tempatLahir = "Tempat lahir wajib diisi";
    if (!f.tanggalLahir) e.tanggalLahir = "Tanggal lahir wajib diisi";
    else if (f.tanggalLahir > new Date().toISOString().slice(0, 10)) e.tanggalLahir = "Tanggal lahir tidak boleh di masa depan";
    const digits = f.noWa.replace(/\D/g, "");
    if (!f.noWa.trim()) e.noWa = "No. WhatsApp wajib diisi";
    else if (digits.length < 9 || digits.length > 15) e.noWa = "No. WhatsApp tidak valid. Contoh: 08123456789";
    if (!f.provinsiId) e.provinsiId = "Provinsi wajib dipilih";
    if (!f.kotaId) e.kotaId = "Kabupaten/Kota wajib dipilih";
    if (!f.kecamatanId) e.kecamatanId = "Kecamatan wajib dipilih";
    if (!f.detailAlamat.trim()) e.detailAlamat = "Detail alamat wajib diisi";
    return e;
  };

  const fokusKeField = (name: string) => {
    setTimeout(() => {
      const el = document.querySelector(`[name="${name}"]`) as HTMLElement | null;
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus({ preventScroll: true });
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      fokusKeField(Object.keys(validationErrors)[0]);
      return;
    }
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
              <p>Mohon segera lakukan pembayaran ke Rekening BRI no: <b>0555-0100-1126-567</b> a.n. Markaz Arabiyah</p>
              <br/>
              <p>Total tagihan: <b class="text-xl text-blue-500">Rp ${data.data.totalBiaya.toLocaleString('id-ID')}</b></p>
              <p class="text-sm text-yellow-500">Penting: Transfer nominal HINGGA 3 DIGIT TERAKHIR sesuai total di atas agar validasi cepat.</p>
              <br/>
              <p>Detail pembayaran juga telah dikirim ke WhatsApp Anda.</p>
              <p class="text-sm text-gray-400 mt-2">Gunakan username dan password yang Anda buat untuk login di portal santri setelah pembayaran divalidasi admin.</p>
            </div>
          `,
          confirmButtonText: 'Kembali Ke Beranda',
        }).then(() => {
          router.push('/');
        });
      } else {
        // Error yang terkait field tertentu ditampilkan di bawah field-nya, bukan popup
        if (data.error?.includes("Username")) {
          setErrors({ username: data.error });
          fokusKeField("username");
        } else if (data.error?.includes("Password")) {
          setErrors({ password: data.error });
          fokusKeField("password");
        } else if (data.error?.includes("Program")) {
          setErrors({ programId: data.error });
          fokusKeField("programId");
        } else {
          Alert.fire('Gagal', data.error || 'Terjadi kesalahan sistem', 'error');
        }
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

        <form onSubmit={handleSubmit} noValidate className="card space-y-6">

          <div className="bg-green-900/20 border border-green-800 rounded-lg p-5">
            <h2 className="text-xl font-semibold text-green-400 mb-4">Akun Login Portal Santri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Username <span className="text-red-500">*</span></label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} required minLength={4} className={fieldClass("username")} placeholder="Pilih username unik" />
                <FieldError message={errors.username} />
              </div>
              <div className="form-group">
                <label className="form-label">Password <span className="text-red-500">*</span></label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} className={fieldClass("password")} placeholder="Minimal 6 karakter" />
                <FieldError message={errors.password} />
              </div>
            </div>
            <p className="text-sm text-yellow-500 mt-2">Ingat sandi baik-baik untuk login di portal santri.</p>
            <p className="text-sm text-gray-400 mt-2">
              Sudah punya akun? <Link href="/santri/login" className="text-blue-400 hover:underline font-semibold">Login di sini</Link>
            </p>
          </div>

          <div className="border-b border-gray-800 pb-4 mb-4">
            <h2 className="text-xl font-semibold text-blue-400">Pilih Program & Periode</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Periode Pendaftaran <span className="text-red-500">*</span></label>
              {periodes.length === 1 ? (
                <div className="form-control bg-gray-800/50 flex items-center font-semibold text-green-400">
                  {periodes[0].nama}
                  <input type="hidden" name="periodeId" value={periodes[0].id} />
                </div>
              ) : (
                <select name="periodeId" value={formData.periodeId} onChange={handleChange} required className={fieldClass("periodeId")}>
                  <option value="">-- Pilih Periode Aktif --</option>
                  {periodes.map(p => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              )}
              <FieldError message={errors.periodeId} />
            </div>
            <div className="form-group">
              <label className="form-label">Program <span className="text-red-500">*</span></label>
              <select name="programId" value={formData.programId} onChange={handleChange} required className={fieldClass("programId")}>
                <option value="">-- Pilih Program --</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.nama} - Rp {p.harga.toLocaleString('id-ID')}</option>
                ))}
              </select>
              <FieldError message={errors.programId} />
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
            <input type="text" name="namaLengkap" value={formData.namaLengkap} onChange={handleChange} required className={fieldClass("namaLengkap")} />
            <FieldError message={errors.namaLengkap} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Jenis Kelamin <span className="text-red-500">*</span></label>
              <select name="jenisKelamin" value={formData.jenisKelamin} onChange={handleChange} required className={fieldClass("jenisKelamin")}>
                <option value="">-- Pilih --</option>
                <option value="LAKI_LAKI">Ikhwan (Laki-laki)</option>
                <option value="PEREMPUAN">Akhawat (Perempuan)</option>
              </select>
              <FieldError message={errors.jenisKelamin} />
            </div>
            <div className="form-group">
              <label className="form-label">Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className={fieldClass("email")} />
              <FieldError message={errors.email} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Tempat Lahir <span className="text-red-500">*</span></label>
              <input type="text" name="tempatLahir" value={formData.tempatLahir} onChange={handleChange} required className={fieldClass("tempatLahir")} />
              <FieldError message={errors.tempatLahir} />
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal Lahir <span className="text-red-500">*</span></label>
              <input type="date" name="tanggalLahir" value={formData.tanggalLahir} onChange={handleChange} required className={fieldClass("tanggalLahir")} />
              <FieldError message={errors.tanggalLahir} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">No. WhatsApp <span className="text-red-500">*</span></label>
            <input type="tel" name="noWa" value={formData.noWa} onChange={handleChange} required className={fieldClass("noWa")} placeholder="Contoh: 08123456789" />
            <FieldError message={errors.noWa} />
            <p className="text-xs text-gray-500 mt-1">Bisa diawali +62, 08, atau 62 — otomatis disesuaikan.</p>
          </div>

          <div className="border-b border-gray-800 pb-4 mb-4 mt-8">
            <h2 className="text-xl font-semibold text-blue-400">Alamat Lengkap</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Provinsi <span className="text-red-500">*</span></label>
              <select name="provinsiId" value={formData.provinsiId} onChange={handleChange} required className={fieldClass("provinsiId")}>
                <option value="">-- Pilih --</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <FieldError message={errors.provinsiId} />
            </div>
            <div className="form-group">
              <label className="form-label">Kabupaten / Kota <span className="text-red-500">*</span></label>
              <select name="kotaId" value={formData.kotaId} onChange={handleChange} required disabled={!formData.provinsiId} className={fieldClass("kotaId")}>
                <option value="">-- Pilih --</option>
                {cities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <FieldError message={errors.kotaId} />
            </div>
            <div className="form-group">
              <label className="form-label">Kecamatan <span className="text-red-500">*</span></label>
              <select name="kecamatanId" value={formData.kecamatanId} onChange={handleChange} required disabled={!formData.kotaId} className={fieldClass("kecamatanId")}>
                <option value="">-- Pilih --</option>
                {districts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <FieldError message={errors.kecamatanId} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Detail Alamat (Jalan/Rt/Rw) <span className="text-red-500">*</span></label>
            <textarea name="detailAlamat" value={formData.detailAlamat} onChange={handleChange} required className={fieldClass("detailAlamat")} placeholder="Tuliskan nama jalan, no rumah, RT/RW..."></textarea>
            <FieldError message={errors.detailAlamat} />
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
