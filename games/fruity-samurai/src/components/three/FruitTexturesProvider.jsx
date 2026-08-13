import { createContext, useContext, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FRUIT_IMAGE_FILES } from '../../constants/fruitAssets';
import { loadAllFruitImages } from '../../utils/loadFruitImage';

const FruitTexturesContext = createContext(null);

export function FruitTexturesProvider({ children }) {
  const [textures, setTextures] = useState(null);

  useEffect(() => {
    let cancelled = false;

    loadAllFruitImages(FRUIT_IMAGE_FILES).then((images) => {
      if (cancelled) return;
      const map = {};
      Object.entries(images).forEach(([type, image]) => {
        const texture = new THREE.Texture(image);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        map[type] = texture;
      });
      setTextures(map);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FruitTexturesContext.Provider value={textures}>
      {children}
    </FruitTexturesContext.Provider>
  );
}

export function useFruitTexture(type) {
  const textures = useContext(FruitTexturesContext);
  if (!textures) return null;
  return textures[type] || null;
}
