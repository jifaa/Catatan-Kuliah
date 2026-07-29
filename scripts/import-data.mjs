/**
 * Import script: Migrate data from Laravel MySQL export (mynotulencollege.json)
 * into the Next.js SQLite database.
 *
 * Usage: node scripts/import-data.mjs
 */

import Database from "better-sqlite3";
import { generateJSON } from "@tiptap/html";
import { createId } from "@paralleldrive/cuid2";
import path from "path";
import { fileURLToPath } from "url";

// --- Tiptap extensions (minimal set for HTML → JSON conversion) ---
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

const extensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Highlight,
  TaskList,
  TaskItem.configure({ nested: true }),
  Link.configure({ openOnClick: false }),
  Image,
  Underline,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  TextStyle,
  Color,
];

// ---------------------------------------------------------------------------
// Source data (from PHPMyAdmin JSON export)
// ---------------------------------------------------------------------------

const semesters = [
  { id: "f7abbc8c08wod9pr61kwe2pe", name: "Semester 5", order: 0, createdAt: "2025-09-03T02:42:57.000Z", updatedAt: "2025-09-09T05:56:20.000Z" },
  { id: "izi9ejlni2mp3gsqhtfa3stj", name: "Semester 1", order: 1, createdAt: "2025-09-09T04:37:56.000Z", updatedAt: "2025-09-09T05:56:30.000Z" },
  { id: "cmm00sn4z0000m4kl9h5dccuz", name: "Semester 6", order: 2, createdAt: "2026-02-24T03:02:37.856+00:00", updatedAt: "2026-02-24T03:02:37.856+00:00" },
];

const subjects = [
  { id: "u7omusw3j0jib4tj9o8la1h8", semesterId: "f7abbc8c08wod9pr61kwe2pe", name: "Machine Learnig & Big Data", description: "Dosen: Pak Yoga", order: 0, created_at: "2025-09-03T02:43:48.000Z", updated_at: "2025-09-03T02:43:48.000Z" },
  { id: "maiokf3o4yly73asnqngtykv", semesterId: "f7abbc8c08wod9pr61kwe2pe", name: "Pengenalan Pola", description: "Dosen: Pak Abdul Rahim | SKS: 3", order: 1, created_at: "2025-09-09T03:21:27.000Z", updated_at: "2025-09-09T03:21:27.000Z" },
  { id: "n9qpsze5bsqa023fulsnlokm", semesterId: "izi9ejlni2mp3gsqhtfa3stj", name: "Pemrograman Web Lanjut", description: "Dosen: Dr. John Doe | Kode: PWL301 | SKS: 3 | Mata kuliah pemrograman web menggunakan framework modern", order: 2, created_at: "2025-09-09T05:15:10.000Z", updated_at: "2025-09-09T05:15:10.000Z" },
  { id: "osu5ux0f565xtqchf9jg77al", semesterId: "izi9ejlni2mp3gsqhtfa3stj", name: "Basis Data Lanjut", description: "Dosen: Prof. Jane Smith | Kode: BDL302 | SKS: 3 | Mata kuliah database design dan optimization", order: 3, created_at: "2025-09-09T05:15:10.000Z", updated_at: "2025-09-09T05:15:10.000Z" },
  { id: "kx4nyup32ppng46o1x905xk8", semesterId: "izi9ejlni2mp3gsqhtfa3stj", name: "Rekayasa Perangkat Lunak", description: "Dosen: Dr. Alice Brown | Kode: RPL304 | SKS: 3 | Metodologi pengembangan software", order: 4, created_at: "2025-09-09T05:15:10.000Z", updated_at: "2025-09-09T05:15:10.000Z" },
  { id: "t0of7sq2wy4b4sowbrwspwfr", semesterId: "izi9ejlni2mp3gsqhtfa3stj", name: "Sistem Operasi", description: "Dosen: Prof. Charlie Davis | Kode: SO305 | SKS: 3 | Konsep dan implementasi sistem operasi", order: 5, created_at: "2025-09-09T05:15:10.000Z", updated_at: "2025-09-09T05:15:10.000Z" },
  { id: "tj1se71ogylrs2v846ubketi", semesterId: "f7abbc8c08wod9pr61kwe2pe", name: "Sistem Samar dan Sistem Berbasis Pengetahuan", description: "Dosen: Pak Rofil", order: 6, created_at: "2025-09-16T05:03:21.000Z", updated_at: "2025-09-16T05:03:21.000Z" },
  { id: "aewou7fw8of6ibv2vzu5p2ms", semesterId: "f7abbc8c08wod9pr61kwe2pe", name: "Teori Graf dan Automata", description: null, order: 7, created_at: "2025-09-19T00:01:06.000Z", updated_at: "2025-09-19T00:01:06.000Z" },
  { id: "cmm00t6490001m4kl70fgmap5", semesterId: "cmm00sn4z0000m4kl9h5dccuz", name: "Sistem Informasi Geografis", description: null, order: 0, created_at: "2026-02-24T03:03:02.457+00:00", updated_at: "2026-02-24T03:03:02.457+00:00" },
  { id: "cmm4g25190000cckl6x04a95b", semesterId: "cmm00sn4z0000m4kl9h5dccuz", name: "Technopreneurship", description: null, order: 1, created_at: "2026-02-27T05:20:59.897+00:00", updated_at: "2026-04-08T03:43:59+00:00" },
  { id: "cmm5v4a680000csklypek9mk9", semesterId: "cmm00sn4z0000m4kl9h5dccuz", name: "Visi Komputer", description: null, order: 2, created_at: "2026-02-28T05:10:20.288+00:00", updated_at: "2026-02-28T05:10:20.288+00:00" },
  { id: "cmm5xyhxt0000nsklv2wsy9rn", semesterId: "cmm00sn4z0000m4kl9h5dccuz", name: "Komputer Grafik", description: null, order: 3, created_at: "2026-02-28T06:29:49.261+00:00", updated_at: "2026-02-28T06:29:49.261+00:00" },
  { id: "cmm8ojctv0000zoklh0mss6v7", semesterId: "cmm00sn4z0000m4kl9h5dccuz", name: "Natural Language Processing", description: null, order: 4, created_at: "2026-03-02T04:29:24.781+00:00", updated_at: "2026-04-08T03:43:59+00:00" },
  { id: "cmmbkprov00001kklmdhapbui", semesterId: "cmm00sn4z0000m4kl9h5dccuz", name: "Metodologi Penelitian dan Publikasi Ilmiah", description: null, order: 5, created_at: "2026-03-04T05:05:44.038+00:00", updated_at: "2026-04-08T03:43:59+00:00" },
  { id: "submnpi7gcf0qtkpjy8", semesterId: "cmm00sn4z0000m4kl9h5dccuz", name: "Keterampilan Hidup", description: null, order: 6, created_at: "2026-04-08T03:43:59+00:00", updated_at: "2026-04-08T03:43:59+00:00" },
];

