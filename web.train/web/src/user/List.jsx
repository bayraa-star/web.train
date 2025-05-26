import React from "react";
import Table from "../list/Table";
import { Link } from "react-router-dom";
import { IoMdPersonAdd } from "react-icons/io";
import { useTranslation } from "react-i18next";
import objectPath from "object-path";
import { API_ROOT } from "../defines";
const Permission = [
  {
    label: `Админ`,
    value: `admin`,
  },
  {
    label: `Цагдаа`,
    value: `police`,
  },

  {
    label: `Цагдаа админ`,
    value: `police_admin`,
  },
  {
    label: `Статистик`,
    value: `statistic`,
  },
];
const List = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col ">
      <div className="flex items-center justify-between w-full h-20 py-3 px-8">
        <div className="text-xl font-semibold leading-5 text-black ">
          Хэрэглэгчид
        </div>
        <Link
          to={`new`}
          className="p-2 border-2 rounded hover:cursor-pointer border-odt-primary"
        >
          <IoMdPersonAdd color="#6236F5" />
        </Link>
      </div>
      <div className="px-4">
        <Table
          url={`/user/table`}
          sort={{ _id: -1 }}
          columns={[
            {
              label: `Зураг`,
              key: `profile`,
              sort: true,
              filter: {
                type: "text",
              },
              render: ({ profile }) => {
                const image = API_ROOT + "/" + objectPath.get(profile, "0.id");

                return (
                  <div className="flex justify-center items-center">
                    <img
                      src={image}
                      className="h-16 w-16 rounded-full"
                      crossOrigin="anonymous"
                    />
                  </div>
                );
              },
            },
            {
              label: `Хэрэглэгчийн нэр`,
              key: `username`,
              sort: true,
              filter: {
                type: "text",
              },
              render: ({ _id, username }) => {
                return (
                  <Link to={`view/${_id}`}>
                    <div className="text-odt-primary underline font-semibold">
                      {username}
                    </div>
                  </Link>
                );
              },
            },
            {
              label: `Системийн эрх`,
              key: `role`,
              sort: true,
              filter: {
                type: "select",
                items: Permission,
              },
              render: ({ role }) => {
                const temp = Permission.filter((row) => row.value == role);
                return <div>{temp[0]?.label}</div>;
              },
            },
            {
              label: `Цэс`,
              sort: true,
              render: ({ permissions }) => {
                return (
                  <div className="flex flex-wrap">
                    {permissions?.map((row) => {
                      return (
                        <div className="p-1 px-2 text-white bg-odt-primary rounded m-1">
                          {row}
                        </div>
                      );
                    })}
                  </div>
                );
              },
            },
            {
              label: `Апп`,
              sort: true,
              render: ({ app }) => {
                return (
                  <div className="flex flex-wrap">
                    {app?.map((row) => {
                      return (
                        <div className="p-1 px-2 text-white bg-odt-primary rounded m-1">
                          {row}
                        </div>
                      );
                    })}
                  </div>
                );
              },
            },
            {
              label: `Эцэг/эх/-ийн нэр`,
              key: `lastname`,
              sort: true,
              filter: {
                type: "text",
              },
            },
            {
              label: `Нэр`,
              key: `firstname`,
              sort: true,
              filter: {
                type: "text",
              },
            },
            {
              label: `Газар, хэлтэс`,
              key: `department`,
              sort: true,
              filter: {
                type: "text",
              },
            },
            {
              label: `Цол`,
              key: `rank`,
              sort: true,
              filter: {
                type: "select",
                items: [
                  {
                    label: `х/а`,
                    value: `хурандаа`,
                  },
                  {
                    label: `д/х`,
                    value: `дэд хурандаа`,
                  },
                  {
                    label: `х/ч`,
                    value: `хошууч`,
                  },
                  {
                    label: `х/ч`,
                    value: `ахмад`,
                  },
                  {
                    label: `а/х`,
                    value: `ахлах дэслэгч`,
                  },
                  {
                    label: `д/ч`,
                    value: `дэслэгч`,
                  },
                  {
                    label: `а/а`,
                    value: `ахлах ахлагч`,
                  },
                  {
                    label: `/а`,
                    value: `ахлагч`,
                  },
                  {
                    label: `д/а`,
                    value: `дэд ахлагч`,
                  },
                ],
              },
            },
            {
              label: `Албан тушаал`,
              key: `position`,
              sort: true,
              filter: {
                type: "text",
              },
            },
            {
              label: `Утас`,
              key: `phone`,
              sort: true,
              filter: {
                type: "text",
              },
            },
          ]}
        />
      </div>
    </div>
  );
};

export default List;
