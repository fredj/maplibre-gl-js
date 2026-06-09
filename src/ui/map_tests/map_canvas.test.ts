import {describe, beforeEach, test, expect, vi} from 'vitest';
import {createMap, beforeMapTest} from '../../util/test/util.ts';
import type {WebGLContextAttributesWithType} from '../map.ts';

beforeEach(() => {
    beforeMapTest();
    global.fetch = null;
});

describe('Max Canvas Size option', () => {
    test('maxCanvasSize width = height', () => {
        const container = window.document.createElement('div');
        Object.defineProperty(container, 'clientWidth', {value: 2048});
        Object.defineProperty(container, 'clientHeight', {value: 2048});
        const map = createMap({container, maxCanvasSize: [8192, 8192], pixelRatio: 5});
        vi.spyOn(map.painter.context.gl, 'drawingBufferWidth', 'get').mockReturnValue(8192);
        vi.spyOn(map.painter.context.gl, 'drawingBufferHeight', 'get').mockReturnValue(8192);
        map.resize();
        expect(map.getCanvas().width).toBe(8192);
        expect(map.getCanvas().height).toBe(8192);
    });

    test('maxCanvasSize width != height', () => {
        const container = window.document.createElement('div');
        Object.defineProperty(container, 'clientWidth', {value: 1024});
        Object.defineProperty(container, 'clientHeight', {value: 2048});
        const map = createMap({container, maxCanvasSize: [8192, 4096], pixelRatio: 3});
        vi.spyOn(map.painter.context.gl, 'drawingBufferWidth', 'get').mockReturnValue(8192);
        vi.spyOn(map.painter.context.gl, 'drawingBufferHeight', 'get').mockReturnValue(4096);
        map.resize();
        expect(map.getCanvas().width).toBe(2048);
        expect(map.getCanvas().height).toBe(4096);
    });

    test('maxCanvasSize below clientWidth and clientHeight', () => {
        const container = window.document.createElement('div');
        Object.defineProperty(container, 'clientWidth', {value: 12834});
        Object.defineProperty(container, 'clientHeight', {value: 9000});
        const map = createMap({container, maxCanvasSize: [4096, 8192], pixelRatio: 1});
        vi.spyOn(map.painter.context.gl, 'drawingBufferWidth', 'get').mockReturnValue(4096);
        vi.spyOn(map.painter.context.gl, 'drawingBufferHeight', 'get').mockReturnValue(8192);
        map.resize();
        expect(map.getCanvas().width).toBe(4096);
        expect(map.getCanvas().height).toBe(2872);
    });

    test('maxCanvasSize with setPixelRatio', () => {
        const container = window.document.createElement('div');
        Object.defineProperty(container, 'clientWidth', {value: 2048});
        Object.defineProperty(container, 'clientHeight', {value: 2048});
        const map = createMap({container, maxCanvasSize: [3072, 3072], pixelRatio: 1.25});
        vi.spyOn(map.painter.context.gl, 'drawingBufferWidth', 'get').mockReturnValue(3072);
        vi.spyOn(map.painter.context.gl, 'drawingBufferHeight', 'get').mockReturnValue(3072);
        map.resize();
        expect(map.getCanvas().width).toBe(2560);
        expect(map.getCanvas().height).toBe(2560);
        map.setPixelRatio(2);
        expect(map.getCanvas().width).toBe(3072);
        expect(map.getCanvas().height).toBe(3072);
    });
});

describe('WebGLContextAttributes options', () => {
    test('Optional values can be set correctly', () => {
        const container = window.document.createElement('div');
        const canvasContextAttributes: WebGLContextAttributesWithType = {
            antialias: true,
            preserveDrawingBuffer: true,
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: true,
            desynchronized: true,
        };
        Object.defineProperty(container, 'clientWidth', {value: 2048});
        Object.defineProperty(container, 'clientHeight', {value: 2048});
        const map = createMap({container, canvasContextAttributes});
        const gl = map.painter.context.gl;
        const mapContextAttributes = gl.getContextAttributes();
        expect(mapContextAttributes.antialias).toBe(canvasContextAttributes.antialias);
        expect(mapContextAttributes.preserveDrawingBuffer).toBe(canvasContextAttributes.preserveDrawingBuffer);
        expect(mapContextAttributes.powerPreference).toBe(canvasContextAttributes.powerPreference);
        expect(mapContextAttributes.failIfMajorPerformanceCaveat).toBe(canvasContextAttributes.failIfMajorPerformanceCaveat);
        expect(mapContextAttributes.desynchronized).toBe(canvasContextAttributes.desynchronized);
    });

    test('Required values cannot be set', () => {
        const container = window.document.createElement('div');
        const canvasContextAttributes = {
            alpha: false,
            depth: false,
            stencil: false,
            premultipliedAlpha: false,
        };
        Object.defineProperty(container, 'clientWidth', {value: 2048});
        Object.defineProperty(container, 'clientHeight', {value: 2048});
        const map = createMap({container, canvasContextAttributes});
        const mapContextAttributes = map.painter.context.gl.getContextAttributes();
        expect(mapContextAttributes.alpha).toBe(true);
        expect(mapContextAttributes.depth).toBe(true);
        expect(mapContextAttributes.stencil).toBe(true);
        expect(mapContextAttributes.premultipliedAlpha).toBe(true);
    });

});

