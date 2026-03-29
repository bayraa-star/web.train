const Root = ({ root }) => {
  return (
    <div className="w-56 flex flex-col mx-4 p-4 bg-white shadow border rounded">
      <div className="font-medium text-base">{root?.root}</div>
      <div className="text-sm text-gray-500 mt-2">
        {root?.description || "No description"}
      </div>
    </div>
  );
};

export default Root;
