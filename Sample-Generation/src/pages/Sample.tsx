import Nav from '../components/Nav';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Sample = () => {
  const [sampleUrl, setSampleUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const url = sessionStorage.getItem('generatedSampleUrl');
    if (!url) {
      navigate('/generate'); 
    } else {
      setSampleUrl(url);
    }
  }, []);

  return (
    <>
      <Nav />
      <div className='container'>
        <div className='sample'>
          <h1>Here is the generated sample:</h1>
          <div className='sample-audio'>
            {sampleUrl && <audio controls src={sampleUrl} />}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sample;