describe('captureImageData', () => {
    test('returns an ImageData with the correct dimensions', () => {
        const container = window.document.createElement('div');
        Object.defineProperty(container, 'clientWidth', {value: 256});
        Object.defineProperty(container, 'clientHeight', {value: 128});
        const map = createMap({container});
        const gl = map.painter.context.gl;

        vi.spyOn(gl, 'readPixels').mockImplementation(
            (_x, _y, w, h, _format, _type, pixels) => {
                if (pixels instanceof Uint8Array) {
                    pixels.fill(128);
                }
            }
        );

        const imageData = map.captureImageData();

        expect(imageData).toBeInstanceOf(ImageData);
        expect(imageData.width).toBe(map.painter.width);
        expect(imageData.height).toBe(map.painter.height);
    });

    test('uses an offscreen framebuffer, not the canvas default framebuffer', () => {
        const container = window.document.createElement('div');
        Object.defineProperty(container, 'clientWidth', {value: 64});
        Object.defineProperty(container, 'clientHeight', {value: 64});
        const map = createMap({container});
        const context = map.painter.context;

        const bindFramebufferSpy = vi.spyOn(context.gl, 'bindFramebuffer');

        map.captureImageData();

        const nullBindCalls = bindFramebufferSpy.mock.calls.filter(
            ([_target, fb]) => fb === null
        );
        const nonNullBindCalls = bindFramebufferSpy.mock.calls.filter(
            ([_target, fb]) => fb !== null
        );
        expect(nonNullBindCalls.length).toBeGreaterThan(0);
        // The final restore to null should be present
        expect(nullBindCalls.length).toBeGreaterThan(0);
    });

    test('cleans up FBO resources after capture', () => {
        const container = window.document.createElement('div');
        Object.defineProperty(container, 'clientWidth', {value: 64});
        Object.defineProperty(container, 'clientHeight', {value: 64});
        const map = createMap({container});
        const gl = map.painter.context.gl;

        const deleteFramebufferSpy = vi.spyOn(gl, 'deleteFramebuffer');
        const deleteTextureSpy = vi.spyOn(gl, 'deleteTexture');
        const deleteRenderbufferSpy = vi.spyOn(gl, 'deleteRenderbuffer');

        map.captureImageData();

        expect(deleteFramebufferSpy).toHaveBeenCalled();
        expect(deleteTextureSpy).toHaveBeenCalled();
        expect(deleteRenderbufferSpy).toHaveBeenCalled();
    });

    test('flips pixel rows from WebGL bottom-up to top-down', () => {
        const container = window.document.createElement('div');
        Object.defineProperty(container, 'clientWidth', {value: 2});
        Object.defineProperty(container, 'clientHeight', {value: 2});
        const map = createMap({container, pixelRatio: 1});
        const gl = map.painter.context.gl;

        // WebGL readPixels gives bottom row first.
        // Row 0 (bottom in GL) = red, row 1 (top in GL) = blue.
        vi.spyOn(gl, 'readPixels').mockImplementation(
            (_x, _y, _w, _h, _format, _type, pixels) => {
                if (pixels instanceof Uint8Array) {
                    // bottom row: red
                    pixels[0] = 255; pixels[1] = 0; pixels[2] = 0; pixels[3] = 255;
                    pixels[4] = 255; pixels[5] = 0; pixels[6] = 0; pixels[7] = 255;
                    // top row: blue
                    pixels[8] = 0; pixels[9] = 0; pixels[10] = 255; pixels[11] = 255;
                    pixels[12] = 0; pixels[13] = 0; pixels[14] = 255; pixels[15] = 255;
                }
            }
        );

        const imageData = map.captureImageData();

        // After flip: row 0 of ImageData (top) should be blue (was top in GL)
        expect(imageData.data[0]).toBe(0);    // R
        expect(imageData.data[2]).toBe(255);   // B
        // Row 1 of ImageData (bottom) should be red (was bottom in GL)
        expect(imageData.data[8]).toBe(255);   // R
        expect(imageData.data[10]).toBe(0);    // B
    });

    test('captureFramebuffer is null after capture completes', () => {
        const container = window.document.createElement('div');
        Object.defineProperty(container, 'clientWidth', {value: 64});
        Object.defineProperty(container, 'clientHeight', {value: 64});
        const map = createMap({container});

        map.captureImageData();

        expect(map.painter.captureFramebuffer).toBeNull();
    });
});
