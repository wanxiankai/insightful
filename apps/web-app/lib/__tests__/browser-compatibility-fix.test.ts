import { describe, it, expect, beforeEach, vi } from 'vitest';
import { browserCompatibility } from '../browser-compatibility';

describe('Browser Compatibility Fix', () => {
  beforeEach(() => {
    // Reset any cached data
    browserCompatibility.clearCache();
  });

  it('should not throw Illegal invocation error when checking compatibility', () => {
    expect(() => {
      const result = browserCompatibility.checkCompatibility();
      expect(result).toBeDefined();
      expect(typeof result.isFullySupported).toBe('boolean');
      expect(typeof result.isPartiallySupported).toBe('boolean');
    }).not.toThrow();
  });

  it('should safely get best supported MIME type', () => {
    expect(() => {
      const mimeType = browserCompatibility.getBestSupportedMimeType();
      expect(typeof mimeType).toBe('string');
      expect(mimeType).toMatch(/^audio\//);
    }).not.toThrow();
  });

  it('should safely get supported MIME types', () => {
    expect(() => {
      const mimeTypes = browserCompatibility.getSupportedMimeTypes();
      expect(Array.isArray(mimeTypes)).toBe(true);
      expect(mimeTypes.length).toBeGreaterThan(0);
    }).not.toThrow();
  });

  it('should handle missing MediaRecorder gracefully', () => {
    // Mock missing MediaRecorder
    const originalMediaRecorder = window.MediaRecorder;
    delete (window as any).MediaRecorder;

    expect(() => {
      const result = browserCompatibility.checkCompatibility();
      expect(result.browserInfo.supportedFeatures.mediaRecorder).toBe(false);
    }).not.toThrow();

    // Restore MediaRecorder
    (window as any).MediaRecorder = originalMediaRecorder;
  });

  it('should handle missing AudioContext gracefully', () => {
    // Mock missing AudioContext
    const originalAudioContext = window.AudioContext;
    delete (window as any).AudioContext;

    expect(() => {
      const result = browserCompatibility.checkCompatibility();
      expect(result.browserInfo.supportedFeatures.audioWorklet).toBe(false);
    }).not.toThrow();

    // Restore AudioContext
    (window as any).AudioContext = originalAudioContext;
  });

  it('should handle MediaRecorder.isTypeSupported errors gracefully', () => {
    // Mock MediaRecorder.isTypeSupported to throw error
    const originalIsTypeSupported = MediaRecorder.isTypeSupported;
    MediaRecorder.isTypeSupported = vi.fn().mockImplementation(() => {
      throw new Error('Illegal invocation');
    });

    expect(() => {
      const mimeType = browserCompatibility.getBestSupportedMimeType();
      expect(mimeType).toBe('audio/webm'); // Should fallback
    }).not.toThrow();

    // Restore original method
    MediaRecorder.isTypeSupported = originalIsTypeSupported;
  });

  it('should provide fallback when browser compatibility check fails', () => {
    // Mock navigator to cause errors
    const originalNavigator = global.navigator;
    delete (global as any).navigator;

    expect(() => {
      const result = browserCompatibility.checkCompatibility();
      expect(result).toBeDefined();
      // Should still return a valid result even with missing navigator
    }).not.toThrow();

    // Restore navigator
    global.navigator = originalNavigator;
  });
});