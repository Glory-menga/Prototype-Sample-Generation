import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Sphere from '../components/Sphere';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// We'll use this library for BPM detection
import * as Tone from 'tone';

const EditAudio = () => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [originalBpm, setOriginalBpm] = useState<number | null>(null);
  const [bpm, setBpm] = useState<number>(120);
  const [bpmRatio, setBpmRatio] = useState<number>(1);
  const playerRef = useRef<Tone.Player | null>(null);

    const detectBPM = async (player: Tone.Player) => {
    try {
      // First we need to analyze the audio for transients/onsets
      const buffer = player.buffer;
      
      // This is a simplified BPM detection algorithm
      // For production, consider a more robust library like BeatDetektor or meyda.js
      const analyzeForBPM = () => {
        if (!buffer.loaded) {
          setTimeout(analyzeForBPM, 100);
          return;
        }
        
        // For the demo, we'll use a basic algorithmic approach
        // Get the audio data
        const audioData = buffer.getChannelData(0); // Get first channel
        const sampleRate = buffer.sampleRate;
        
        // Simulated detection - in a real app, you'd use advanced beat detection algorithms
        // For now, we'll simulate finding a BPM based on amplitude peaks
        const frameSize = 1024;
        const energyData = [];
        
        // Calculate energy in chunks
        for (let i = 0; i < audioData.length; i += frameSize) {
          let energy = 0;
          for (let j = 0; j < frameSize && i + j < audioData.length; j++) {
            energy += Math.abs(audioData[i + j]);
          }
          energyData.push(energy / frameSize);
        }
        
        // Find peaks in energy data (rough beat detection)
        const threshold = 0.3; // Adjust based on your audio
        const peaks = [];
        for (let i = 2; i < energyData.length - 2; i++) {
          if (energyData[i] > threshold && 
              energyData[i] > energyData[i-1] && 
              energyData[i] > energyData[i-2] &&
              energyData[i] > energyData[i+1] && 
              energyData[i] > energyData[i+2]) {
            peaks.push(i);
          }
        }
        
        // Calculate average time between peaks
        if (peaks.length > 2) {
          const timeBetweenPeaks = [];
          for (let i = 1; i < peaks.length; i++) {
            timeBetweenPeaks.push(peaks[i] - peaks[i-1]);
          }
          
          // Get average time between peaks in samples
          const avgTimeBetweenPeaks = timeBetweenPeaks.reduce((a, b) => a + b, 0) / timeBetweenPeaks.length;
          
          // Convert to time (seconds)
          const avgTimeBetweenPeaksSeconds = (avgTimeBetweenPeaks * frameSize) / sampleRate;
          
          // Convert to BPM
          const detectedBpm = Math.round(60 / avgTimeBetweenPeaksSeconds);
          
          // Adjust to a reasonable range (60-180)
          let adjustedBpm = detectedBpm;
          while (adjustedBpm > 180) adjustedBpm /= 2;
          while (adjustedBpm < 60) adjustedBpm *= 2;
          
          console.log(`Detected BPM: ${adjustedBpm}`);
          setOriginalBpm(adjustedBpm);
          setBpm(adjustedBpm);
        } else {
          // Fallback if detection fails
          console.log("Couldn't detect BPM accurately. Using default of 120.");
          setOriginalBpm(120);
          setBpm(120);
        }
      };
      
      analyzeForBPM();
      
    } catch (error) {
      console.error("Error detecting BPM:", error);
      // Fallback to default
      setOriginalBpm(120);
      setBpm(120);
    }
  };
  
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
      
      // Initialize Tone.js
      Tone.start();
      
      // Create a Tone.js player that will be used for audio analysis
      const player = new Tone.Player({
        url: `http://localhost:5000/proxy-audio?url=${encodeURIComponent(sample.url)}`,
        onload: () => {
          detectBPM(player);
        }
      }).toDestination();
      
      playerRef.current = player;
      
    } catch (err) {
      toast.error('Something went wrong. Please generate a new sample.');
      navigate('/generate');
    }
  }, []);

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

  // Handle BPM slider change
  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(e.target.value, 10);
    setBpm(newBpm);
    
    if (originalBpm && audioRef.current) {
      // Calculate the playback rate based on the ratio of new BPM to original BPM
      const newPlaybackRate = newBpm / originalBpm;
      setBpmRatio(newPlaybackRate);
      
      // Apply the playback rate to the audio element
      audioRef.current.playbackRate = newPlaybackRate;
      
      // Update the Tone.js player if needed
      if (playerRef.current) {
        playerRef.current.playbackRate = newPlaybackRate;
      }
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
              <h2>{bpm} BPM {originalBpm && `(Original: ${originalBpm})`}</h2>
              <div className='bpm-slider'>
                <input
                  type="range"
                  min={originalBpm ? Math.max(60, Math.floor(originalBpm * 0.5)) : 60}
                  max={originalBpm ? Math.min(200, Math.ceil(originalBpm * 2)) : 200}
                  value={bpm}
                  onChange={handleBpmChange}
                  className="slider"
                  id="bpmSlider"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div className='edit'>
              <h2>Reverb : OFF</h2>
              <div className='reverb-toggle'>
                <p>Toggle</p>
              </div>
            </div>
            <div className='edit'>
              <h2>Reverse : OFF</h2>
              <div className='reverse-toggle'>
                <p>Toggle</p>
              </div>
            </div><div className='edit'>
              <h2>0 semitones</h2>
              <div className='pitch-slider'>
                <p>slider</p>
              </div>
            </div>
          </div>
          <div className="test-sound">
            {proxyUrl && (
              <>
                <audio 
                  controls 
                  ref={audioRef} 
                  crossOrigin="anonymous"
                  preload="auto"
                  onPlay={() => {
                    // Ensure the playback rate is applied when playing
                    if (audioRef.current && originalBpm) {
                      audioRef.current.playbackRate = bpmRatio;
                    }
                  }}
                >
                  <source src={proxyUrl} type="audio/mp3" />
                </audio>
                {originalBpm ? (
                  <p className="bpm-info">
                    Playback speed: {(bpmRatio * 100).toFixed(0)}%
                  </p>
                ) : (
                  <p className="bpm-info">Analyzing BPM...</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EditAudio;