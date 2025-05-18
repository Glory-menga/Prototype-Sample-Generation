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
              <h2>140 BPM</h2>
              <div className='bpm-slider'>
                <p>slider</p>
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
              <audio controls ref={audioRef} crossOrigin="anonymous">
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