const materials = [
  { id: "wjmfoz2q8aefjqtkva3rtke9", subject_id: "u7omusw3j0jib4tj9o8la1h8", title: "Pertemuan Pertama - Pengenalan Big Data", meetingNumber: 1, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Setiap data yang ada akan terekam dan disimpan.\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Setiap data yang tersimpan akan dianalisis dan di kelola sehingga membentuk sebuah data baru.\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Data is the new gold.\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Contoh penerapan: sebuah pabrik pakaian ingin membuat sebuah pakaian, lalu pabrik tersebut meminta facebook untuk meminta data tentang selera orang dalam berpakaian di suatu tempat.\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Data Saintis adalah orang yang ahli dalam mengelola dan menganalisis data.\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Machine Learning belajar dari sebuah data yang ada, baik sumber yang terpercaya maupun tidak.\"}]}]}]}]}]}]}}", created_at: "2025-09-03T03:55:22.000Z", updated_at: "2026-02-24T03:03:22.355+00:00" },
  { id: "jogouq2ixadfdi9h8kxgvgor", subject_id: "u7omusw3j0jib4tj9o8la1h8", title: "Pertemuan 2 - Big Data", meetingNumber: 2, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"BigData\"}]}]}", created_at: "2025-09-10T04:12:34.000Z", updated_at: "2026-02-24T03:03:30.535+00:00" },
  { id: "okkxap67vsseuexu7dwi3n4v", subject_id: "maiokf3o4yly73asnqngtykv", title: "Pertemuan 3 - Fitur", meetingNumber: 3, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Fitur adalah penciri setiap objek\"}]}]}", created_at: "2025-09-16T03:35:37.000Z", updated_at: "2025-09-16T03:35:37.000Z" },
  { id: "l2mvmygsj47p66qwou7mdhk9", subject_id: "aewou7fw8of6ibv2vzu5p2ms", title: "Pertemuan 2 - Presentasi Graf Dalam Matrix", meetingNumber: 4, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Adjacency Matrix = Vertex - Vertex\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Incidence Matrix = Vertecx- Edge\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Degree Matrix = Jumlah Edge yang terhubung ke Vertex\"}]}]}]}]}", created_at: "2025-09-19T00:15:59.000Z", updated_at: "2026-02-24T03:03:40.336+00:00" },
  { id: "fd2qol6duxoukzql3j3eiswx", subject_id: "maiokf3o4yly73asnqngtykv", title: "Pertemuan 4 - Klasifikasi", meetingNumber: 5, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Hyperplane adalah perbedaan yang paling mencolok\"}]}]}", created_at: "2025-09-23T03:25:30.000Z", updated_at: "2025-09-23T03:25:30.000Z" },
  { id: "tzoontblzmaiex81bz6pfrgv", subject_id: "aewou7fw8of6ibv2vzu5p2ms", title: "Pertemuan 4", meetingNumber: 6, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"derajat adalah garis yang terhubung ke vertex\"}]}]}", created_at: "2025-10-05T08:49:08.000Z", updated_at: "2025-10-05T08:49:08.000Z" },
  { id: "cmm00ufie0002m4kl4m74rrle", subject_id: "cmm00t6490001m4kl70fgmap5", title: "Pertemuan 1", meetingNumber: 1, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Tugas:\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Buat \"}]}]}]}", created_at: "2026-02-24T03:04:01.286+00:00", updated_at: "2026-02-24T04:07:25.661+00:00" },
  { id: "cmm4gbj2r0000x4klx0m3knk2", subject_id: "cmm4g25190000cckl6x04a95b", title: null, meetingNumber: 1, content: "", created_at: "2026-02-27T05:28:18.000+00:00", updated_at: "2026-03-31T03:01:08.085+00:00" },
  { id: "cmm5v4fmt0001cskl4vkwlxif", subject_id: "cmm5v4a680000csklypek9mk9", title: "Pertemuan 2", meetingNumber: 1, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"jika korndikat Y di dunia nyata keatas, maka di komputer akan kebawah\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"jika header pada file bmp, maka semua gambar akan rusak. jika hanya sebagian gambar saja yang rusak, berarti terdapat data angka yang bermasalah.\"}]}]}]}", created_at: "2026-02-28T05:10:27.365+00:00", updated_at: "2026-03-10T13:41:25.840+00:00" },
  { id: "cmm5xyrw50001nskl33tzctp2", subject_id: "cmm5xyhxt0000nsklv2wsy9rn", title: "Pertemuan 2", meetingNumber: 1, content: "", created_at: "2026-02-28T06:30:02.165+00:00", updated_at: "2026-03-04T05:09:19.746+00:00" },
  { id: "cmm8ojkr50001zoklvrb9ofqy", subject_id: "cmm8ojctv0000zoklh0mss6v7", title: "Pertemuan 2", meetingNumber: 1, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"NLP adalah bahasa manusia yang dikonversi kedalam bahasa komputer.\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"IndoBERT adalah algoritma NLP yang menggunakan bahasa indonesia\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Sarkasme adalah bahasa yang susah dipahami (sindiran)\"}]}]}]}]}", created_at: "2026-03-02T04:29:35.056+00:00", updated_at: "2026-03-03T02:39:38.601+00:00" },
  { id: "cmm9tyjh90000jwkl412fr8pg", subject_id: "cmm5xyhxt0000nsklv2wsy9rn", title: "Pertemuan 3", meetingNumber: 2, content: "", created_at: "2026-03-02T23:48:57.496+00:00", updated_at: "2026-03-03T00:11:59.980+00:00" },
  { id: "cmm9xwut7000088kllb9pdlu7", subject_id: "cmm8ojctv0000zoklh0mss6v7", title: "Data Processing", meetingNumber: 3, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"data mining sudah ada dari puluhan tahun lalu\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null}}]}]}", created_at: "2026-03-03T01:39:37.266+00:00", updated_at: "2026-03-10T13:43:08.780+00:00" },
  { id: "cmma0j3n2000188klyh190w67", subject_id: "cmm00t6490001m4kl70fgmap5", title: "Vektor vs Raster", meetingNumber: 3, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"heading\",\"attrs\":{\"textAlign\":null,\"level\":3},\"content\":[{\"type\":\"text\",\"text\":\"Vektor\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"data vektor merepresentasikan objek geografis menggunakan kordinat diskrit (x, y) yang saling terhubung.\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"format file umum:\"},{\"type\":\"bulletList\",\"content\":[{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\".shp\"},{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\".kml / .kmz\"},{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\".geojson\"}]}]}]}]},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"elemen dasar vektor:\"},{\"type\":\"bulletList\",\"content\":[{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Point (titik)\"},{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Line (garis)\"},{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Polygon (area)\"}]}]}]}]},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"dalam geojson, urutan penulisan kordinate adalah [longitude, latitude]\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"komponen wajib geojson feature:\"},{\"type\":\"bulletList\",\"content\":[{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"type\"},{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"geometry\"},{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"properties\"}]}]}]}]},{\"type\":\"heading\",\"attrs\":{\"textAlign\":null,\"level\":3},\"content\":[{\"type\":\"text\",\"text\":\"Raster\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"data raster diambil menggunakan foto melalui satelit, hal itu memungkinkan raster mengetahui tinggi rendahnya medan serta suhu.\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"resolusi spesial raster adalah definisi luas area di permukaan bumi yang diwakili oleh satu pixel.\"}]}]}]}]}", created_at: "2026-03-03T02:52:54.444+00:00", updated_at: "2026-03-03T03:26:30.034+00:00" },
  { id: "cmmbkqfgs00011kklgszajrx8", subject_id: "cmmbkprov00001kklmdhapbui", title: "Mengapa Penelitian Penting", meetingNumber: 2, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Tujuan Penelitian:\"},{\"type\":\"bulletList\",\"content\":[{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Menyelesaikan Masalah\"},{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Meningkatkan Keefektifan\"},{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Mengembangkan Teknologi\"}]}]}]},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Research: Kenapa?, Bagaimana?, Bagaimana jika?\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Development: bagaimana cara kita mengimplementasikannya?\"}]}]}]}]}", created_at: "2026-03-04T05:06:14.859+00:00", updated_at: "2026-04-01T04:04:37.738+00:00" },
  { id: "cmmbl0dxh00021kklrmy5bcjp", subject_id: "cmm5v4a680000csklypek9mk9", title: "Histogram Warna", meetingNumber: 3, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"cara membaca histogram warna: kordinat x adalah nilai intensitas warna, kordinat y adalah jumlah pixel yang menggunakan warna tersebut.\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null}}]}]}", created_at: "2026-03-04T05:13:59.428+00:00", updated_at: "2026-03-04T05:22:09.797+00:00" },
  { id: "cmmju4nyt0000bkkl8qmbrfwe", subject_id: "cmm5xyhxt0000nsklv2wsy9rn", title: "Algoritma Garis", meetingNumber: 4, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"m = (y2 - y2) / (x2 - x1)\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"m = gradien\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"gradien adalah kemiringan garis\"}]}]}]}", created_at: "2026-03-09T23:51:25.010+00:00", updated_at: "2026-03-10T00:14:59.480+00:00" },
  { id: "cmmk0rjkx00011gklsuto8nbj", subject_id: "cmm00t6490001m4kl70fgmap5", title: null, meetingNumber: 4, content: "", created_at: "2026-03-10T02:57:10.110+00:00", updated_at: "2026-03-11T02:55:21.970+00:00" },
  { id: "cmmknuhf7000068klbu9bp9jw", subject_id: "cmm8ojctv0000zoklh0mss6v7", title: "Web Scraping", meetingNumber: 3, content: "", created_at: "2026-03-10T13:43:18.451+00:00", updated_at: "2026-03-11T02:55:12.932+00:00" },
  { id: "cmmlg5jwb0000a4klmg6t2fxi", subject_id: "cmmbkprov00001kklmdhapbui", title: "Research Gap", meetingNumber: 3, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"research gap adalah suatu masalah yang belum ada yang menemukannya atau membuatnya.\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"literatur review adalah membaca peneltitian orang lain terlebih dahuku.\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"cara mengetahui apakah penelitian itu penting atau tidak dengan cata melihat literatur apakah sudah ada yang meniliti.\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"future work adalah penelitian yang belum dibuat pada sebuah jurnal, biasanya pada bagian batasan penelitian.\"}]}]}]}]}", created_at: "2026-03-11T02:55:44.123+00:00", updated_at: "2026-04-01T04:04:45.581+00:00" },
  { id: "cmmlmqyda0001dwklp179m2hx", subject_id: "cmm5v4a680000csklypek9mk9", title: null, meetingNumber: 4, content: "", created_at: "2026-03-11T06:00:20.350+00:00", updated_at: "2026-03-11T06:00:23.134+00:00" },
  { id: "cmne1l0780000x0klqhz34lik", subject_id: "cmm00t6490001m4kl70fgmap5", title: null, meetingNumber: 5, content: "", created_at: "2026-03-31T03:13:09.955+00:00", updated_at: "2026-03-31T03:13:12.515+00:00" },
  { id: "cmnfh0cn10000poklzvbua7tv", subject_id: "cmmbkprov00001kklmdhapbui", title: "State Of The Art (SOTA)", meetingNumber: 4, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"SotA adalah perkembangan penelitian paling terbaru untuk menghindari duplikat.\"}]}]}", created_at: "2026-04-01T03:12:46.321+00:00", updated_at: "2026-04-05T04:10:40.199+00:00" },
  { id: "cmno5s4yk0000twkl1krfi7kc", subject_id: "cmm8ojctv0000zoklh0mss6v7", title: "Text Mining", meetingNumber: 4, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"data text yang harus diambil harus dari situs resmi\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"komentar merupakan ekspresi paling jujur dibanding dengan survey\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"ekstraksi memiliki peran yang sangat penting\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"genetic algotithm berfugnsi untuk mengurangi kolom yang tidak diperlukan\"}]}]}]}]}", created_at: "2026-04-07T05:08:22.936+00:00", updated_at: "2026-04-07T05:48:05.956+00:00" },
  { id: "cmnph3t0z0000s4klr6dtpctr", subject_id: "cmmbkprov00001kklmdhapbui", title: "Metode Penelitian (Prosedur Penelitian)", meetingNumber: 5, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Prosedur Peneletian adalah langkah langkah dan bagaimana cara mengimplementasikannya.\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"2.3 Prosedur Penelitian\"},{\"type\":\"bulletList\",\"content\":[{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"pengertian data koleksi\"},{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"jelaskna data yang dipakai\"},{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"dari mana datanya\"},{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"atributnya apa\"}]}]}]}]}]}]}]}]}", created_at: "2026-04-08T03:13:09.295+00:00", updated_at: "2026-04-08T03:40:17.265+00:00" },
  { id: "cmnpmk9410000vwklz14rf140", subject_id: "cmm5v4a680000csklypek9mk9", title: null, meetingNumber: 5, content: "", created_at: "2026-04-08T05:45:54.718+00:00", updated_at: "2026-04-08T05:46:00.883+00:00" },
  { id: "cmnrjfke100004oklx23whsdj", subject_id: "cmm5xyhxt0000nsklv2wsy9rn", title: null, meetingNumber: 6, content: "", created_at: "2026-04-09T13:53:49.553+00:00", updated_at: "2026-04-09T13:53:56.935+00:00" },
  { id: "cmnsd718y0000esklallmnwqo", subject_id: "cmm5xyhxt0000nsklv2wsy9rn", title: "LIngkaran", meetingNumber: 5, content: "", created_at: "2026-04-10T03:46:59.981+00:00", updated_at: "2026-04-10T03:47:04.947+00:00" },
  { id: "cmnye6sj100004gkle2r8ga44", subject_id: "cmm8ojctv0000zoklh0mss6v7", title: "Text Mining (2)", meetingNumber: 5, content: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Text Mining merupakan pengumpulan data paling valid\"},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null}}]}]}", created_at: "2026-04-14T09:01:25.349+00:00", updated_at: "2026-04-14T09:16:01.895+00:00" },
];

