import { Link } from 'react-router-dom';


const Nav = () => {
    return (
        <nav>
        <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/generate">Generate</Link></li>
            <li><Link to="/sample">Sample</Link></li>
        </ul>
        </nav>
    );
  };
  
  export default Nav;