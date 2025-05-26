import React from "react";
import { API_ROOT } from "../../defines";
import objectPath from "object-path";
import { useState, useEffect } from "react";
import { MapInteractionCSS } from "react-map-interaction";

const Media = ({ data }) => {
  const [current, setcurrent] = useState();

  useEffect(() => {
    // console.log("🚀 ~ Media ~ data:", data[0]);
    setcurrent(objectPath.get(data, "0"));
  }, [data]);

  return (
    <div className="flex w-full flex-col min-h-96">
      <div className="flex h-72 w-full justify-center items-center">
        {current?.type === "image" ? (
          <div className="flex w-full">
            <MapInteractionCSS
              showControls={true}
              controlsClass="bg-black absolute top-0 right-2"
              defaultValue={{
                scale: 1,
                translation: { x: 0, y: 20 },
              }}
              minScale={0.5}
              maxScale={3}
              translationBounds={{
                xMax: 400,
                yMax: 200,
              }}
            >
              <img
                src={API_ROOT + "/" + current?.id}
                crossOrigin="anonymous"
                alt="Зураг"
                className="h-72 object-contain justify-center items-center"
              />
            </MapInteractionCSS>
          </div>
        ) : (
          current?.type === "video" && (
            <video
              className="h-72 w-full"
              controls
              crossOrigin="anonymous"
              autoPlay
            >
              <source src={API_ROOT + "/" + current?.id} type="video/mp4" />
            </video>
          )
        )}
      </div>
      <div className="flex w-full overflow-auto mt-4 h-20 p-2">
        {data?.map((row, index) => {
          const id = objectPath.get(row, "id");
          const type = objectPath.get(row, "type");
          return (
            <img
              key={index}
              onClick={() => setcurrent(row)}
              crossOrigin="anonymous"
              src={type === "image" ? `${API_ROOT}/${id}` : "/images/video.png"}
              className="object-cover w-16 h-16 mx-2 hover:cursor-pointer"
            />
          );
        })}
      </div>
    </div>
  );
};

export default Media;
