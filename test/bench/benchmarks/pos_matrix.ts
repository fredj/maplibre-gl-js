import Benchmark from '../lib/benchmark.ts';
import {LngLat} from '../styles/index.ts';
import {MercatorTransform} from '../../../src/geo/projection/mercator_transform.ts';
import {coveringTiles} from '../../../src/geo/projection/covering_tiles.ts';
import type {OverscaledTileID} from '../../../src/tile/tile_id.ts';

export default class PosMatrix extends Benchmark {
    _transform: MercatorTransform;
    _tileIDs: OverscaledTileID[];
    _zoom: number;
    _i: number;

    setup(): void {
        this._transform = new MercatorTransform();
        this._transform.setCenter(new LngLat(-77.032194, 38.912753));
        this._transform.setZoom(13);
        this._transform.resize(1920, 1080);
        this._tileIDs = coveringTiles(this._transform, {tileSize: 512});
        this._zoom = this._transform.zoom;
        this._i = 0;
    }

    bench(): void {
        // Nudge zoom to simulate a frame during map movement, which clears the posMatrix cache.
        this._transform.setZoom(this._zoom + (this._i++ % 2 === 0 ? 0.00001 : -0.00001));
        for (const id of this._tileIDs) {
            this._transform.calculatePosMatrix(id);
        }
    }
}
