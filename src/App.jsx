import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { LogOut, User, BookOpen, ChevronRight, BookMarked, CheckCircle2 } from 'lucide-react';

// Konfigurasi API berdasarkan Postman
const CONFIG = {
  KC_URL: 'https://id.tif.uin-suska.ac.id/realms/dev/protocol/openid-connect/token',
  API_BASE: 'https://api.tif.uin-suska.ac.id/setoran-dev/v1',
  CLIENT_ID: 'setoran-mobile-dev',
  CLIENT_SECRET: 'aqJp3xnXKudgC7RMOshEQP7ZoVKWzoSl'
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [loading, setLoading] = useState(false);
  const [dosenData, setDosenData] = useState(null);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  
  // State untuk Modal Detail
  const [selectedMhs, setSelectedMhs] = useState(null);
  const [detailHafalan, setDetailHafalan] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Otomatis fetch data dosen jika token tersedia
  useEffect(() => {
    if (token) fetchDashboardData();
  }, [token]);

  // --- API: LOGIN KEYCLOAK ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const username = e.target.username.value;
    const password = e.target.password.value;

    const params = new URLSearchParams();
    params.append('client_id', CONFIG.CLIENT_ID);
    params.append('client_secret', CONFIG.CLIENT_SECRET);
    params.append('grant_type', 'password');
    params.append('username', username);
    params.append('password', password);
    params.append('scope', 'openid profile email');

    try {
      const response = await axios.post(CONFIG.KC_URL, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const accessToken = response.data.access_token;
      setToken(accessToken);
      localStorage.setItem('access_token', accessToken);
      toast.success('Login Berhasil!');
    } catch (error) {
      toast.error('Gagal login. Periksa username dan password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setDosenData(null);
    localStorage.removeItem('access_token');
    toast.success('Berhasil logout');
  };

  // --- API: FETCH DOSEN & MAHASISWA PA ---
  const fetchDashboardData = async () => {
    try {
      const res = await axios.get(`${CONFIG.API_BASE}/dosen/pa-saya`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.response) {
        setDosenData(res.data.data);
        setMahasiswaList(res.data.data.info_mahasiswa_pa.daftar_mahasiswa);
      }
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
      else toast.error('Gagal memuat data dashboard');
    }
  };

  // --- API: FETCH DETAIL SETORAN MAHASISWA ---
  const fetchDetailMahasiswa = async (nim) => {
    setLoadingDetail(true);
    document.getElementById('modal_detail').showModal(); // Buka modal DaisyUI
    
    try {
      const res = await axios.get(`${CONFIG.API_BASE}/mahasiswa/setoran/${nim}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.response) {
        setDetailHafalan(res.data.data);
      }
    } catch (error) {
      toast.error('Gagal memuat detail setoran');
      document.getElementById('modal_detail').close();
    } finally {
      setLoadingDetail(false);
    }
  };

  // --- TAMPILAN LOGIN ---
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
        <Toaster />
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-primary">Setoran TIF</h2>
              <p className="text-base-content/60 mt-2">Masuk sebagai Dosen PA</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Username</span></label>
                <input type="text" name="username" placeholder="Masukkan username" required className="input input-bordered w-full" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Password</span></label>
                <input type="password" name="password" placeholder="Masukkan password" required className="input input-bordered w-full" />
              </div>
              <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : 'Masuk Sistem'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- TAMPILAN DASHBOARD DOSEN ---
  return (
    <div className="min-h-screen bg-base-200">
      <Toaster />
      
      {/* Navbar */}
      <div className="navbar bg-primary text-primary-content shadow-lg px-4 lg:px-8">
        <div className="flex-1 gap-2">
          <BookMarked className="w-6 h-6" />
          <span className="text-xl font-bold">Setoran TIF</span>
        </div>
        <div className="flex-none gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <User className="w-5 h-5" />
            <span className="font-medium">{dosenData?.nama || 'Memuat...'}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-sm btn-ghost hover:bg-primary-focus">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-2">Daftar Mahasiswa Bimbingan</h2>
            <p className="text-base-content/70 mb-4">Pilih mahasiswa di bawah ini untuk melihat progres hafalan Muroja'ah mereka.</p>
            
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead className="bg-base-200 text-base">
                  <tr>
                    <th>NIM</th>
                    <th>Nama Mahasiswa</th>
                    <th>Angkatan</th>
                    <th>Progres</th>
                    <th className="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {mahasiswaList.map((mhs) => (
                    <tr key={mhs.nim}>
                      <td className="font-mono">{mhs.nim}</td>
                      <td className="font-medium">{mhs.nama}</td>
                      <td>{mhs.angkatan}</td>
                      <td>
                        <div className={`badge ${mhs.info_setoran.persentase_progres_setor > 0 ? 'badge-success text-white' : 'badge-ghost'} gap-1 font-semibold`}>
                          {mhs.info_setoran.persentase_progres_setor}%
                        </div>
                      </td>
                      <td className="text-center">
                        <button 
                          onClick={() => fetchDetailMahasiswa(mhs.nim)}
                          className="btn btn-sm btn-outline btn-primary">
                          <BookOpen className="w-4 h-4" /> Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                  {mahasiswaList.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-base-content/50">Tidak ada data mahasiswa.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Detail Mahasiswa (DaisyUI) */}
      <dialog id="modal_detail" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box w-11/12 max-w-5xl bg-base-100">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          
          {loadingDetail || !detailHafalan ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <span className="loading loading-bars loading-lg text-primary"></span>
              <p className="mt-4 text-base-content/70 font-medium">Mengambil riwayat setoran...</p>
            </div>
          ) : (
            <div>
              <h3 className="font-bold text-2xl text-primary">{detailHafalan.info.nama}</h3>
              <p className="py-1 font-mono text-base-content/70">{detailHafalan.info.nim} • Angkatan {detailHafalan.info.angkatan}</p>
              
              <div className="stats shadow w-full my-6 border border-base-200">
                <div className="stat place-items-center">
                  <div className="stat-title">Total Disetor</div>
                  <div className="stat-value text-primary">{detailHafalan.setoran.info_dasar.total_sudah_setor}</div>
                  <div className="stat-desc">dari {detailHafalan.setoran.info_dasar.total_wajib_setor} Surat</div>
                </div>
                <div className="stat place-items-center">
                  <div className="stat-title">Progres</div>
                  <div className="stat-value text-success">{detailHafalan.setoran.info_dasar.persentase_progres_setor}%</div>
                </div>
                <div className="stat place-items-center">
                  <div className="stat-title">Setoran Terakhir</div>
                  <div className="stat-value text-base">{detailHafalan.setoran.info_dasar.terakhir_setor}</div>
                </div>
              </div>

              <div className="divider">Kartu Hafalan</div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {detailHafalan.setoran.detail.map((surah) => (
                  <div key={surah.id} className={`card border ${surah.sudah_setor ? 'border-success bg-success/5' : 'border-base-300 bg-base-100'} shadow-sm`}>
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg">{surah.nama}</h4>
                          <span className="badge badge-sm badge-neutral mt-1">{surah.label}</span>
                        </div>
                        <div className="text-2xl font-serif text-right" dir="rtl">{surah.nama_arab}</div>
                      </div>
                      <div className="mt-4 flex items-center">
                        {surah.sudah_setor ? (
                          <span className="flex items-center text-sm font-semibold text-success">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Selesai ({surah.info_setoran.tgl_setoran})
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-base-content/40">Belum disetor</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

    </div>
  );
}