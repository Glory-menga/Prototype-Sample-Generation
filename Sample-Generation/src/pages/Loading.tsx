import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import LoadingLoop from '../assets/video/Loading-loop.mp4'

const Loading = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (!prompt) {
      navigate('/generate');
      return;
    }

    const generateSample = async () => {
      try {
        const res = await axios.post('http://localhost:5000/generate', { prompt });
        sessionStorage.setItem('generatedSampleUrl', res.data.audio);
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
