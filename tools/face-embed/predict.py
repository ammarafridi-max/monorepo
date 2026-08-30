"""
Face-embedding ("faceprint") model.

Takes one image, finds the largest face, and returns its ArcFace embedding
(InsightFace buffalo_l): a 512-dim, L2-normalized vector. Comparing two of these
vectors by cosine similarity is a direct "same person?" measure.

Runs on CPU (ArcFace embedding is cheap), so per-call cost is CPU-seconds, not a
GPU prediction. Returns an EMPTY list when no face is found, which the caller
(scoreIdentity.js) treats as "unreadable face" -> lowest identity score -> culled.
"""

from typing import List

import cv2
from cog import BasePredictor, Input, Path
from insightface.app import FaceAnalysis


class Predictor(BasePredictor):
    def setup(self):
        # ctx_id < 0 forces CPU. root="/src" points at the weights baked into the
        # image at build time (absolute path, independent of $HOME) so setup never
        # re-downloads at runtime.
        self.app = FaceAnalysis(
            name="buffalo_l", root="/src", providers=["CPUExecutionProvider"]
        )
        self.app.prepare(ctx_id=-1, det_size=(640, 640))

    def predict(self, image: Path = Input(description="Image containing a face")) -> List[float]:
        img = cv2.imread(str(image))
        if img is None:
            return []
        faces = self.app.get(img)
        if not faces:
            return []
        # Score the largest detected face (by bounding-box area).
        faces.sort(
            key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
            reverse=True,
        )
        return [float(x) for x in faces[0].normed_embedding]
