import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { IoMdArrowBack } from "react-icons/io";
import { API_ROOT } from "../defines";
import objectPath from "object-path";

const Type = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setloading] = useState(false);
  const [list, setlist] = useState(null);
  const { t } = useTranslation();
  useEffect(() => {
    fetch();
  }, []);
  const fetch = async () => {
    try {
      setloading(true);
      const response = await axios({
        url: `/seal/table`,
        method: `POST`,
        data: {
          find: {
            type: id,
          },
        },
      });
      console.log("🚀 ~ fetch ~ response:", response.data);
      setlist(response?.data?.item);
      setloading(false);
    } catch (err) {
      setloading(false);
    }
  };

  return (
    <div className="flex w-full justify-center h-screen">
      <div className="w-10/12 flex flex-col justify-start items-start">
        <div className="flex flex-col w-full">
          <div className="flex flex-row justify-start items-start w-full">
            <div
              onClick={() => {
                navigate(-1);
              }}
              className="flex bg-back px-3 py-2 rounded-2xl justify-center items-center hover:cursor-pointer"
            >
              <IoMdArrowBack color="#F97316" size={15} />
              <div className=" text-button text-base mx-2">
                {t("action.back")}
              </div>
            </div>
            <div className="flex bg-button px-3 py-2 rounded-2xl justify-center items-center mx-3">
              <div className=" text-white text-base mx-2">{id}</div>
            </div>
          </div>
          <div className="flex flex-wrap">
            {list?.map((row, index) => {
              const photo = `${API_ROOT}/${objectPath.get(row, "photo.0.id")}`;
              const name = objectPath.get(row, "name");
              const _id = objectPath.get(row, "_id");
              return (
                <div className="w-1/5 p-3" key={index}>
                  <Link
                    to={`/seal/detail/${_id}`}
                    className="flex w-full flex-col bg-white rounded-2xl shadow p-2.5 hover:cursor-pointer hover:bg-active"
                  >
                    <img
                      src={photo}
                      style={{ height: 120, width: "100%", resize: "contain" }}
                      crossOrigin="anonymous"
                    />
                    <div className="text-center text-sm font-medium mt-2">
                      {name}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Type;
