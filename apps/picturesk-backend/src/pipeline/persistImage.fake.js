export function createImagePersister() {
  return async function persistImage(_sourceUrl, keyBase) {
    return { imageUrl: `https://fake-r2.local/${keyBase}.jpg` };
  };
}

export function createWeightsPersister() {
  return async function persistWeights(_sourceUrl, keyBase) {
    return { weightsUrl: `https://fake-r2.local/${keyBase}.tar` };
  };
}
