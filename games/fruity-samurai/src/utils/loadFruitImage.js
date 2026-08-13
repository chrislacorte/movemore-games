export function loadFruitImage(fileName) {
  return new Promise((resolve, reject) => {
    const src = new URL(`../img/fruits/${fileName}`, import.meta.url).href;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function loadAllFruitImages(imageFiles) {
  const entries = await Promise.all(
    Object.entries(imageFiles).map(async ([type, file]) => {
      const image = await loadFruitImage(file);
      return [type, image];
    })
  );
  return Object.fromEntries(entries);
}
