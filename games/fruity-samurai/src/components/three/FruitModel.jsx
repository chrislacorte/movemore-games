import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FRUIT_CONFIGS } from '../../constants/fruitAssets';
import { useFruitTexture } from './FruitTexturesProvider';

function BombMesh({ fruit }) {
  const config = FRUIT_CONFIGS.bomb;

  return (
    <>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[fruit.radius, 24, 24]} />
        <meshStandardMaterial
          color={config.color}
          roughness={0.4}
          metalness={0.4}
          emissive="#ff1744"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh frustumCulled={false} position={[0, fruit.radius * 1.15, 0]}>
        <sphereGeometry args={[fruit.radius * 0.12, 8, 8]} />
        <meshStandardMaterial color="#ffeb3b" emissive="#ff9800" emissiveIntensity={1.2} />
      </mesh>
    </>
  );
}

function SphereMesh({ fruit, half = null }) {
  const config = FRUIT_CONFIGS[fruit.type] || FRUIT_CONFIGS.orange;
  const isTop = half?.halfIndex === 0;

  return (
    <mesh frustumCulled={false}>
      <sphereGeometry
        args={[
          fruit.radius,
          half ? 16 : 24,
          half ? 10 : 24,
          0,
          Math.PI * 2,
          half ? (isTop ? 0 : Math.PI / 2) : 0,
          half ? Math.PI / 2 : Math.PI,
        ]}
      />
      <meshStandardMaterial
        color={config.color}
        transparent={Boolean(half)}
        opacity={half ? Math.max(0, half.alpha) : 1}
        roughness={0.45}
        metalness={0.08}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function BillboardMesh({ fruit, half = null }) {
  const texture = useFruitTexture(fruit.type);
  const size = fruit.radius * 2.35;

  const clippedTexture = useMemo(() => {
    if (!texture || !half) return texture;
    return texture;
  }, [texture, half]);

  if (!clippedTexture) return <SphereMesh fruit={fruit} half={half} />;

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={clippedTexture}
        transparent
        alphaTest={0.08}
        side={THREE.DoubleSide}
        opacity={half ? Math.max(0, half.alpha) : 1}
      />
    </mesh>
  );
}

function FruitHalf({ fruit, half }) {
  const groupRef = useRef();
  const { size } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(half.x, size.height - half.y, half.z);
    groupRef.current.rotation.set(half.spinX, half.spinY, half.rotation);
  });

  return (
    <group ref={groupRef} frustumCulled={false}>
      {fruit.isBomb ? (
        <SphereMesh fruit={fruit} half={half} />
      ) : (
        <BillboardMesh fruit={fruit} half={half} />
      )}
    </group>
  );
}

function FruitWhole({ fruit }) {
  const groupRef = useRef();
  const { size } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(fruit.x, size.height - fruit.y, fruit.z);
    groupRef.current.rotation.set(fruit.spinX, fruit.spinY, fruit.rotation);
  });

  return (
    <group ref={groupRef} frustumCulled={false}>
      {fruit.isBomb ? <BombMesh fruit={fruit} /> : <BillboardMesh fruit={fruit} />}
    </group>
  );
}

export function FruitModel({ fruit }) {
  if (fruit.isSliced && fruit.halves) {
    return fruit.halves.map((half) => (
      <FruitHalf key={`${fruit.id}-half-${half.halfIndex}`} fruit={fruit} half={half} />
    ));
  }

  if (!fruit.isSliced) {
    return <FruitWhole fruit={fruit} />;
  }

  return null;
}

export function SceneLights() {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[200, 400, 400]} intensity={1.4} />
      <pointLight position={[0, 0, 300]} intensity={0.6} />
    </>
  );
}