const notes = [
  { id: "cmnfiy3wp0001poklxud6gb7t", subject_id: "cmmbkprov00001kklmdhapbui", title: "Ptruktur Penelitian", content: "<p>1.1 latar belakang masalah (background research)</p><ul><li>masalah umum</li><li>SotA</li></ul><p>1.2 rumusan masalah (problem statement/ research question)</p><p>1.3 tujuan penelitian (research objective)</p><p>1.4 manfaat penelitian (research significance)</p><ul><li>cek latar belakang & sesuaikan</li></ul><p>1.5 batasan masalah</p>", created_at: "2026-04-01T04:07:00.936+00:00", updated_at: "2026-04-01T04:39:57.234+00:00" },
];

const tasks = [
  { id: "rdvlkvjl5fsrw4vj93g6797h", subject_id: "t0of7sq2wy4b4sowbrwspwfr", title: "Modul", description: "Kerjakan semua yang ada di Modul 1 classroom", deadline: "2025-09-21T00:00:00.000+00:00", status: "DONE", created_at: "2025-09-15T05:58:59.000Z", updated_at: "2026-02-28T05:05:56.366+00:00" },
  { id: "kfn8mn7q3vbbcjv02vevgb1m", subject_id: "maiokf3o4yly73asnqngtykv", title: "Fitur", description: "Mencari conton penerapan ekstrasi fitur", deadline: "2025-09-22T11:36:00.000Z", status: "DONE", created_at: "2025-09-16T03:36:41.000Z", updated_at: "2025-09-24T02:48:29.000Z" },
  { id: "o6x6n2smwy2kkt5lqavu06cp", subject_id: "maiokf3o4yly73asnqngtykv", title: "Klasifikasi", description: "cari source code yang berisi klasifikasi apapun menggunakan python", deadline: "2025-09-24T00:00:00.000+00:00", status: "DONE", created_at: "2025-09-23T03:26:41.000Z", updated_at: "2026-02-28T05:06:12.175+00:00" },
  { id: "cmm03agx1000014kl979an2sf", subject_id: "cmm00t6490001m4kl70fgmap5", title: "Menganalis Pemetaan Kaltim", description: "analisis aplikasi terkait pemetaan untuk membuat sesuatu di wilayah kalimantan timur", deadline: "2026-03-03T00:00:00.000+00:00", status: "DONE", created_at: "2026-02-24T04:12:28.837+00:00", updated_at: "2026-03-02T15:35:59.469+00:00" },
  { id: "cmm4in25i0000pkklzcy8d2ix", subject_id: "cmm4g25190000cckl6x04a95b", title: "Menyelesaikan Masalah Dengan Teknologi", description: "masalah apa yang ada dimasyarakat saat ini yang bisa diselesaikan dengan mengembangkan teknologi, apa tantangan, apa yang dilakukan untuk mewujudkan itu, prospek bisnis.", deadline: "2026-03-06T00:00:00.000+00:00", status: "DONE", created_at: "2026-02-27T06:33:15.173+00:00", updated_at: "2026-03-05T15:40:24.859+00:00" },
  { id: "cmma2yirn0000eoklq7apo169", subject_id: "cmm00t6490001m4kl70fgmap5", title: "Memetakan Rumah", description: "cari aplikasi android yang terkait tentang pemeteaan, review apa kelebihannya dan apa kekurangan. lalu gambar rumah dalam bentuk poligon, hitung keliling menggunakan aplikasi tersebut dalam bentuk format json. gambar garis dari rumah ke umkt. beri kordinat apa saja yang ada di sekitar rumah. hasil dari json coba cek di geojson", deadline: "2026-03-10T00:00:00.000+00:00", status: "DONE", created_at: "2026-03-03T04:00:53.123+00:00", updated_at: "2026-03-10T13:31:30.228+00:00" },
  { id: "cmmbmfsrj00031kkljr2as23n", subject_id: "cmm5v4a680000csklypek9mk9", title: "Buat Aplikasi Penampil Gambar", description: "buat aplikasi untuk menampilkan gambar serta mengeditnya menggunakan python dengan library opencv atau cv", deadline: "2026-03-11T00:00:00.000+00:00", status: "DONE", created_at: "2026-03-04T05:53:58.110+00:00", updated_at: "2026-04-04T02:11:19.719+00:00" },
  { id: "cmmokaiql0000f8klopzsca1r", subject_id: "cmm4g25190000cckl6x04a95b", title: "Implementasi", description: "implementasikan salah dua dari masalah yang dipilih", deadline: null, status: "TODO", created_at: "2026-03-13T07:14:52.884+00:00", updated_at: "2026-03-13T07:14:52.884+00:00" },
  { id: "cmne3v79k0001x0kle16ir6br", subject_id: "cmm00t6490001m4kl70fgmap5", title: "Cari Kategori Tempat di Overpass Turbo", description: "cari lokasi tempat untuk minimal 5 kategori yang masih satu tema di overpass turbo", deadline: "2026-04-07T00:00:00.000+00:00", status: "DONE", created_at: "2026-03-31T04:17:04.903+00:00", updated_at: "2026-04-07T04:59:57.928+00:00" },
  { id: "cmno7q96d0001twkl5x87aom2", subject_id: "cmm8ojctv0000zoklh0mss6v7", title: "Membuat Jurnal", description: "Scrabing, dan exteraksi skripsi", deadline: null, status: "TODO", created_at: "2026-04-07T06:02:54.325+00:00", updated_at: "2026-04-14T09:53:07.013+00:00" },
  { id: "cmny44o940001pckl8npi6bxo", subject_id: "cmm00t6490001m4kl70fgmap5", title: "Persiapa UTS", description: "cari data sebanyak mungkin di overpas turbo apa aja (titik, jalan, luas)", deadline: null, status: "TODO", created_at: "2026-04-14T04:19:50.339+00:00", updated_at: "2026-04-14T04:19:50.339+00:00" },
];

