import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import Sphere from "../components/Sphere";
import { useNavigate } from "react-router-dom";
import Audio from '../assets/audio/test-audio.mp3';

const EditAudio = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="container">
        <div className="edit-audio-wrapper">
          <div className="go-back">
            <button onClick={() => navigate(-1)}>Go Back</button>
          </div>

          <div className="canvas-wrapper" style={{ width: "100%", height: "100vh" }}>
            <Canvas camera={{ position: [0, 0, 3], fov: 60 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <Environment preset="studio" />
              <Sphere />
              <OrbitControls />
            </Canvas>
          </div>
          <div className="test-sound">
            <audio controls>
                <source src={Audio} type="audio/mp3" />
            </audio>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditAudio;
