import { ImSpinner2 } from "react-icons/im";

const Loader = ({ overlay }) => {
  return (
    <div
      className={`absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center select-none bg-white z-10 ${
        overlay ? "" : "bg-opacity-20"
      }`}
    >
      <ImSpinner2 className="animate-spin text-odt-primary text-4xl"></ImSpinner2>
    </div>
  );
};

export default Loader;