const classSchedules = [
  { id: "schmnpi7gchu2gc6us1", subject_id: "cmm00t6490001m4kl70fgmap5", dayOfWeek: 2, startTime: "10:40", endTime: "12:10", room: "GE-4.02 / R. Kuliah", className: "Internasional EE", lecturer: "ROFILDE HASUDUNGAN S.Kom., M.Sc", order: 0, created_at: "2026-04-08T03:43:59+00:00", updated_at: "2026-04-08T03:43:59+00:00" },
  { id: "schmnpi7gchcs8uv2a0", subject_id: "cmm8ojctv0000zoklh0mss6v7", dayOfWeek: 2, startTime: "07:20", endTime: "08:50", room: "GE-4.02 / R. Kuliah", className: "Internasional EE1", lecturer: "RUDIMAN S.Kom., M.Sc; NAUFAL AZMI VERDIKHA", order: 1, created_at: "2026-04-08T03:43:59+00:00", updated_at: "2026-04-08T03:43:59+00:00" },
  { id: "schmnpi7gchbad1kdgg", subject_id: "cmm5xyhxt0000nsklv2wsy9rn", dayOfWeek: 2, startTime: "09:00", endTime: "10:30", room: "GE-4.02 / R. Kuliah", className: "Internasional EE1", lecturer: "ABDUL RAHIM S.Kom., M.Cs.", order: 2, created_at: "2026-04-08T03:43:59+00:00", updated_at: "2026-04-08T03:43:59+00:00" },
  { id: "schmnpi7gchg8avl3p0", subject_id: "cmmbkprov00001kklmdhapbui", dayOfWeek: 3, startTime: "10:40", endTime: "12:10", room: "GE-4.02 / R. Kuliah", className: "Internasional EE", lecturer: "ROFILDE HASUDUNGAN S.Kom., M.Sc", order: 3, created_at: "2026-04-08T03:43:59+00:00", updated_at: "2026-04-08T03:43:59+00:00" },
  { id: "schmnpi7gchsejmo0bq", subject_id: "cmm4g25190000cckl6x04a95b", dayOfWeek: 5, startTime: "13:00", endTime: "14:30", room: "GE-4.02 / R. Kuliah", className: "Internasional EE", lecturer: "ROFILDE HASUDUNGAN S.Kom., M.Sc", order: 4, created_at: "2026-04-08T03:43:59+00:00", updated_at: "2026-04-08T03:43:59+00:00" },
  { id: "schmnpi7gchg4l6maae", subject_id: "cmm5v4a680000csklypek9mk9", dayOfWeek: 5, startTime: "10:40", endTime: "12:10", room: "GE-4.02 / R. Kuliah", className: "Internasional EE1", lecturer: "ABDUL RAHIM S.Kom., M.Cs.", order: 5, created_at: "2026-04-08T03:43:59+00:00", updated_at: "2026-04-08T03:43:59+00:00" },
  { id: "schmnpi7gchg6fjwwhr", subject_id: "submnpi7gcf0qtkpjy8", dayOfWeek: 6, startTime: "15:00", endTime: "16:40", room: "Lapangan DD1", className: "Internasional EE1", lecturer: "NAUFAL AZMI VERDIKHA", order: 6, created_at: "2026-04-08T03:43:59+00:00", updated_at: "2026-04-08T03:43:59+00:00" },
];

