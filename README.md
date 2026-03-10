
# 🌌 3 Body Problem: Trisolaris Simulation

Ushbu loyiha Lyu Sisinning mashhur "Uch jism muammosi" (The Three-Body Problem) ilmiy-fantastik asari va Netflix serialiga asoslangan interaktiv 3D veb-simulyatsiyadir. Loyiha **React**, **Three.js** va **React Three Fiber** yordamida qurilgan bo'lib, o'z ichiga real vaqtda hisoblanadigan tortishish fizikasi, dinamik yorug'lik va ilmiy ko'rsatkichlar panelini (Astrometrics Dashboard) oladi.

## 🛠 1. Texnik Hujjatlar: Loyiha Evolyutsiyasi (0 dan Hozirgacha)

Loyiha bir necha iteratsiyalar orqali oddiy vizual animatsiyadan murakkab fizika dvigateliga ega dasturga aylantirildi.

### Qadam 1: Boshlang'ich sozlamalar va muhit

* Loyiha **Vite** orqali React shabloni asosida noldan yaratildi (`npm create vite@latest`).
* 3D grafika uchun `three`, `@react-three/fiber` va `@react-three/drei` kutubxonalari o'rnatildi.
* Boshlang'ich sahnada oddiy trigonometrik funksiyalar yordamida oldindan belgilangan traektoriya bo'ylab aylanuvchi 3 ta Quyosh va Yer modellari chizildi.

### Qadam 2: Haqiqiy Fizika Dvigatelini Integratsiya Qilish

* Animatsiya o'rniga haqiqiy Nyuton dinamikasi joriy etildi. Har bir kadrda (60 FPS) jismlar orasidagi tortishish kuchi hisoblanib, tezlanish (acceleration) va tezlik (velocity) vektorlari yangilandi.
* React'ning rendering muammolarini chetlab o'tish uchun barcha hisob-kitoblar `useRef` va Three.js `Vector3` obyektlari yordamida to'g'ridan-to'g'ri xotirada bajarildi.

### Qadam 3: Vizualizatsiya va Interfeys (UI)

* **Orbita izlari (Trails):** `@react-three/drei` kutubxonasidagi `<Trail>` komponenti qo'shildi. Ekranni toza saqlash uchun izlar uzunligi cheklandi (faqat so'nggi 30 soniyalik tarix saqlanadi).
* **Sayyora teksturasi:** Yer obyektiga haqiqiy sayyora qiyofasini berish uchun `Color Map`, `Bump Map` va `Specular Map` (okeanlar yaltirashi uchun) teksturalari ulandi (`<meshPhongMaterial>`).
* **Leva UI:** Gravitatsiya ($G$) va Vaqt tezligini real vaqtda o'zgartirish, shuningdek, kamerani Yerni kuzatishga moslash uchun boshqaruv paneli qo'shildi.

### Qadam 4: Optimizatsiya va Arxitektura

* **React qat'iy qoidalari (ESLint):** `useFrame` ichida state'larni to'g'ridan-to'g'ri o'zgartirish xatolarini oldini olish uchun komponentlar `EarthModel` va `SunModel` ga ajratildi.
* **DOM Manipulyatsiyasi:** Harorat va masofa kabi tez o'zgaruvchi ma'lumotlarni sekundiga 60 marta React `useState` orqali yangilash brauzerni qotirib qo'yishi aniqlandi. Buning o'rniga, `useRef` orqali to'g'ridan-to'g'ri DOM'ga murojaat qilinib (HTML injection), unumdorlik (performance) maksimal darajaga olib chiqildi.

---

## 🔬 2. Fizika va Astronomiya Qonuniyatlari (va ularning adaptatsiyasi)

Dasturimiz kosmik fizika qonunlariga asoslanadi, lekin sivilizatsiya (simulyatsiya) uzoqroq yashashi va foydalanuvchiga qiziqarli vizual tajriba berishi uchun ba'zi qonuniyatlar kod orqali "hiyla" bilan o'zgartirildi.

### 1. Nyutonning Butunjahon Tortishish Qonuni

Jismlarning harakati quyidagi formula asosida hisoblanadi:


$$F = G \frac{m_1 m_2}{r^2}$$

* **Dasturda qo'llanilishi:** Har bir kadrda Uchta Quyosh (Massasi = 100) va Yer (Massasi = 0.001) orasidagi o'zaro tortishish vektorlari hisoblanadi. Yerning massasi o'ta kichik bo'lgani uchun u quyoshlarga ta'sir qilmaydi, aksincha, ularning quliga aylanib xaotik orbitaga tushadi.

### 2. Teskari Kvadrat Qonuni (Harorat uchun)

Yorug'lik va radiatsiya nurlanishi manbadan uzoqlashgan sari masofaning kvadratiga teskari proporsional ravishda kamayadi.

* **Dasturda qo'llanilishi:** Sirt harorati formulasi $T = -270 + \sum \frac{K}{d^2}$ qilib olindi. Agar Yer yulduzdan ozgina uzoqlashsa, harorat keskin tushib "Muzlik Davri" (Deep Freeze) boshlanadi. Yaqinlashsa, Jahannam davri (Extreme Heat) yuzaga keladi.

### 🛠 Nega haqiqiy qonunlarni biroz o'zgartirdik?

Haqiqiy "Uch Jism" tizimida sayyora yo qisqa vaqt ichida yulduzga urilib parchalanib ketadi, yoki *Slingshot* (gravitatsion uloqtirish) effekti tufayli tizimdan abadiy cheksizlikka uchib ketadi. Bunga yo'l qo'ymaslik uchun 2 ta maxsus mexanizm yozildi:

1. **Termal Itarish Qalqoni (Anti-Swallow Shield / Venus Limit):**
* *Muammo:* Yer quyoshga qulab, nolga bo'linish xatoligini keltirib chiqarishi mumkin edi.
* *Yechim:* Agar sayyora yulduzga ma'lum masofadan ($d < 6.0$) ko'proq yaqinlashsa, tortishish kuchi to'xtaydi va uning o'rniga yulduzning termal shamoli (radiatsiya bosimi) sayyorani kvadratik kuch bilan orqaga itarib yuboradi. Sayyora yutilmaydi, balki keskin burilib ketadi.


2. **Gravitatsion Qopqon / Bahor Effekti (Outer Bounds Tether):**
* *Muammo:* Sayyora katta tezlik olib tizimdan uchib ketsa, ekran bo'shab qoladi.
* *Yechim:* Koinot markazidan 35 birlik masofada ko'rinmas chegara tortildi. Agar Yer bu chegaradan o'tsa, koinot uni "bahor" (spring) kabi sekin orqaga tortadi va uning energiyasini (tezligini) `vel.multiplyScalar(0.98)` orqali so'ndirib, yana yulduzlar tizimiga yoysimon traektoriya bilan qaytaradi.



## 🚀 Ishga Tushirish

Loyihani o'z kompyuteringizda ishga tushirish uchun:

```bash
npm install
npm run dev

```

---

Endi loyiha to'liq "qadoqlandi". Keyingi qadam sifatida loyihani butun dunyo ko'rishi uchun Netlify platformasiga onlayn yuklash jarayonini boshlaymizmi?