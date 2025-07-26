import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock MediaRecorder API
global.MediaRecorder = class MockMediaRecorder {
  static isTypeSupported = vi.fn().mockReturnValue(true)
  
  constructor(stream: MediaStream, options?: MediaRecorderOptions) {
    this.stream = stream
    this.options = options
  }
  
  stream: MediaStream
  options?: MediaRecorderOptions
  state: 'inactive' | 'recording' | 'paused' = 'inactive'
  mimeType = 'audio/webm'
  ondataavailable: ((event: BlobEvent) => void) | null = null
  onstart: (() => void) | null = null
  onstop: (() => void) | null = null
  onerror: ((event: Event) => void) | null = null
  
  start(timeslice?: number) {
    this.state = 'recording'
    if (this.onstart) this.onstart()
    
    // Simulate data available events
    if (timeslice && this.ondataavailable) {
      const interval = setInterval(() => {
        if (this.state === 'recording' && this.ondataavailable) {
          const blob = new Blob(['mock audio data'], { type: this.mimeType })
          this.ondataavailable({ data: blob } as BlobEvent)
        } else {
          clearInterval(interval)
        }
      }, timeslice)
    }
  }
  
  stop() {
    this.state = 'inactive'
    if (this.onstop) this.onstop()
  }
  
  pause() {
    this.state = 'paused'
  }
  
  resume() {
    this.state = 'recording'
  }
  
  requestData() {
    if (this.ondataavailable) {
      const blob = new Blob(['mock audio data'], { type: this.mimeType })
      this.ondataavailable({ data: blob } as BlobEvent)
    }
  }
} as any

// Mock getUserMedia
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [
        {
          stop: vi.fn(),
          readyState: 'live',
          label: 'Mock Audio Track',
          kind: 'audio'
        }
      ],
      getAudioTracks: () => [
        {
          stop: vi.fn(),
          readyState: 'live',
          label: 'Mock Audio Track',
          kind: 'audio'
        }
      ]
    })
  }
})

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock Blob constructor
global.Blob = class MockBlob {
  constructor(parts: any[], options?: BlobPropertyBag) {
    this.size = parts.reduce((acc, part) => {
      if (typeof part === 'string') return acc + part.length
      if (part && typeof part.length === 'number') return acc + part.length
      return acc + 10 // Default size for mock data
    }, 0)
    this.type = options?.type || ''
  }
  
  size: number
  type: string
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size))
  }
  
  text() {
    return Promise.resolve('mock text')
  }
  
  stream() {
    return new ReadableStream()
  }
  
  slice() {
    return new MockBlob([], { type: this.type })
  }
} as any