const attachments = [
  { id: "cmm9d1d910003zoklesxaj2pt", fileName: "Peta Navigasi Samarinda Berbasis.docx", filePath: "/api/uploads/1772466915924-pggga-Peta Navigasi Samarinda Berbasis.docx", fileSize: 17230, fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", displayName: "Pemetaan Samarinda", description: "Analisis Pemetaan Samarinda", subject_id: "cmm00t6490001m4kl70fgmap5", created_at: "2026-03-02T15:55:15.925+00:00" },
  { id: "cmm9uwwew0001jwkl93w2zlig", fileName: "WhatsApp Image 2026-03-03 at 8.03.56 AM.jpeg", filePath: "/api/uploads/1772496940564-1qzwo5-WhatsApp Image 2026-03-03 at 8.03.56 AM.jpeg", fileSize: 214557, fileType: "image/jpeg", displayName: "Definisi istilah dalam grafis", description: null, subject_id: "cmm5xyhxt0000nsklv2wsy9rn", created_at: "2026-03-03T00:15:40.567+00:00" },
  { id: "cmmdmuhzu0000d8kl6tybqcvq", fileName: "Pengembangan Aplikasi Lapor Jalan Rusak.docx", filePath: "/api/uploads/1772725256340-lo4q59-Pengembangan Aplikasi Lapor Jalan Rusak.docx", fileSize: 18620, fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", displayName: "Menyelesaikan Masalah Dengan Teknologi", description: null, subject_id: "cmm4g25190000cckl6x04a95b", created_at: "2026-03-05T15:40:56.346+00:00" },
  { id: "cmmk0avya00001gklkka5wwm2", fileName: "map.geojson", filePath: "/api/uploads/1773110652984-1mn3l-map.geojson", fileSize: 11455, fileType: "application/octet-stream", displayName: "Rumah ke Kampus", description: "Pemetaan arah dari rumah ke kampus", subject_id: "cmm00t6490001m4kl70fgmap5", created_at: "2026-03-10T02:44:12.994+00:00" },
  { id: "cmnfjlylq0002pokl1tvno02v", fileName: "Screenshot_20260401_122440.jpg", filePath: "/api/uploads/1775017533798-hejzou-Screenshot_20260401_122440.jpg", fileSize: 447609, fileType: "image/jpeg", displayName: "SotA", description: null, subject_id: "cmmbkprov00001kklmdhapbui", created_at: "2026-04-01T04:25:33.806+00:00" },
  { id: "cmny43n0v0000pckl1kveetdc", fileName: "gis-1.pdf", filePath: "/api/uploads/1776140342083-nh0xx8-gis-1.pdf", fileSize: 163396, fileType: "application/pdf", displayName: "Supabase", description: null, subject_id: "cmm00t6490001m4kl70fgmap5", created_at: "2026-04-14T04:19:02.094+00:00" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toISO(mysqlDatetime) {
  if (!mysqlDatetime) return null;
  // Handle both MySQL format "2025-09-03 02:42:57" and ISO format
  if (mysqlDatetime.includes("T") || mysqlDatetime.endsWith("Z")) {
    // Already ISO format
    return new Date(mysqlDatetime).toISOString();
  }
  // "2025-09-03 02:42:57" → "2025-09-03T02:42:57.000Z"
  return new Date(mysqlDatetime.replace(" ", "T") + "Z").toISOString();
}

function htmlToTiptapJson(html) {
  try {
    // Clean up HTML: remove \r\n, &nbsp;
    const cleaned = html
      .replace(/\r\n/g, "\n")
      .replace(/&nbsp;/g, " ");
    const json = generateJSON(cleaned, extensions);
    return JSON.stringify(json);
  } catch (e) {
    console.warn("  ⚠ HTML conversion failed, wrapping in paragraph:", e.message);
    // Fallback: wrap plain text in a basic Tiptap doc
    const fallback = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: html.replace(/<[^>]*>/g, "") }] }],
    };
    return JSON.stringify(fallback);
  }
}

