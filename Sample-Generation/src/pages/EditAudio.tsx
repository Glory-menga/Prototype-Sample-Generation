import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Sphere from '../components/Sphere';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditAudio = () => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [tempo, setTempo] = useState<string>('normal');
  
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

  const handleTempoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    const selectedTempo = tempoOptions[value];
    setTempo(selectedTempo.value);
    
    // Apply the playback rate directly to the audio element
    if (audioRef.current) {
      audioRef.current.playbackRate = selectedTempo.rate;
      
      // Save to localStorage
      const sampleRaw = localStorage.getItem('sample');
      if (sampleRaw) {
        const sample = JSON.parse(sampleRaw);
        sample.tempo = selectedTempo.value;
        sample.playbackRate = selectedTempo.rate;
        localStorage.setItem('sample', JSON.stringify(sample));
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
              <h2>Reverse : OFF</h2>
              <div className='reverse-toggle'>
                <p>Toggle</p>
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