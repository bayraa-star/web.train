import { useNavigate } from "react-router-dom";
import { IoMdArrowRoundBack } from "react-icons/io";

const Back = () => {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center hover:cursor-pointer"
      onClick={() => {
        navigate(-1);
      }}
    >
      <IoMdArrowRoundBack size={20} color="#6236F5" />
    </div>
  );
};

export default Back;
