/*
This class implements fast mathematical operations to optimize or complement gl-matrix
*/
import type {mat4} from 'gl-matrix';

/*
Invert a transform matrix
dst and src are in column-major flat format
*/
export function fastInvertTransformMat4(dst: mat4, src: mat4): mat4{
    // extract scale. hyp: scale X = scale Y:
    const sXYSqInv = 1.0 / (src[0] * src[0] + src[1] * src[1] + src[2] * src[2]);
    const sZSqInv = 1.0 / (src[8] * src[8] + src[9] * src[9] + src[10] * src[10]);

    // inv rotation and scaling part:
    const s0 = src[0] * sXYSqInv;
    const s4 = src[4] * sXYSqInv;
    const s8 = src[8] * sZSqInv;
    const s1 = src[1] * sXYSqInv;
    const s5 = src[5] * sXYSqInv;
    const s9 = src[9] * sZSqInv;
    const s2 = src[2] * sXYSqInv;
    const s6 = src[6] * sXYSqInv;
    const s10 = src[10] * sZSqInv;

    // rotation part:
    dst[0] = s0;
    dst[1] = s4;
    dst[2] = s8;
    dst[4] = s1;
    dst[5] = s5;
    dst[6] = s9;
    dst[8] = s2;
    dst[9] = s6;
    dst[10] = s10;

    // translation part:
    const t0 = src[12];
    const t1 = src[13];
    const t2 = src[14];
    dst[12] = -s0 * t0 - s1 * t1 - s2 * t2;
    dst[13] = -s4 * t0 - s5 * t1 - s6 * t2;
    dst[14] = -s8 * t0 - s9 * t1 - s10 * t2;

    // constant part:
    dst[3] = 0;
    dst[7] = 0;
    dst[11] = 0;
    dst[15] = 1;

    return dst;
}

/*
Combined calculateTileMatrix + multiply in one pass, with no intermediate allocation.
Equivalent to: tileMatrix = calculateTileMatrix(tileID, worldSize); mat4.multiply(dst, viewProj, tileMatrix)
Caller supplies the three tile scalars directly:
  s  = worldSize / zoomScale(z) / EXTENT
  tx = unwrappedX * worldSize / zoomScale(z)
  ty = canonicalY * worldSize / zoomScale(z)
*/
export function fastCalcTilePosMatrix(dst: mat4, viewProj: mat4, s: number, tx: number, ty: number): mat4 {
    const a0 = viewProj[0], a1 = viewProj[1], a2 = viewProj[2], a3 = viewProj[3];
    const a4 = viewProj[4], a5 = viewProj[5], a6 = viewProj[6], a7 = viewProj[7];

    dst[12] = tx * a0 + ty * a4 + viewProj[12];
    dst[13] = tx * a1 + ty * a5 + viewProj[13];
    dst[14] = tx * a2 + ty * a6 + viewProj[14];
    dst[15] = tx * a3 + ty * a7 + viewProj[15];

    dst[0] = s * a0;
    dst[1] = s * a1;
    dst[2] = s * a2;
    dst[3] = s * a3;

    dst[4] = s * a4;
    dst[5] = s * a5;
    dst[6] = s * a6;
    dst[7] = s * a7;

    dst[8] = viewProj[8];
    dst[9] = viewProj[9];
    dst[10] = viewProj[10];
    dst[11] = viewProj[11];

    return dst;
}

/*
Invert a perspective projection matrix
dst and src are in column-major flat format
*/
export function fastInvertProjMat4(dst: mat4, src: mat4): mat4{
    dst[0] = 1 / src[0];
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;

    dst[4] = 0;
    dst[5] = 1 / src[5];
    dst[6] = 0;
    dst[7] = 0;

    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 0;
    dst[11] = 1 / src[14];

    dst[12] = 0;
    dst[13] = 0;
    dst[14] = -1;
    dst[15] = src[10] / src[14];

    return dst;
}

/*
Invert a skew matrix
with diag coefficients > 0 and XY counterdiag
dst and src are in column-major flat format
*/

export function fastInvertSkewMat4(dst: mat4, src: mat4): mat4{
    const invDetXY = 1.0 / (src[0]*src[5] - src[1]*src[4]);
    dst[0] = src[5] * invDetXY;
    dst[1] = -src[1] * invDetXY;
    dst[2] = 0;
    dst[3] = 0;

    dst[4] = -src[4] * invDetXY;
    dst[5] = src[0] * invDetXY;
    dst[6] = 0;
    dst[7] = 0;

    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1 / src[10];
    dst[11] = 0;

    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1 / src[15];

    return dst;
}
