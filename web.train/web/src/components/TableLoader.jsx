const Loader = ({ size, overlay }) => {
  return (
    <div
      className={`absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center select-none bg-white z-10 ${
        overlay ? "" : "bg-opacity-20"
      }`}
    >
      <img src="../images/loader.svg" width={size} />
    </div>
  );
};
export default Loader;
