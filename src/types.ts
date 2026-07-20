export interface Siswa {
  nis: string;
  nama: string;
  jenjang: string;
  kelas: string;
}

export interface Absen {
  timestamp: string;
  nis: string;
  nama: string;
  kelas: string;
  jenjang: string;
  status: string;
  waktuKeluar: string;
  waktuDhuha: string;
  waktuDzuhur: string;
}

export interface Akun {
  username: string;
  password?: string;
  role: string;
}

export interface Libur {
  tgl: string;
  ket: string;
}

export interface Pengaturan {
  jamMasuk: string;
  jamPulang: string;
}
