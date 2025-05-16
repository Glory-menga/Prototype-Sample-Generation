import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Generate from './pages/Generate';
import Sample from './pages/Sample';
import Loading from './pages/Loading';
import EditAudio from './pages/EditAudio';
import NotFound from './pages/NotFound';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css'

function App() {

  return (
    <Router>
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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="/sample" element={<Sample />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/edit-audio" element={<EditAudio />} />
        {/*Error Page*/}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App;
