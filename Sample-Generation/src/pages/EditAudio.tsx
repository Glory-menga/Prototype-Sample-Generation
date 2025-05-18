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
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [tempo, setTempo] = useState<string>('normal');
  const [isReversed, setIsReversed] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pitch, setPitch] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const playerRef = useRef<any>(null);
  const pitchShiftRef = useRef<Tone.PitchShift | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const originalBufferRef = useRef<AudioBuffer | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausePositionRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lastTimeRef = useRef<number>(0);

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
      setProxyUrl(`http://localhost:5000/proxy-audio?url=${encodeURIComponent(sample.url)}`);
    } catch (err) {
      toast.error('Something went wrong. Please generate a new sample.');
      navigate('/generate');
    }
  }, []);

  useEffect(() => {
    if (proxyUrl) {
      Tone.start();

      const loadBuffer = async () => {
        try {
          const buffer = await Tone.Buffer.fromUrl(proxyUrl);
          originalBufferRef.current = buffer.get() as AudioBuffer;
          bufferRef.current = buffer.get() as AudioBuffer;
          setDuration(buffer.duration);

          pitchShiftRef.current = new Tone.PitchShift(pitch);

          playerRef.current = new (Tone as any).GrainPlayer({
            url: buffer,
            loop: true,
            playbackRate: tempoOptions.find(opt => opt.value === tempo)?.rate || 1,
          });

          playerRef.current.connect(pitchShiftRef.current);

          const audioContext = Tone.getContext().rawContext;
          analyserRef.current = audioContext.createAnalyser();
          analyserRef.current.fftSize = 256;

          pitchShiftRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContext.destination);

        } catch (error) {
          console.error("Error loading audio buffer:", error);
          toast.error("Failed to load audio for processing");
        }
      };

      loadBuffer();
    }

    return () => {
      playerRef.current?.dispose();
      pitchShiftRef.current?.dispose();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [proxyUrl]);

  const updateTime = () => {
    if (isPlaying) {
      const now = Tone.now();
      setCurrentTime((now - startTimeRef.current) + pausePositionRef.current);
      animationRef.current = requestAnimationFrame(updateTime);
    }
  };

  const handlePlay = () => {
    if (playerRef.current && !isPlaying) {
      Tone.Transport.start();
      playerRef.current.start();
      setIsPlaying(true);
      setCurrentTime(0);
      lastTimeRef.current = Tone.Transport.seconds;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(updateTime);
    }
  };

  const handlePause = () => {
    if (playerRef.current && isPlaying) {
      playerRef.current.stop();
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  };

  const handleTempoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    const selectedTempo = tempoOptions[value];
    setTempo(selectedTempo.value);

    if (playerRef.current) {
      playerRef.current.playbackRate = selectedTempo.rate;
    }

    const sampleRaw = localStorage.getItem('sample');
    if (sampleRaw) {
      const sample = JSON.parse(sampleRaw);
      sample.tempo = selectedTempo.value;
      sample.playbackRate = selectedTempo.rate;
      localStorage.setItem('sample', JSON.stringify(sample));
    }
  };

  const handlePitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    setPitch(value);
    pitchShiftRef.current!.pitch = value;

    const sampleRaw = localStorage.getItem('sample');
    if (sampleRaw) {
      const sample = JSON.parse(sampleRaw);
      sample.pitch = value;
      localStorage.setItem('sample', JSON.stringify(sample));
    }
  };

  const handleReverseToggle = async () => {
    if (isProcessing || !proxyUrl || !originalBufferRef.current) return;

    setIsProcessing(true);
    handlePause();

    try {
      const newReversedState = !isReversed;
      setIsReversed(newReversedState);
      const originalBuffer = originalBufferRef.current;
      let processedBuffer = newReversedState ? reverseAudioBuffer(originalBuffer) : originalBuffer;

      bufferRef.current = processedBuffer;

      playerRef.current?.dispose();
      pitchShiftRef.current?.dispose();

      pitchShiftRef.current = new Tone.PitchShift(pitch);

      playerRef.current = new (Tone as any).GrainPlayer({
        url: new Tone.ToneAudioBuffer().fromArray([
          processedBuffer.getChannelData(0),
          ...(processedBuffer.numberOfChannels > 1 ? [processedBuffer.getChannelData(1)] : [])
        ]),
        loop: true,
        playbackRate: tempoOptions.find(opt => opt.value === tempo)?.rate || 1,
      });

      playerRef.current.connect(pitchShiftRef.current);

      const audioContext = Tone.getContext().rawContext;
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;

      pitchShiftRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContext.destination);

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

  const reverseAudioBuffer = (buffer: AudioBuffer): AudioBuffer => {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length;
    const reversedBuffer = Tone.context.createBuffer(numChannels, length, buffer.sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const originalData = buffer.getChannelData(channel);
      const reversedData = reversedBuffer.getChannelData(channel);

      for (let i = 0; i < length; i++) {
        reversedData[i] = originalData[length - 1 - i];
      }
    }

    return reversedBuffer;
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
              <Sphere analyser={analyserRef.current} />
              <OrbitControls />
            </Canvas>
          </div>

          <div className='edit-audio'>
            <div className='edit'>
              <h2>Tempo: {tempo.charAt(0).toUpperCase() + tempo.slice(1)}</h2>
              <input type="range" min="0" max="4" step="1"
                value={tempoOptions.findIndex(opt => opt.value === tempo)}
                onChange={handleTempoChange}
              />
            </div>

            <div className='edit'>
              <h2>{pitch} semitones</h2>
              <input type="range" min="-12" max="12" step="1" value={pitch} onChange={handlePitchChange} />
            </div>

            <div className='edit'>
              <h2>Reverse: {isReversed ? 'ON' : 'OFF'}</h2>
              <button onClick={handleReverseToggle} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : (isReversed ? 'ON' : 'OFF')}
              </button>
            </div>

            <div className='edit'>
              <h2>Playback</h2>
              <button onClick={handlePlay} disabled={isPlaying}>Play</button>
              <button onClick={handlePause} disabled={!isPlaying}>Pause</button>
              <p>{formatTime(currentTime)} / {formatTime(duration)}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditAudio;
