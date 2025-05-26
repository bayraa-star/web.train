import { useParams } from "react-router-dom";
import { mainApi } from "../providers/api";
import { useState, useEffect } from "react";
import Loader from "../components/Loader";
import Text from "../components/comp/Text";
import objectPath from "object-path";
import { Back } from "../template";

const Detail = () => {
  const { id } = useParams();
  const [loading, setloading] = useState(false);
  const [data, setdata] = useState();
  useEffect(() => {
    fetch();
  }, []);
  const fetch = async () => {
    setloading(true);
    const response = await mainApi({
      url: `/log/view/${id}`,
      method: `GET`,
    });
    console.log("response", response.data);
    setdata(response?.data);
    setloading(false);
  };
  return (
    <div className="flex flex-col p-4">
      <div className="flex items-center mb-4">
        <div>{<Back />}</div>
        <div className="text-base ml-2 font-semibold">{`Үйлдлийн түүх дэлгэрэнгүй`}</div>
      </div>
      {loading ? (
        <div className="flex h-screen w-full justify-center items-center">
          <Loader size={50} />
        </div>
      ) : (
        <div className="flex flex-wrap p-4 bg-white  rounded shadow w-full">
          <div className="flex flex-col w-full md:w-1/2 p-2">
            <Text label={"Үйлдэл"} value={objectPath.get(data, "info")} />
            <Text label={"URL"} value={objectPath.get(data, "originalUrl")} />
            <Text label={"Method"} value={objectPath.get(data, "method")} />
            <Text label={"Params"} value={objectPath.get(data, "params")} />
            <Text label={"Query"} value={objectPath.get(data, "query")} />
          </div>
          <div className="flex flex-col w-full md:w-1/2 p-2">
            <Text label={"IP"} value={objectPath.get(data, "ip")} />
            <Text label={"Төрөл"} value={objectPath.get(data, "type")} />
            <Text label={"Модел"} value={objectPath.get(data, "model")} />
            <Text
              area={true}
              label={"Body"}
              value={objectPath.get(data, "body")}
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default Detail;
