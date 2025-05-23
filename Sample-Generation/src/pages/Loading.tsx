import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import LoadingLoop from '../assets/video/Loading-loop.mp4';

const Loading = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ✅ Prevent double execution in development (StrictMode)
  const hasRunRef = useRef(false);

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    console.log("⏳ Prompt passed to loading page:", prompt);

    if (hasRunRef.current) return; // ✅ BLOCK second call
    hasRunRef.current = true;

    if (!prompt) {
      navigate('/generate');
      return;
    }

    const generateSample = async () => {
      try {
        const res = await axios.post('http://localhost:5000/generate', { prompt });

        const sample = {
          url: res.data.audio,
          prompt: res.data.prompt,
          title: res.data.title,
        };

        localStorage.setItem('sample', JSON.stringify(sample));
        navigate('/sample');
      } catch (err) {
        console.error(err);
        navigate('/generate');
      }
    };

    generateSample();
  }, []);

  return (
    <div className='container'>
      <div className="loading-wrapper">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="background-video"
        >
          <source src={LoadingLoop} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="loader">
          <h1>Loading...</h1>
        </div>
        <div className="txt-loader">
          <p>Turning words into music... just a moment while we create your custom sample.</p>
        </div>
      </div>
    </div>
  );
};

export default Loading;
