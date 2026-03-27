import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls, Billboard, Text } from "@react-three/drei";
import * as THREE from "three";

const PLANET_PALETTES = {
  company: ["#f97316", "#ef4444", "#f59e0b", "#ec4899", "#a855f7", "#10b981", "#3b82f6"],
  personal: ["#06b6d4", "#14b8a6", "#8b5cf6", "#6366f1", "#84cc16", "#f43f5e", "#0ea5e9"],
};

function getPlanetColor(skill, index) {
  const palette = PLANET_PALETTES[skill.skill_source] || PLANET_PALETTES.personal;
  return palette[index % palette.length];
}

function getStarColor(skill) {
  if (skill.skill_source === "company") return "#FFD700";
  const colors = ["#00E5FF", "#FF6EC7", "#39FF14", "#BF5FFF", "#FF4500", "#00FFCC"];
  return colors[skill.id % colors.length];
}

function EmployeeCore({ name }) {
  const coreRef = useRef();
  const glowRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.3;
    }

    if (glowRef.current) {
      const pulse = 1 + Math.sin(t * 1.5) * 0.05;
      glowRef.current.scale.setScalar(pulse * 1.6);
    }
  });

  return (
    <group>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#4f46e5" transparent opacity={0.12} />
      </mesh>

      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#6d28d9"
          emissive="#4f46e5"
          emissiveIntensity={0.9}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>

      <Billboard position={[0, 1.5, 0]}>
        <Text fontSize={0.22} color="#c4b5fd" anchorX="center" anchorY="bottom">
          {name || "You"}
        </Text>
      </Billboard>
    </group>
  );
}

function OrbitRing({ radius, inclination }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <line rotation={[inclination, 0, 0]} geometry={geometry}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.06} />
    </line>
  );
}

function OrbitingPlanet({ skill, orbitRadius, speed, phase, inclination, color, onSkillClick }) {
  const groupRef = useRef();
  const planetRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + phase;

    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(t) * orbitRadius;
      groupRef.current.position.z = Math.sin(t) * orbitRadius;
      groupRef.current.position.y = Math.sin(t) * orbitRadius * Math.sin(inclination);
    }

    if (planetRef.current) {
      planetRef.current.rotation.y += 0.015;
      planetRef.current.rotation.x += 0.005;

      const s = hovered ? 1.4 : 1;
      planetRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh
        ref={planetRef}
        onClick={(e) => {
          e.stopPropagation();
          onSkillClick(skill);
        }}
        onPointerEnter={() => {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.7 : 0.25}
          metalness={0.2}
          roughness={0.65}
        />
      </mesh>

      {hovered && (
        <Billboard position={[0, 0.7, 0]}>
          <Text
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            {skill.name}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

function CompletedStar({ skill, position, onSkillClick }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);
  const starColor = getStarColor(skill);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.8;
      meshRef.current.rotation.z = t * 0.4;

      const pulse = 1 + Math.sin(t * 3 + position[0]) * 0.08;
      const s = hovered ? pulse * 1.5 : pulse;
      meshRef.current.scale.setScalar(s);
    }

    if (glowRef.current) {
      const pulse = hovered ? 1.5 : 1;
      glowRef.current.scale.setScalar(pulse * 2.2);
      glowRef.current.material.opacity = 0.1 + Math.sin(t * 2) * 0.04;
    }
  });

  return (
    <group position={position}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={starColor} transparent opacity={0.1} />
      </mesh>

      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSkillClick(skill);
        }}
        onPointerEnter={() => {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial
          color={starColor}
          emissive={starColor}
          emissiveIntensity={hovered ? 2.5 : 1.8}
          metalness={0.9}
          roughness={0.05}
        />
      </mesh>

      {hovered && (
        <Billboard position={[0, 0.7, 0]}>
          <Text
            fontSize={0.2}
            color={starColor}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            {skill.name}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

function Scene({ skills, userName, onSkillClick }) {
  const inProgress = useMemo(
    () => skills.filter((s) => s.status !== "completed"),
    [skills]
  );

  const completed = useMemo(
    () => skills.filter((s) => s.status === "completed"),
    [skills]
  );

  const completedPositions = useMemo(() => {
    return completed.map((_, i) => {
      const total = completed.length || 1;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / total);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 6.5 + (i % 3) * 1.2;

      return [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      ];
    });
  }, [completed]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={3} color="#8b5cf6" distance={20} decay={2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#ffffff" />

      <Stars radius={200} depth={60} count={6000} factor={3} saturation={0.5} fade speed={0.5} />

      <EmployeeCore name={userName} />

      {inProgress.map((skill, i) => {
        const orbitRadius = 2.8 + i * 1.4;
        const speed = 0.28 - i * 0.03;
        const phase = (i / Math.max(inProgress.length, 1)) * Math.PI * 2;
        const inclination = (i % 5 - 2) * 0.18;
        const color = getPlanetColor(skill, i);

        return (
          <group key={skill.id}>
            <OrbitRing radius={orbitRadius} inclination={inclination} />
            <OrbitingPlanet
              skill={skill}
              orbitRadius={orbitRadius}
              speed={speed}
              phase={phase}
              inclination={inclination}
              color={color}
              onSkillClick={onSkillClick}
            />
          </group>
        );
      })}

      {completed.map((skill, i) => (
        <CompletedStar
          key={skill.id}
          skill={skill}
          position={completedPositions[i]}
          onSkillClick={onSkillClick}
        />
      ))}
    </>
  );
}

export default function UniverseScene({ skills, userName, onSkillClick }) {
  return (
    <Canvas
      camera={{ position: [0, 4, 14], fov: 55 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <Scene skills={skills} userName={userName} onSkillClick={onSkillClick} />
      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={30}
        autoRotate
        autoRotateSpeed={0.25}
        enableDamping
        dampingFactor={0.05}
      />
    </Canvas>
  );
}