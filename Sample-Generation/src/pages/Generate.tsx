import Nav from '../components/Nav';
import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { MdOutlineArrowForwardIos } from "react-icons/md";
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Generate = () => {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() === '') {
      toast.error('Please enter a prompt');
      return;
    }

    try {
      toast.info('Generating sample...');
      const res = await axios.post('http://localhost:5000/generate', { prompt });

      // Save sample URL in localStorage
      sessionStorage.setItem('generatedSampleUrl', res.data.audio);

      toast.success('Sample generated!');
      navigate('/sample');
    } catch (err) {
      toast.error('Error generating sample');
      console.error(err);
    }
  };

  return (
    <>
      <Nav />
      <div className='container'>
        <div className='txt-generation'>
          <h1>Generate a Sample</h1>
          <p>Enter a prompt describing the type of melody you want, including mood, style, and tempo.</p>
        </div>
        <form className='input' onSubmit={handleSubmit}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type something like 'dreamy piano melody with a slow tempo' or 'funky guitar riff with high energy'. "
            className="prompt-input"
          />
          <div className='btn'>
            <button type="submit">Generate <MdOutlineArrowForwardIos size={30} /></button>
          </div>
        </form>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastClassName="custom-toast"
          progressClassName="custom-progress"
        />
      </div>
    </>
  );
};

export default Generate;
