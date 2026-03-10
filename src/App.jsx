import React, { useRef, useState, useMemo, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Trail, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Leva, useControls, button } from 'leva';

const getInitialBodies = () => [
  { id: 'earth', mass: 0.001, pos: new THREE.Vector3(20, 0, 0), vel: new THREE.Vector3(0, 3.8, 0), radius: 1.2, color: 'royalblue' },
  { id: 'sun1', mass: 208, pos: new THREE.Vector3(15, 0, 0), vel: new THREE.Vector3(0, 1.2, 0), color: '#ffaa00', radius: 2 },
  { id: 'sun2', mass: 191, pos: new THREE.Vector3(-7.5, 0, 13), vel: new THREE.Vector3(-1.0, -0.6, 0), color: '#ff4400', radius: 2 },
  { id: 'sun3', mass: 112, pos: new THREE.Vector3(-7.5, 0, -13), vel: new THREE.Vector3(1.0, -0.6, 0), color: '#ffffff', radius: 2 },
];

// Intro vaqtidagi kamera sozlamalari
const INTRO_START_POS = [0, 200, 500]; // Kosmosning uzoq burchagi
const INTRO_END_POS_MOBILE = [0, 35, 60];  // Telefonda yakuniy manzil
const INTRO_END_POS_DESKTOP = [0, 25, 45]; // Kompyuterda yakuniy manzil

