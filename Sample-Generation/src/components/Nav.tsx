import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Nav = () => {
    const navigate = useNavigate();

    const handleMetaballClick = (e: React.MouseEvent) => {
        e.preventDefault();
        
        // Check if sample exists in localStorage
        const sampleRaw = localStorage.getItem('sample');
        
        if (!sampleRaw) {
            toast.error("Please generate a sample first!");
            navigate('/generate');
            return;
        }

        try {
            const sample = JSON.parse(sampleRaw);
            if (!sample.url) {
                toast.error("Invalid sample data. Please generate a new sample.");
                navigate('/generate');
                return;
            }
            // Sample exists, proceed to EditAudio page
            navigate('/edit-audio');
        } catch (e) {
            console.error('Failed to parse sample from localStorage', e);
            toast.error("Error loading sample. Please generate a new one.");
            navigate('/generate');
        }
    };

    return (
        <nav>
            <div className='logo'>
                <Link to="/">Samply</Link>
            </div>
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/generate">Generate</Link></li>
                <li><a href="/edit-audio" onClick={handleMetaballClick}>Metaball</a></li>
            </ul>
        </nav>
    );
};
  
export default Nav;