import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import objectPath from "object-path";
import { API_ROOT } from "../../defines";
import AliceCarousel from "react-alice-carousel";
import "react-alice-carousel/lib/alice-carousel.css";

const Special = () => {
  const { t } = useTranslation();
  const [list, setlist] = useState();
  const [loading, setloading] = useState(false);
  useEffect(() => {
    fetch();
  }, []);
  const fetch = async () => {
    try {
      setloading(true);
      const response = await axios({
        url: `/info/table`,
        method: `POST`,
      });
      console.log("🚀 ~ fetch ~ response:", response.data.item);
      // setlist(response?.data?.item);
      const temp = [];
      response?.data?.item?.map((row, index) => {
        const photo = objectPath.get(row, "photo.0.id");
        const type = objectPath.get(row, "type");
        temp.push(
          <Link className="mx-4" key={index}>
            <img
              crossOrigin="anonymous"
              src={`${API_ROOT}/${photo}`}
              style={{ height: 180, width: 200 }}
              autoPlayInterval={0}
              animationDuration={700}
            />
            <div className="text-center text-sm font-medium">{type}</div>
          </Link>
        );
      });
      setlist(temp);
      setloading(false);
    } catch (err) {
      setloading(false);
    }
  };
  return (
    <div className="flex w-full justify-center">
      <div className="w-10/12 flex flex-col justify-center items-center">
        <div className="my-6 text-xl leading-7 font-semibold">
          {t("home.special")}
        </div>

        <div className="flex w-full">
          {list && (
            <AliceCarousel
              autoPlay={true}
              responsive={{
                0: {
                  items: 1,
                },
                1024: {
                  items: 6,
                  itemsFit: "contain",
                },
              }}
              keyboardNavigation={false}
              mouseTracking
              items={list}
              disableButtonsControls={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};
export default Special;