function buildSubjectDescription(subj) {
  const parts = [];
  if (subj.lecturer) parts.push(`Dosen: ${subj.lecturer}`);
  if (subj.code) parts.push(`Kode: ${subj.code}`);
  if (subj.credits) parts.push(`SKS: ${subj.credits}`);
  if (subj.description) parts.push(subj.description);
  return parts.length > 0 ? parts.join(" | ") : null;
}

function mapTaskStatus(status) {
  switch (status) {
    case "completed": return "DONE";
    case "in_progress": return "IN_PROGRESS";
    case "pending":
    default: return "TODO";
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDbPath = path.resolve(__dirname, "..", "prisma", "dev.db");
const databaseUrl = process.env.DATABASE_URL;

const dbPath = databaseUrl?.startsWith("file:")
  ? path.resolve(__dirname, "..", databaseUrl.slice(5))
  : defaultDbPath;

console.log("📂 Database:", dbPath);
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Clear existing data
console.log("\n🧹 Clearing existing data...");
try {
  db.exec(`
    DELETE FROM Attachment;
    DELETE FROM ClassSchedule;
    DELETE FROM SubjectNote;
    DELETE FROM Task;
    DELETE FROM Tag;
    DELETE FROM Material;
    DELETE FROM Subject;
    DELETE FROM Semester;
  `);
} catch (e) {
  console.log("  ℹ Data clear executed");
}

// ID mappings (old integer id → new cuid)
const semesterMap = new Map();
const subjectMap = new Map();

// ---- Semesters ----
console.log("\n📌 Importing Semesters...");
const insertSemester = db.prepare(`
  INSERT INTO Semester (id, name, startDate, endDate, "order", createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const s of semesters) {
  semesterMap.set(s.id, s.id);  // Map real IDs 
  insertSemester.run(
    s.id,
    s.name,
    null, // startDate
    null, // endDate
    s.order,
    toISO(s.createdAt),
    toISO(s.updatedAt)
  );
  console.log(`  ✅ ${s.name}`);
}

// ---- Subjects ----
console.log("\n📌 Importing Subjects...");
const insertSubject = db.prepare(`
  INSERT INTO Subject (id, title, description, semesterId, "order", pinned, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const s of subjects) {
  subjectMap.set(s.id, s.id);  // Map real IDs
  const semesterId = s.semesterId;
  insertSubject.run(
    s.id,
    s.name,
    s.description,
    semesterId,
    s.order,
    0,    // pinned = false
    toISO(s.created_at),
    toISO(s.updated_at)
  );
  console.log(`  ✅ ${s.name}`);
}

// ---- Notes → Materials ----
console.log("\n📌 Importing Materials...");
const insertMaterial = db.prepare(`
  INSERT INTO Material (id, title, meetingNumber, content, subjectId, pinned, "order", createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (let i = 0; i < materials.length; i++) {
  const m = materials[i];
  const subjectId = m.subject_id;
  
  // Convert HTML content to Tiptap JSON
  const tiptapContent = htmlToTiptapJson(m.content);

  insertMaterial.run(
    m.id,
    m.title || null,
    m.meetingNumber || 1,
    tiptapContent,
    subjectId,
    0,    // pinned = false
    i,    // order
    toISO(m.created_at),
    toISO(m.updated_at)
  );
  console.log(`  ✅ ${m.title || "Untitled Material"} (meeting ${m.meetingNumber || 1})`);
}

// ---- Tasks ----
console.log("\n📌 Importing Tasks...");
const insertTask = db.prepare(`
  INSERT INTO Task (id, title, description, deadline, status, subjectId, "order", createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (let i = 0; i < tasks.length; i++) {
  const t = tasks[i];
  const subjectId = t.subject_id;

  insertTask.run(
    t.id,
    t.title,
    t.description || null,
    toISO(t.deadline),
    t.status,
    subjectId,
    i,    // order
    toISO(t.created_at),
    toISO(t.updated_at)
  );
  console.log(`  ✅ ${t.title} (status: ${t.status})`);
}

// ---- Subject Notes ----
console.log("\n📌 Importing Subject Notes...");
const insertSubjectNote = db.prepare(`
  INSERT INTO SubjectNote (id, title, content, subjectId, pinned, "order", createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (let i = 0; i < notes.length; i++) {
  const n = notes[i];
  const tiptapContent = htmlToTiptapJson(n.content);

  insertSubjectNote.run(
    n.id,
    n.title || null,
    tiptapContent,
    n.subject_id,
    0,    // pinned = false
    i,    // order
    toISO(n.created_at),
    toISO(n.updated_at)
  );
  console.log(`  ✅ ${n.title}`);
}

// ---- Class Schedules ----
console.log("\n📌 Importing Class Schedules...");
const insertClassSchedule = db.prepare(`
  INSERT INTO ClassSchedule (id, subjectId, dayOfWeek, startTime, endTime, room, className, lecturer, "order", createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const cs of classSchedules) {
  insertClassSchedule.run(
    cs.id,
    cs.subject_id,
    cs.dayOfWeek,
    cs.startTime,
    cs.endTime,
    cs.room || null,
    cs.className || null,
    cs.lecturer || null,
    cs.order,
    toISO(cs.created_at),
    toISO(cs.updated_at)
  );
  console.log(`  ✅ ${cs.lecturer} (${cs.startTime}-${cs.endTime})`);
}

// ---- Attachments ----
console.log("\n📌 Importing Attachments...");
const insertAttachment = db.prepare(`
  INSERT INTO Attachment (id, fileName, filePath, fileSize, fileType, displayName, description, subjectId, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const a of attachments) {
  insertAttachment.run(
    a.id,
    a.fileName,
    a.filePath,
    a.fileSize,
    a.fileType,
    a.displayName || null,
    a.description || null,
    a.subject_id || null,
    toISO(a.created_at)
  );
  console.log(`  ✅ ${a.displayName || a.fileName}`);
}

// ---- Summary ----
const semCount = db.prepare("SELECT COUNT(*) as c FROM Semester").get();
const subjCount = db.prepare("SELECT COUNT(*) as c FROM Subject").get();
const matCount = db.prepare("SELECT COUNT(*) as c FROM Material").get();
const taskCount = db.prepare("SELECT COUNT(*) as c FROM Task").get();
const noteCount = db.prepare("SELECT COUNT(*) as c FROM SubjectNote").get();
const scheduleCount = db.prepare("SELECT COUNT(*) as c FROM ClassSchedule").get();
const attachmentCount = db.prepare("SELECT COUNT(*) as c FROM Attachment").get();

console.log("\n✨ Import complete!");
console.log(`   Semesters:      ${semCount.c}`);
console.log(`   Subjects:       ${subjCount.c}`);
console.log(`   Materials:      ${matCount.c}`);
console.log(`   Subject Notes:  ${noteCount.c}`);
console.log(`   Tasks:          ${taskCount.c}`);
console.log(`   Schedules:      ${scheduleCount.c}`);
console.log(`   Attachments:    ${attachmentCount.c}`);

db.close();
