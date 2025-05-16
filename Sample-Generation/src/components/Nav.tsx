import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Nav = () => {
    
  const handleMetaballClick = (e: React.MouseEvent) => {
    const sample = sessionStorage.getItem('generatedSampleUrl');
    if (!sample) {
      e.preventDefault();
      toast.error("Generate a sample first to use the Metaball page.");
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
        <li>
          <Link to="/edit-audio" onClick={handleMetaballClick}>Metaball</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Nav;
