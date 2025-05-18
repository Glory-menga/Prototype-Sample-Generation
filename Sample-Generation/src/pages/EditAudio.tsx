import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Sphere from '../components/Sphere';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as Tone from 'tone';

const EditAudio = () => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [tempo, setTempo] = useState<string>('normal');
  const [isReversed, setIsReversed] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const playerRef = useRef<Tone.Player | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const originalBufferRef = useRef<AudioBuffer | null>(null);
  
  const tempoOptions = [
    { value: 'very slow', rate: 0.5 },
    { value: 'slow', rate: 0.75 },
    { value: 'normal', rate: 1 },
    { value: 'fast', rate: 1.25 },
    { value: 'very fast', rate: 1.5 }
  ];

  useEffect(() => {
    const sampleRaw = localStorage.getItem('sample');
    if (!sampleRaw) {
      toast.error('Generate a sample first before using the Metaball editor!');
      navigate('/generate');
      return;
    }

    try {
      const sample = JSON.parse(sampleRaw);
      if (!sample.url) {
        toast.error('Invalid sample data. Please generate a new sample.');
        navigate('/generate');
        return;
      }
      // 🔁 Use backend proxy to load the audio safely
      setProxyUrl(`http://localhost:5000/proxy-audio?url=${encodeURIComponent(sample.url)}`);
    } catch (err) {
      toast.error('Something went wrong. Please generate a new sample.');
      navigate('/generate');
    }
  }, []);

  // Setup audio analyser for visualization
  useEffect(() => {
    if (audioRef.current && !analyserRef.current) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;

      const sourceNode = audioContext.createMediaElementSource(audioRef.current);
      sourceNode.connect(analyserNode);
      analyserNode.connect(audioContext.destination);

      analyserRef.current = analyserNode;
      sourceRef.current = sourceNode;
      setAnalyser(analyserNode);
    }
  }, [proxyUrl]);

  // Load the audio into Tone.js for processing
  useEffect(() => {
    if (proxyUrl) {
      Tone.start();
      
      const loadBuffer = async () => {
        try {
          const buffer = await Tone.Buffer.fromUrl(proxyUrl);
          originalBufferRef.current = buffer.get() as AudioBuffer;
          bufferRef.current = buffer.get() as AudioBuffer;
          
          playerRef.current = new Tone.Player(buffer).toDestination();
        } catch (error) {
          console.error("Error loading audio buffer:", error);
          toast.error("Failed to load audio for processing");
        }
      };
      
      loadBuffer();
    }
    
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [proxyUrl]);

  const handleTempoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    const selectedTempo = tempoOptions[value];
    setTempo(selectedTempo.value);
    
    if (audioRef.current) {
      audioRef.current.playbackRate = selectedTempo.rate;
      
      const sampleRaw = localStorage.getItem('sample');
      if (sampleRaw) {
        const sample = JSON.parse(sampleRaw);
        sample.tempo = selectedTempo.value;
        sample.playbackRate = selectedTempo.rate;
        localStorage.setItem('sample', JSON.stringify(sample));
      }
    }
  };

  const handleReverseToggle = async () => {
    if (isProcessing || !proxyUrl || !originalBufferRef.current) return;
    
    setIsProcessing(true);
    
    try {
      const newReversedState = !isReversed;
      setIsReversed(newReversedState);
      const originalBuffer = originalBufferRef.current;
      let processedBuffer;
      
      if (newReversedState) {
        processedBuffer = reverseAudioBuffer(originalBuffer);
      } else {
        processedBuffer = originalBuffer;
      }
      
      const blob = await bufferToBlob(processedBuffer);
      const newUrl = URL.createObjectURL(blob);
      
      // Update the audio element
      if (audioRef.current) {
        const wasPlaying = !audioRef.current.paused;
        audioRef.current.src = newUrl;
        audioRef.current.load();
        
        const tempoIndex = tempoOptions.findIndex(option => option.value === tempo);
        if (tempoIndex >= 0) {
          audioRef.current.playbackRate = tempoOptions[tempoIndex].rate;
        }
        
        if (wasPlaying) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => console.log("Playback error:", e));
          }
        }
      }
      
      const sampleRaw = localStorage.getItem('sample');
      if (sampleRaw) {
        const sample = JSON.parse(sampleRaw);
        sample.isReversed = newReversedState;
        localStorage.setItem('sample', JSON.stringify(sample));
      }
      
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error("Failed to process audio");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Function to reverse an audio buffer
  const reverseAudioBuffer = (buffer: AudioBuffer): AudioBuffer => {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length;
    const reversedBuffer = Tone.context.createBuffer(
      numChannels, 
      length, 
      buffer.sampleRate
    );
    
    for (let channel = 0; channel < numChannels; channel++) {
      const originalData = buffer.getChannelData(channel);
      const reversedData = reversedBuffer.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        reversedData[i] = originalData[length - 1 - i];
      }
    }
    
    return reversedBuffer;
  };
  
  const bufferToBlob = async (buffer: AudioBuffer): Promise<Blob> => {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start(0);
    
    const renderedBuffer = await offlineCtx.startRendering();
    
    // Convert to WAV format
    const wavBlob = audioBufferToWav(renderedBuffer);
    return wavBlob;
  };
  
  // Function to convert AudioBuffer to WAV Blob
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * numChannels * bytesPerSample;
    
    // Create the buffer for the WAV file
    const buffer2 = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer2);
    
    // Write the WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); 
    view.setUint16(20, 1, true); 
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    const offset = 44;
    let index = 0;
    const channelData = [];
    
    for (let i = 0; i < numChannels; i++) {
      channelData.push(buffer.getChannelData(i));
    }
    
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        const int16Sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset + index, int16Sample, true);
        index += 2;
      }
    }
    
    return new Blob([buffer2], { type: 'audio/wav' });
  };
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="container">
        <div className="edit-audio-wrapper">
          <div className="go-back">
            <button onClick={() => navigate(-1)}>Go Back</button>
          </div>

          <div className="canvas-wrapper" style={{ width: '100%', height: '100vh' }}>
            <Canvas camera={{ position: [0, 0, 3], fov: 60 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <Environment preset="studio" />
              <Sphere analyser={analyser} />
              <OrbitControls />
            </Canvas>
          </div>
          <div className='edit-audio'>
            <div className='edit'>
              <h2>Tempo: {tempo.charAt(0).toUpperCase() + tempo.slice(1)}</h2>
              <div className='tempo-slider'>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={tempoOptions.findIndex(option => option.value === tempo)}
                  onChange={handleTempoChange}
                  className="slider"
                />
              </div>
            </div>
            <div className='edit'>
              <h2>0 semitones</h2>
              <div className='pitch-slider'>
                <p>slider</p>
              </div>
            </div>
            <div className='edit'>
              <h2>Reverse: {isReversed ? 'ON' : 'OFF'}</h2>
              <div className='reverse-toggle'>
                <button 
                  onClick={handleReverseToggle}
                  disabled={isProcessing}
                  className={`toggle-button ${isReversed ? 'active' : ''}`}
                  style={{
                    padding: '8px 16px',
                    background: isReversed ? '#4CAF50' : '#f0f0f0',
                    color: isReversed ? 'white' : 'black',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.7 : 1,
                  }}
                >
                  {isProcessing ? 'Processing...' : (isReversed ? 'ON' : 'OFF')}
                </button>
              </div>
            </div>
          </div>
          <div className="test-sound">
            {proxyUrl && (
              <audio 
                loop 
                controls 
                ref={audioRef} 
                crossOrigin="anonymous"
              >
                <source src={proxyUrl} type="audio/mp3" />
              </audio>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EditAudio;