import React, { useState } from "react";
import FileUpload from "../../inputs/FileUploadCustom";
const Root = ({ root }) => {
  const [image, setimage] = useState([]);
  return (
    <div className="w-96 flex flex-col mx-4">
      <div>{root}</div>
      <div className="flex bg-gray-400 shadow border p-4">
        <FileUpload value={image} root={root} onChange={setimage} />
      </div>
    </div>
  );
};

export default Root;
