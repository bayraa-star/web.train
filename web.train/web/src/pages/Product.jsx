import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { PiSlidersLight } from "react-icons/pi";
import axios from "axios";
import { useState, useEffect } from "react";
import objectPath from "object-path";
import { API_ROOT } from "../defines";
import { FaArrowRight } from "react-icons/fa6";

const Product = () => {
  const navigate = useNavigate();
  const [loading, setloading] = useState(false);
  const [list, setlist] = useState([]);
  const [loadingType, setloadingType] = useState(false);
  const [type, settype] = useState();
  const [loadingPur, setloadingPur] = useState(false);
  const [purpose, setpurpose] = useState();
  const [filterType, setfilterType] = useState([]);
  const [filterPurp, setfilterPurp] = useState([]);
  const fetchType = async () => {
    try {
      setloadingType(true);
      const response = await axios({
        url: `/info/table`,
        method: `POST`,
      });
      settype(response?.data?.item);

      setloadingType(false);
    } catch (err) {
      console.log("🚀 ~ fetchType ~ err:", err);
      setloadingType(false);
    }
  };
  const fetchPurpose = async () => {
    try {
      setloadingPur(true);
      const response = await axios({
        url: `/consts/Зориулалт`,
        method: `GET`,
      });
      setpurpose(response?.data);
      setloadingPur(false);
    } catch (err) {
      console.log("🚀 ~ fetchType ~ err:", err);
      setloadingPur(false);
    }
  };
  useEffect(() => {
    fetchType();
    fetchPurpose();
  }, []);
  useEffect(() => {
    fetch();
  }, [filterType, filterPurp]);

  const addType = (val) => {
    console.log(
      "filterType.find((row) => row === val)",
      filterType.find((row) => row === val)
    );

    if (filterType.find((row) => row === val) == undefined) {
      setfilterType([...filterType, val]);
    } else {
      const temp = remove(filterType, val);
      setfilterType(temp);
    }
  };

  const addPurpose = (val) => {
    const list = filterPurp.filter((row) => row === val);
    if (list.length == 0) {
      setfilterPurp([...filterType, val]);
    } else {
      const temp = remove(filterType, val);
      setfilterPurp(temp);
    }
  };
  const remove = (arr, val) => {
    return arr.filter(function (ele) {
      return ele != val;
    });
  };
  const fetch = async () => {
    try {
      console.log("🚀 ~ Product ~ filterType:", filterType);
      setloading(true);
      const response = await axios({
        url: `/seal/table`,
        method: `POST`,
        data: {
          find: {
            // tag: {
            //   $in: filterPurp,
            // },
            // type: {
            //   $in: filterType,
            // },
          },
        },
      });
      console.log("🚀 ~ fetch ~ response:", response.data);
      setlist(response.data.item);
      setloading(false);
    } catch (err) {
      console.log("🚀 ~ fetch ~ err:", err);
      setloading(false);
    }
  };

  return (
    <div className="flex flex-row w-full mt-2">
      <div className="flex w-80 p-1">
        <div className="flex flex-col bg-white p-4 w-full rounded">
          <div className="my-2 border-b pb-3">
            <div className="flex items-center">
              <PiSlidersLight size={20} />
              <div className="pl-2">Шүүлтүүр</div>
            </div>
          </div>
          <div className="flex flex-col mt-2">
            <div className="font-semibold">Төрөл</div>
            {loadingType ? (
              <div className="flex justify-center items-center">
                <img
                  src="https://www.icegif.com/wp-content/uploads/2023/07/icegif-1263.gif"
                  style={{ height: 80, width: 80, objectFit: "cover" }}
                />
              </div>
            ) : (
              <div className="flex flex-col">
                {type?.map((row, index) => {
                  const name = objectPath.get(row, "type");
                  return (
                    <div onClick={() => addType(name)}>
                      <label
                        key={index}
                        className="flex p-1 ml-2 hover:cursor-pointer items-center"
                      >
                        <input
                          type="checkbox"
                          id={name}
                          name={name}
                          value={name}
                        />
                        {name}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex flex-col mt-2">
            <div className="font-semibold">Зориулалт</div>
            {loadingPur ? (
              <div className="flex justify-center items-center">
                <img
                  src="https://www.icegif.com/wp-content/uploads/2023/07/icegif-1263.gif"
                  style={{ height: 80, width: 80, objectFit: "cover" }}
                />
              </div>
            ) : (
              <div className="flex flex-col">
                {purpose?.map((row, index) => {
                  const name = objectPath.get(row, "name");
                  return (
                    <div
                      className="flex p-1 ml-2 hover:cursor-pointer items-center"
                      onClick={() => {
                        addPurpose(name);
                      }}
                    >
                      <input
                        type="checkbox"
                        id={name}
                        name={name}
                        value={name}
                      />
                      <label className="-ml-1 font-normal" for={name}>
                        {name}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex w-full p-1">
        <div className="flex flex-wrap w-full ">
          {loading ? (
            <div></div>
          ) : (
            list?.map((row, index) => {
              const type = objectPath.get(row, "type");
              const _id = objectPath.get(row, "_id");
              const name = objectPath.get(row, "name");
              const IMAGE = API_ROOT + "/" + objectPath.get(row, "photo.1.id");
              return (
                <div className="px-2 w-56 h-56 flex" key={index}>
                  <div className="flex flex-col w-full h-full bg-white shadow">
                    <div className="flex bg-white border-b p-2 justify-center items-center relative">
                      <img
                        crossOrigin="anonymous"
                        src={IMAGE}
                        className="h-40 object-fill rounded"
                      />
                    </div>
                    <div className="flex bg-white p-4 justify-between items-center">
                      <div className="font-semibold text-sm text-menutext">
                        {name}
                      </div>
                      <FaArrowRight
                        className="hover:cursor-pointer"
                        color="#545252"
                        size={12}
                        onClick={() => {
                          navigate(`/seal/detail/${_id}`);
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Product;
