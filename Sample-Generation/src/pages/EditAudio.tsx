import Metaball from "../components/Metaball";
import { useNavigate } from "react-router-dom";


const EditAudio = () => {

    const navigate = useNavigate();

    return (
        <>
            <div className='container'>
                <div className="edit-audio-wrapper">
                    <div className='go-back'>
                        <button onClick={() => navigate(-1)}>Go Back</button>
                    </div>
                    <Metaball />
                </div>
            </div>
        </>
    );
  };
  
  export default EditAudio;