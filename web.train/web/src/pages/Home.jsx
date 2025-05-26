import React, { useState, useEffect } from "react";
import { IoMdAdd } from "react-icons/io";
import { mainApi } from "../providers/api";
import Loader from "./Loader";
import Swal from "sweetalert2";
import objectPath from "object-path";
import FileUpload from "../inputs/FileUploadCustom";
import Root from "./components/Root";
const Home = () => {
  const [loading, setloading] = useState(false);
  const [reset, setreset] = useState(false);
  const [roots, setroots] = useState();

  useEffect(() => {
    const fetch = async () => {
      setloading(true);
      const result = await mainApi({
        url: `/root/table`,
        method: "POST",
        data: {
          limit: 100,
        },
      });
      setroots(objectPath.get(result, "data.items"));
      setloading(false);
    };
    fetch();
  }, [reset]);

  return (
    <div className="flex flex-col p-8 w-full">
      <div className="flex flex-col">
        <div className="flex w-full justify-between items-center">
          <div className="font-medium">root</div>
          <div
            onClick={async () => {
              Swal.fire({
                title: "Шинэ root оруулах",
                input: "text",
                inputAttributes: {
                  autocapitalize: "off",
                },
                showCancelButton: true,
                confirmButtonText: "Хадгалах",
                showLoaderOnConfirm: true,
                preConfirm: async (val) => {
                  try {
                    const result = await mainApi({
                      url: `/root`,
                      method: "POST",
                      data: {
                        root: val,
                      },
                    });
                    console.log("🚀 ~ preConfirm: ~ result:", result);
                    setreset((prev) => !prev);
                  } catch (error) {
                    Swal.showValidationMessage(`
                      Request failed: ${error}
                    `);
                  }
                },
                allowOutsideClick: () => !Swal.isLoading(),
              }).then((result) => {
                if (result.isConfirmed) {
                  Swal.fire({
                    title: `Амжилттай хадгалагдлаа`,
                  });
                }
              });
            }}
            className="hover:cursor-pointer hover:text-white hover:bg-black border p-1 border-black rounded"
          >
            <IoMdAdd />
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex w-full h-96 justify-center items-center">
          <Loader />
        </div>
      ) : (
        <div className="flex overflow-auto p-4">
          {roots?.map((r, index) => {
            const root = objectPath.get(r, "root");
            return <Root root={root} />;
          })}
        </div>
      )}
    </div>
  );
};

export default Home;
