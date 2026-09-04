import Link from 'next/link';
import './home.css';

export default function Home() {
  return (
    <main className="hero-container">
      <div className="hero-content">
        <h1 className="hero-title">
          Selamat Datang di <span className="highlight">E-Markaz</span>
        </h1>
        <p className="hero-subtitle">
          Platform pembelajaran online terstruktur dengan modul PDF, sistem absensi realtime, dan manajemen kelas terbaik.
        </p>
        <div className="hero-actions">
          <Link href="/pendaftaran" className="btn btn-primary">
            Daftar Sekarang
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Login Portal Santri
          </Link>
        </div>
      </div>
    </main>
  );
}