const EarthModel = ({ bodiesRef, index, radius, introActive }) => {
  const meshRef = useRef(null);
  const [colorMap, bumpMap, specularMap] = useTexture([
    '/textures/earth_color.jpg',
    '/textures/earth_bump.jpg',
    '/textures/earth_specular.jpg',
  ]);

  useFrame(() => {
    if (meshRef.current && bodiesRef.current[index]) {
      meshRef.current.position.copy(bodiesRef.current[index].pos);
      // Intro vaqtida Yer aylanmay turadi
      if (!introActive) {
        meshRef.current.rotation.y += 0.002;
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshPhongMaterial
        map={colorMap}
        bumpMap={bumpMap}
        bumpScale={0.05}
        specularMap={specularMap}
        specular={new THREE.Color('grey')}
        shininess={10}
      />
    </mesh>
  );
};

const SunModel = ({ bodiesRef, index, radius, color }) => {
  const meshRef = useRef(null);
  useFrame(() => {
    if (meshRef.current && bodiesRef.current[index]) {
      meshRef.current.position.copy(bodiesRef.current[index].pos);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} toneMapped={false} />
      <pointLight color={color} intensity={100} distance={200} decay={1.5} />
    </mesh>
  );
};

// Asosiy komponent, endi intro holatini ham boshqaradi
const PhysicsWorld = ({ setEra, statsRef, introActive, setIntroActive, isMobile }) => {
  const initialBodies = useMemo(() => getInitialBodies(), []);
  const bodiesRef = useRef(getInitialBodies());
  const controlsRef = useRef(null);
  const ambientLightRef = useRef(null);
  const trailRef = useRef();

  const [resetKey, setResetKey] = useState(0);

  // Yakuniy kamera manzili ekran o'lchamiga qarab
  const finalCameraPos = useMemo(() => new THREE.Vector3(...(isMobile ? INTRO_END_POS_MOBILE : INTRO_END_POS_DESKTOP)), [isMobile]);

  const { gravity, timeSpeed, followEarth } = useControls('Simulyatsiya Sozlamalari', {
    followEarth: { value: true, label: 'Yerni Kuzatish' },
    gravity: { value: 0.5, min: 0.01, max: 2, step: 0.01, label: 'Gravitatsiya (G)' },
    timeSpeed: { value: 1, min: 0.1, max: 5, step: 0.1, label: 'Vaqt Tezligi' },
    'Qayta boshlash': button(() => {
      bodiesRef.current = getInitialBodies();
      setResetKey((prev) => prev + 1);
      // Qayta boshlaganda intro bo'lmaydi, lekin kamerani silliq qaytaramiz
      if (controlsRef.current) {
        controlsRef.current.target.lerp(bodiesRef.current[0].pos, 1);
      }
    }),
  });

  useFrame((state, delta) => {
    // === 1. INTRO KAmera ANIMATSIYASI ===
    if (introActive) {
      // Kamerani uzoqdan markazga silliq siljitish (lerp)
      // 0.05 - yaqinlashish tezligi (qanchalik katta bo'lsa, shuncha tez)
      state.camera.position.lerp(finalCameraPos, 0.0275);

      // OrbitControls nishonini ham Yerga qaratib turish
      if (controlsRef.current) {
        controlsRef.current.target.lerp(bodiesRef.current[0].pos, 0.2);
        controlsRef.current.update();
      }

      // Kamera manzilga yetib borganini tekshirish
      if (state.camera.position.distanceTo(finalCameraPos) < 1.0) {
        setIntroActive(false); // Fizikani yoqish
      }

      // Intro vaqtida yorug'lik effekti (tezlik hissi)
      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = THREE.MathUtils.lerp(ambientLightRef.current.intensity, 1.5, 0.1);
      }

      return; // Intro vaqtida fizika hisoblanmaydi
    }

    // === 2. HAQIQIY FIZIKA (Intro tugagach boshlanadi) ===
    const dt = Math.min(delta, 0.05) * timeSpeed;
    const bodies = bodiesRef.current;
    const accelerations = bodies.map(() => new THREE.Vector3(0, 0, 0));

    for (let i = 0; i < bodies.length; i++) {
      for (let j = 0; j < bodies.length; j++) {
        if (i === j) continue;
        const direction = new THREE.Vector3().subVectors(bodies[j].pos, bodies[i].pos);
        const distanceSq = direction.lengthSq();
        const forceMag = (gravity * bodies[j].mass) / (distanceSq + 0.1);
        direction.normalize().multiplyScalar(forceMag);
        accelerations[i].add(direction);
      }

      if (bodies[i].id === 'earth') {
        const distFromCenter = bodies[i].pos.length();
        if (distFromCenter > 35) {
          const overShoot = distFromCenter - 35;
          const pullForce = bodies[i].pos.clone().normalize().multiplyScalar(-0.02 * overShoot);
          accelerations[i].add(pullForce);
          bodies[i].vel.multiplyScalar(0.98);
        }
      }
    }

    for (let i = 0; i < bodies.length; i++) {
      bodies[i].vel.add(accelerations[i].multiplyScalar(dt));
      bodies[i].pos.add(bodies[i].vel.clone().multiplyScalar(dt));
    }

    // Kamera kuzatishi (fizika vaqtida)
    if (followEarth && controlsRef.current) {
      controlsRef.current.target.lerp(bodies[0].pos, 0.1);
      controlsRef.current.update();
    }

    // === MA'LUMOTLAR VA DAVRLAR (Fizika vaqtida) ===
    const earthPos = bodies[0].pos;
    const d1 = earthPos.distanceTo(bodies[1].pos);
    const d2 = earthPos.distanceTo(bodies[2].pos);
    const d3 = earthPos.distanceTo(bodies[3].pos);
    const minDistToSun = Math.min(d1, d2, d3);

    const heat1 = 8000 / (d1 * d1 + 0.1);
    const heat2 = 8000 / (d2 * d2 + 0.1);
    const heat3 = 8000 / (d3 * d3 + 0.1);
    let currentTemp = -270 + heat1 + heat2 + heat3;
    currentTemp = Math.max(-273, currentTemp);

    if (statsRef.current) {
      const tempColor = currentTemp > 50 ? '#ff4444' : currentTemp < -50 ? '#44ccff' : '#00ffaa';
      statsRef.current.innerHTML = `
        <div style="font-size: clamp(10px, 2vw, 14px); color: #888; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Surface Temperature</div>
        <div style="font-size: clamp(24px, 5vw, 32px); font-weight: bold; margin-bottom: 15px; color: ${tempColor}; font-family: monospace;">
          ${currentTemp.toFixed(1)} <span style="font-size: clamp(14px, 3vw, 18px); font-weight: normal; color: #ccc;">°C </span>
        </div>
        <div style="font-size: clamp(10px, 2vw, 14px); color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Distances</div>
        <div style="font-size: clamp(12px, 3vw, 16px); line-height: 1.6; font-family: monospace;">
          <div style="display: flex; justify-content: space-between;"><span style="color: #ffaa00; text-transform: uppercase; letter-spacing: 1px;">Alpha Centauri A:</span> <b>${(d1 * 10).toFixed(1)}</b> <span style="font-size: 0.8em">mln km</span></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: #ff4400; text-transform: uppercase; letter-spacing: 1px;">Alpha Centauri B:</span> <b>${(d2 * 10).toFixed(1)}</b> <span style="font-size: 0.8em">mln km</span></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: white; text-transform: uppercase; letter-spacing: 1px;">Proxima Centauri:</span> <b>${(d3 * 10).toFixed(1)}</b> <span style="font-size: 0.8em">mln km</span></div>
        </div>
      `;
    }

    let currentEra = 'Stable Period';
    let targetBgColor = new THREE.Color('#050505');
    let targetAmbientIntensity = 0.1;

    if (minDistToSun < 5) {
      currentEra = 'Doomsday';
      targetBgColor = new THREE.Color('#220200');
      targetAmbientIntensity = 0.8;
    } else if (minDistToSun > 30) {
      currentEra = 'Deep Freeze';
      targetBgColor = new THREE.Color('#000005');
      targetAmbientIntensity = 0.005;
    }

    state.scene.background.lerp(targetBgColor, 0.02);
    if (ambientLightRef.current) {
      // Fizika vaqtida yorug'lik silliq normallashadi
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(ambientLightRef.current.intensity, targetAmbientIntensity, 0.05);
    }
    setEra((prev) => (prev !== currentEra ? currentEra : prev));
  });

  return (
    <group key={resetKey}>
      {/* Boshlang'ich yorug'lik xira bo'ladi */}
      <ambientLight ref={ambientLightRef} intensity={0.01} />
      {initialBodies.map((body, index) => (
        <Trail
          key={`trail-${body.id}`}
          ref={body.id === 'earth' ? trailRef : null}
          width={body.id === 'earth' ? 0.3 : 0.8}
          color={body.id === 'earth' ? 'white' : body.color}
          // Intro vaqtida izlar kalta bo'ladi (tezlik effekti uchun), keyin uzunlashadi
          length={introActive ? 50 : body.id === 'earth' ? 1800 : 800}
          decay={1}
          local={false}
        >
          {body.id === 'earth' ? (
            <EarthModel bodiesRef={bodiesRef} index={index} radius={body.radius} introActive={introActive} />
          ) : (
            <SunModel bodiesRef={bodiesRef} index={index} radius={body.radius} color={body.color} />
          )}
        </Trail>
      ))}
      <OrbitControls ref={controlsRef} enableZoom={true} autoRotate={false} />
    </group>
  );
};

export default function App() {
  const [era, setEra] = useState('STATUS: Stable period');
  const statsRef = useRef(null);

  // Intro holatini boshqarish
  const [introActive, setIntroActive] = useState(true);

  // Responsivelik
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDoomsday = era.includes('Doomsday');
  const isFreeze = era.includes('Freeze');

  return (
    <div style={{ height: '100vh', width: '100vw', margin: 0, overflow: 'hidden', position: 'relative' }}>

      {/* Intro tugagach Card paydo bo'ladi */}
      {!introActive && (
        <div style={{
          position: 'absolute',
          top: isMobile ? 'auto' : '20px',
          bottom: isMobile ? '20px' : 'auto',
          left: isMobile ? '50%' : '20px',
          transform: isMobile ? 'translateX(-50%)' : 'none',
          width: isMobile ? '90%' : 'auto',
          minWidth: isMobile ? 'auto' : '320px',
          maxWidth: '400px',
          zIndex: 10,
          color: 'white',
          fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif, monospace',
          padding: isMobile ? '15px 20px' : '25px',
          backgroundColor: 'rgba(10, 15, 25, 0.85)',
          borderRadius: '12px',
          border: `2px solid ${isDoomsday ? '#ff2200' : isFreeze ? '#00eeff' : '#00ffaa'}`,
          boxShadow: `0 0 20px ${isDoomsday ? 'rgba(255, 34, 0, 0.5)' : isFreeze ? 'rgba(0, 238, 255, 0.5)' : 'rgba(0, 255, 170, 0.3)'}`,
          transition: 'border 0.5s, box-shadow 0.5s',
          textTransform: 'uppercase',
          backdropFilter: 'blur(5px)',
          opacity: 0, // Silliq paydo bo'lish animatsiyasi
          animation: 'fadeIn 1s forwards 0.5s' // 0.5s kechikish bilan
        }}>
          <style>{`
            @keyframes fadeIn {
              to { opacity: 1; }
            }
          `}</style>
          <h2 style={{ margin: 0, fontSize: clampFontSize(isMobile, '12px', '16px'), color: '#888', letterSpacing: '1px' }}>
            Trisolaris Simulation
          </h2>

          <p style={{ margin: '8px 0 15px 0', fontSize: clampFontSize(isMobile, '16px', '20px'), fontWeight: 'bold', fontFamily: 'monospace',
            color: isDoomsday ? '#ff4444' : isFreeze ? '#44ccff' : 'white'
          }}>
            {era}
          </p>

          <div ref={statsRef}></div>
        </div>
      )}

      {/* Leva paneli ham intro vaqtida yashirin turadi */}
      {!introActive && <Leva collapsed={isMobile} titleBar={{ title: 'Boshqaruv' }} />}

      {/* Kamera boshlang'ich uzoq pozitsiyada */}
      <Canvas camera={{ position: INTRO_START_POS, fov: 45 }}>
        <color attach="background" args={['#050505']} />
        {/* Intro vaqtida yulduzlar ko'proq va yorqinroq (tezlik effekti) */}
        <Stars radius={200} depth={50} count={introActive ? 15000 : isMobile ? 3000 : 7000} factor={introActive ? 8 : 5} saturation={0} fade speed={introActive ? 10 : 1} />

        <Suspense fallback={null}>
          <PhysicsWorld
            setEra={setEra}
            statsRef={statsRef}
            introActive={introActive}
            setIntroActive={setIntroActive}
            isMobile={isMobile}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

function clampFontSize(isMobile, min, max) {
  return isMobile ? min : max;
}