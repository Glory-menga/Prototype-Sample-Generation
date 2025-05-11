import { Link } from 'react-router-dom';


const Nav = () => {
    return (
        <nav>
            <div className='logo'>
                <Link to="/">Samply</Link>
            </div>
        <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/generate">Generate</Link></li>
            <li><Link to="/edit-audio">Metaball</Link></li>
        </ul>
        </nav>
    );
  };
  
  export default Nav;