import { Suspense, useLayoutEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FruitModel, SceneLights } from './FruitModel';
import { FruitTexturesProvider } from './FruitTexturesProvider';

function OrthoCameraRig() {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;
    if (size.width < 2 || size.height < 2) return;

    const w = size.width;
    const h = size.height;

    camera.left = 0;
    camera.right = w;
    camera.top = h;
    camera.bottom = 0;
    camera.near = 0.1;
    camera.far = 2000;
    camera.position.set(w / 2, h / 2, 500);
    camera.up.set(0, 1, 0);
    camera.lookAt(w / 2, h / 2, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}

function Scene3D({ gameStateRef, fruitVersion }) {
  const fruits = gameStateRef.current.fruits;

  return (
    <>
      <OrthoCameraRig />
      <SceneLights />
      {fruits.map((fruit) => (
        <FruitModel
          key={`${fruit.id}-${fruit.isSliced ? 'sliced' : 'whole'}-${fruitVersion}`}
          fruit={fruit}
        />
      ))}
    </>
  );
}

const GameCanvas3D = ({ gameStateRef, fruitVersion }) => (
  <Canvas
    className="absolute inset-0 z-10 h-full w-full"
    orthographic
    dpr={[1, 2]}
    gl={{ antialias: true, alpha: true }}
    camera={{ manual: true, position: [0, 0, 500], near: 0.1, far: 2000 }}
    onCreated={({ gl }) => {
      gl.setClearColor(0x000000, 0);
    }}
    style={{ pointerEvents: 'none' }}
  >
    <FruitTexturesProvider>
      <Scene3D gameStateRef={gameStateRef} fruitVersion={fruitVersion} />
    </FruitTexturesProvider>
  </Canvas>
);

export default GameCanvas3D;
