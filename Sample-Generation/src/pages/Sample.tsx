import Nav from '../components/Nav';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Sample = () => {
  const [sampleUrl, setSampleUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const url = localStorage.getItem('generatedSampleUrl');
    const title = localStorage.getItem('generatedTitle');
    const prompt = localStorage.getItem('generatedPrompt');

    if (!url || !title || !prompt) {
      navigate('/generate');
    } else {
      setSampleUrl(url);
      setTitle(title);
      setPrompt(prompt);
    }
  }, []);

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
        </div>
      </div>
    </>
  );
};

export default Sample;