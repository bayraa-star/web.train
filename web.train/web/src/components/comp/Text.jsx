const Text = ({ label, value, area, className }) => {
  return (
    <div className="flex flex-col w-full mt-2">
      <label className={"select-none text-md text-gray-500  "}>{label}</label>
      {area ? (
        <textarea rows={5} className="w-full" value={value} disabled={true} />
      ) : (
        <input
          className={`w-full p-3 px-4 rounded-lg text-black  ${className}`}
          value={value}
          disabled={true}
        />
      )}
    </div>
  );
};
export default Text;
