
# 🌌 3Body Problem 
## Trisolaris Simulation


Bu kichik simulation Lyu Sisinning mashhur The Three-Body Problem ilmiy-fantastik kitobi va Netflix serialidan ko'rib ilhomlanib qilingan. Loyiha `React`, `Three.js` va `React Three Fiber` yordamida qurilgan bo'lib, o'z ichiga real vaqtda hisoblanadigan tortishish fizikasi, dinamik yorug'lik va `Astrometrics Dashboard` oladi.

##  1. Documentation: Loyihani Evolyutsiyasi *(A dan Z gacha)*
<br>

#### Step 1: Settings

**a)** Loyiha `Vite` orqali `React` shabloni asosida noldan yaratildi (`npm create vite@latest`).

**b)** 3D grafika uchun `three`, `@react-three/fiber` va `@react-three/drei` library o'rnatildi.

**c)** Boshlang'ich sahnada oddiy trigonometrik funksiyalar yordamida oldindan belgilangan traektoriya bo'ylab aylanuvchi 3 ta Quyosh va Yerni modellari chizildi.
<br><br>
#### Step 2: Haqiqiy Fizika 

**a)** Animatsiya o'rniga Nyuton dinamikasi joriy etildi. Har bir kadrda `60 FPS` jismlar orasidagi tortishish kuchi hisoblanib, tezlanish (*acceleration*) va tezlik (*velocity*) vektorlari yangilandi.

**b)** React'ning rendering muammolarini chetlab o'tish uchun barcha hisob-kitoblar `useRef` va Three.js `Vector3` obyektlari yordamida to'g'ridan-to'g'ri xotirada bajarildi.
<br><br>

#### Step 3: UI

**a)** **Orbita izlari (Trails):** `@react-three/drei` kutubxonasidagi `<Trail>` komponenti qo'shildi. Ekranni toza saqlash uchun orbita bo'ylab harakat qilingan izlar uzunligi cheklandi *faqatgina so'nggi 30 soniyalik tarix saqlanadigan qilindi*.

**b)** **Sayyora teksturasi:** Yer obyektiga haqiqiy sayyora qiyofasini berish uchun `Color Map`, `Bump Map` va `Specular Map` teksturalari yuklab olindi (`<meshPhongMaterial>`).

**c)** **Leva UI:** Gravitatsiya ($G$) va Vaqt tezligini real vaqtda o'zgartirish,  Yerni kuzatishga moslangan kamera - boshqaruv paneli(*ga*) qo'shildi.
<br><br>

### Step 4: Optimizatsiya va Arxitektura

**a)** **React majburiy qoidalari (ESLint):** `useFrame` ichida state'larni to'g'ridan-to'g'ri o'zgartirish xatolarini oldini olish uchun komponentlar `EarthModel` va `SunModel` ga ajratildi.

**b)** **DOM Manipulyatsiyasi:** Harorat va masofa kabi tez o'zgaruvchi ma'lumotlarni sekundiga 60 marta React `useState` orqali yangilash brauzerni qotirib qo'yishi aniqlandi. Buning o'rniga, `useRef` orqali to'g'ridan-to'g'ri DOM'ga murojaat qilinib (`HTML injection`),  performance maksimal darajaga olib chiqildi.

---

## 2. Ilmiy qonunlar adaptatsiyasi

Dasturimiz kosmik fizika qonunlariga asoslanadi, lekin sivilizatsiya uzoqroq yashashi va foydalanuvchiga qiziqarli vizual tajriba berishi uchun ba'zi qonuniyatlar kod orqali "_fizikani chetlab o'tib_"  o'zgartirildi.

### 1. Nyuton Tortishish Qonuni

Jismlarning harakati quyidagi formula asosida hisoblanadi:


$$F = G \frac{m_1 m_2}{r^2}$$

**Dasturda qo'llanilishi:** Har bir kadrda Uchta Quyosh (Massasi =< 100) va Yer (Massasi = 0.001) orasidagi o'zaro tortishish vektorlari hisoblanadi. 

### 2. Teskari Kvadrat Qonuni _(harorat uchun)_

Yorug'lik va radiatsiya nurlanishi manbadan uzoqlashgan sari masofaning kvadratiga teskari proporsional ravishda kamayadi.

**Dasturda qo'llanilishi:** Sirt harorati formulasi $T = -270 + \sum \frac{K}{d^2}$ qilib olindi. Agar Yer yulduzdan azgina uzoqlashsa, harorat keskin tushib Deep Freeze boshlanadi. Yaqinlashsa, Extreme Heat yuzaga keladi.
<br><br>
###  Nega haqiqiy qonunlarni _(biroz)_ o'zgartirdik?

Real hayotda "Tirisolaris" _(agar mavjud bo'lganida)_ tizimida sayyora yo qisqa vaqt ichida yulduzga urilib parchalanib ketadi _(yutulib)_, yoki `Slingshot` (gravitatsion uloqtirish) effekti tufayli tizimdan abadiy cheksizlikka chiqib ketadi. 
Bunga holat bo'lmasligi uchun _(va foydalanuvchiga simulatsiya qiziqroq bo'lishi uchun )_ 2 ta maxsus mexanizm yozildi:

1. **Termal Itarish Qalqoni (Anti-Swallow Shield / Venus Limit):**

*Muammo:* Yer quyoshga qulab, nolga bo'linish xatoligini keltirib chiqarayotgan edi.

*Yechim:* Agar sayyora yulduzga ma'lum masofadan ($d < 6.0$) ko'proq yaqinlashsa, tortishish kuchi to'xtaydi va uning o'rniga yulduzning termal shamoli _(radiatsiya bosimi)_ sayyorani kvadratik kuch bilan orqaga itarib yuboradi. Natijada sayyora yutilmaydi.


2. **Gravitatsion Qopqon _Outer Bounds Tether_:**

*Muammo:* Sayyora katta tezlik olib tizimdan chiqib ketsa, ekran bo'shab zerikarli bo'lib qoladi.

*Yechim:* Koinot markazidan 35 birlik masofada ko'rinmas chegara tortildi. Agar Yer bu chegaradan o'tsa, koinot uni _spring_ kabi sekin orqaga tortadi va uning energiyasini (tezligini) `vel.multiplyScalar(0.98)` orqali so'ndirib, yana yulduzlar tizimiga yoysimon traektoriya bilan qaytaradi.



## 🚀 Ishga Tushirish

Loyihani o'z kompyuteringizda ishga tushirib ko'ring:

```bash
npm install
npm run dev
```

---

