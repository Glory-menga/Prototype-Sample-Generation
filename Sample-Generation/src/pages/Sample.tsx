import Nav from '../components/Nav';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Sample = () => {
  const [sampleUrl, setSampleUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const sampleRaw = localStorage.getItem('sample');
    if (!sampleRaw) {
      navigate('/generate');
      return;
    }

    try {
      const sample = JSON.parse(sampleRaw);
      if (!sample.url || !sample.title || !sample.prompt) {
        navigate('/generate');
        return;
      }

      setSampleUrl(sample.url);
      setTitle(sample.title);
      setPrompt(sample.prompt);
    } catch (e) {
      console.error('Failed to parse sample from localStorage');
      navigate('/generate');
    }
  }, []);

  const handleClear = () => {
    localStorage.removeItem('sample');
    navigate('/generate');
  };

  return (
    <>
      <Nav />
      <div className='container'>
        <div className='sample'>
          {title && <h1>{title}</h1>}
          {prompt && <p><strong>Prompt:</strong> {prompt}</p>}
          <div className='sample-audio'>
            {sampleUrl && <audio controls src={sampleUrl} />}
          </div>
          <div style={{ marginTop: '20px' }}>
            <button onClick={handleClear}>Generate New Sample</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sample;
