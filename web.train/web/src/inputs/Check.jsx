import { useState } from "react";
const Checkbox = ({ _id }) => {
  const [id, setid] = useState(null);
  return (
    <div className="flex">
      <label>
        <input type="checkbox" />
        My Value
      </label>
    </div>
  );
};
export default Checkbox;
