import React, { useRef, useState, useMemo, Suspense } from 'react';
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

const EarthModel = ({ bodiesRef, index, radius }) => {
  const meshRef = useRef(null);
  const [colorMap, bumpMap, specularMap] = useTexture([
    '/textures/earth_color.jpg',
    '/textures/earth_bump.jpg',
    '/textures/earth_specular.jpg',
  ]);

  useFrame(() => {
    if (meshRef.current && bodiesRef.current[index]) {
      meshRef.current.position.copy(bodiesRef.current[index].pos);
      meshRef.current.rotation.y += 0.002;
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

const PhysicsWorld = ({ setEra, statsRef }) => {
  const initialBodies = useMemo(() => getInitialBodies(), []);
  const bodiesRef = useRef(getInitialBodies());
  const controlsRef = useRef(null);
  const ambientLightRef = useRef(null);

  const [resetKey, setResetKey] = useState(0);

  const { gravity, timeSpeed, followEarth } = useControls('Simulyatsiya Sozlamalari', {
    followEarth: { value: true, label: 'Yerni Kuzatish' },
    gravity: { value: 0.5, min: 0.01, max: 2, step: 0.01, label: 'Gravitatsiya (G)' },
    timeSpeed: { value: 1, min: 0.1, max: 5, step: 0.1, label: 'Vaqt Tezligi' },
    'Qayta boshlash': button(() => {
      bodiesRef.current = getInitialBodies();
      setResetKey((prev) => prev + 1);
    }),
  });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05) * timeSpeed;
    const bodies = bodiesRef.current;
    const accelerations = bodies.map(() => new THREE.Vector3(0, 0, 0));

    // Fizika: Tortishish kuchlari
    for (let i = 0; i < bodies.length; i++) {
      for (let j = 0; j < bodies.length; j++) {
        if (i === j) continue;
        const direction = new THREE.Vector3().subVectors(bodies[j].pos, bodies[i].pos);
        const distanceSq = direction.lengthSq();
        const forceMag = (gravity * bodies[j].mass) / (distanceSq + 0.1);
        direction.normalize().multiplyScalar(forceMag);
        accelerations[i].add(direction);
      }

      // Orbitadan qochib ketmaslik uchun (tashqi chegara)
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

    // Pozitsiya va tezliklarni yangilash
    for (let i = 0; i < bodies.length; i++) {
      bodies[i].vel.add(accelerations[i].multiplyScalar(dt));
      bodies[i].pos.add(bodies[i].vel.clone().multiplyScalar(dt));
    }

    if (followEarth && controlsRef.current) {
      controlsRef.current.target.lerp(bodies[0].pos, 0.1);
      controlsRef.current.update();
    }

    // === MASOFA VA HARORATNI HISOBLASH ===
    const earthPos = bodies[0].pos;
    const d1 = earthPos.distanceTo(bodies[1].pos);
    const d2 = earthPos.distanceTo(bodies[2].pos);
    const d3 = earthPos.distanceTo(bodies[3].pos);

    const minDistToSun = Math.min(d1, d2, d3);

    // Harorat formulasi
    const heat1 = 8000 / (d1 * d1 + 0.1);
    const heat2 = 8000 / (d2 * d2 + 0.1);
    const heat3 = 8000 / (d3 * d3 + 0.1);
    let currentTemp = -270 + heat1 + heat2 + heat3;
    currentTemp = Math.max(-273, currentTemp);

    // === YANGI DYNAMIC SCIENCE MA'LUMOTLAR DESIGNI ===
    if (statsRef.current) {
      const tempColor = currentTemp > 50 ? '#ff4444' : currentTemp < -50 ? '#44ccff' : '#00ffaa';

      statsRef.current.innerHTML = `
        <div style="font-size: 14px; color: #888; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Surface Temperature</div>
        <div style="font-size: 32px; font-weight: bold; margin-bottom: 20px; color: ${tempColor}; font-family: monospace;">
          ${currentTemp.toFixed(1)} <span style="font-size: 18px; font-weight: normal; color: #ccc;">°C </span>
        </div>
        
        <div style="font-size: 14px; color: #888; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Distances</div>
        <div style="font-size: 16px; line-height: 1.8; font-family: monospace;">
          <div style="display: flex; justify-content: space-between;"><span style="color: #ffaa00; text-transform: uppercase; letter-spacing: 1px;">Alpha Centauri A:</span> <b>${(d1 * 10).toFixed(1)}</b> mln km</div>
          <div style="display: flex; justify-content: space-between;"><span style="color: #ff4400; text-transform: uppercase; letter-spacing: 1px;">Alpha Centauri B:</span> <b>${(d2 * 10).toFixed(1)}</b> mln km</div>
          <div style="display: flex; justify-content: space-between;"><span style="color: white; text-transform: uppercase; letter-spacing: 1px;">Proxima Centauri:</span> <b>${(d3 * 10).toFixed(1)}</b> mln km</div>
        </div>
      `;
    }

    // Davrlarni aniqlash: Ilmiy nomlar
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
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(
        ambientLightRef.current.intensity,
        targetAmbientIntensity,
        0.05
      );
    }

    setEra((prev) => (prev !== currentEra ? currentEra : prev));
  });

  return (
    <group key={resetKey}>
      <ambientLight ref={ambientLightRef} intensity={0.1} />
      {initialBodies.map((body, index) => (
        <Trail
          key={`trail-${body.id}`}
          width={body.id === 'earth' ? 0.3 : 0.8}
          color={body.id === 'earth' ? 'white' : body.color}
          length={body.id === 'earth' ? 1800 : 800}
          decay={1}
          local={false}
        >
          {body.id === 'earth' ? (
            <EarthModel bodiesRef={bodiesRef} index={index} radius={body.radius} />
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
  const [era, setEra] = useState('🌍 STATUS: Stable period');
  const statsRef = useRef(null);

  return (
    <div style={{ height: '100vh', width: '100vw', margin: 0, overflow: 'hidden', position: 'relative' }}>

      {/* YANGI: CARD VA SCIENCE DIZAYNI */}
      <div style={{
        position: 'absolute', top: '20px', left: '20px', zIndex: 10,
        color: 'white', fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif, monospace',
        padding: '25px',
        backgroundColor: 'rgba(10, 15, 25, 0.9)', // To'q tech blue-ish grey fon
        borderRadius: '8px', // Burchaklar o'tkirroq
        // Chegara sivilizatsiya holatiga moslashadi, glow ko'proq
        border: `2px solid ${era.includes('JAHANNAM') ? '#ff2200' : era.includes('MUZLIK') ? '#00eeff' : '#00ffaa'}`,
        boxShadow: `0 0 20px ${era.includes('JAHANNAM') ? 'rgba(255, 34, 0, 0.5)' : era.includes('MUZLIK') ? 'rgba(0, 238, 255, 0.5)' : 'rgba(0, 255, 170, 0.3)'}`,
        transition: 'border 0.5s, box-shadow 0.5s',
        minWidth: '320px',
        textTransform: 'uppercase', // Ko'proq tech ko'rinish uchun
      }}>
        {/* Sarlavha yangilandi */}
        <h2 style={{ margin: 0, fontSize: '16px', color: '#888', letterSpacing: '1px' }}>Trisolaris Simulation</h2>

        {/* Era ko'rinishi yangilandi */}
        <p style={{ margin: '10px 0 20px 0', fontSize: '20px', fontWeight: 'bold', fontXamily: 'monospace',
          color: era.includes('JAHANNAM') ? '#ff4444' : era.includes('MUZLIK') ? '#44ccff' : 'white'
        }}>
          {era}
        </p>

        {/* Jonli ma'lumotlar shu yerga yoziladi */}
        <div ref={statsRef}></div>
      </div>

      <Leva collapsed={false} titleBar={{ title: 'Boshqaruv' }} />

      <Canvas camera={{ position: [0, 25, 45], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        <Stars radius={200} depth={50} count={7000} factor={5} saturation={0} fade speed={1} />

        <Suspense fallback={null}>
          <PhysicsWorld setEra={setEra} statsRef={statsRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}