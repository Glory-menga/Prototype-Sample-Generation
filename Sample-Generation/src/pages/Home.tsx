import Nav from '../components/Nav';
import { Link } from 'react-router-dom';
import { MdOutlineArrowForwardIos } from "react-icons/md";
import Animation from '../assets/video/Animated.mp4';

const Home = () => {
    return (
        <>
            <Nav />
            <div className='container'>
                <div className='welcome'>
                    <h1>Generate. Create. Inspire.</h1>
                    <div className='info'>
                        <div className='txt-info'>
                            <p>Welcome to Samply, where AI and 3D come together to redefine music creation. Type a prompt like 'dreamy synth with a deep bass,' and let our AI generate a unique sample. Then, bring your sound to life with an interactive 3D visualization, shaping and tweaking it in real-time.</p>
                        </div>
                        <div className='btn-info'><button><Link to="/generate">Generate Sample</Link></button> <MdOutlineArrowForwardIos size={30} /></div>
                    </div>
                </div>
                <video className='showreel' width= '100%' autoPlay loop muted playsInline>
                    <source src={Animation} type="video/mp4" />
                </video>
            </div>
        </>
    );
  };
  
  export default Home;