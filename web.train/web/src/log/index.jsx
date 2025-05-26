import { IoMdPersonAdd } from "react-icons/io";
import { Link } from "react-router-dom";
import Table from "../list/Table";
import moment from "moment";
import { DATE_FORMAT } from "../defines";
import objectPath from "object-path";

const index = () => {
  return (
    <div className="flex flex-col ">
      <div className="flex items-center justify-between w-full h-20 py-3 px-8">
        <div className="text-xl font-semibold leading-5 text-black ">
          Үйлдлийн түүх
        </div>
      </div>
      <div className="px-4">
        <Table
          url={`/log/table`}
          sort={{ _id: -1 }}
          columns={[
            {
              label: `Үйлдлийн түүх`,
              sort: true,
              filter: {
                type: "text",
              },
              render: ({ _id, info }) => {
                return (
                  <Link to={`view/${_id}`}>
                    <div className="text-odt-primary underline font-bold">
                      {info}
                    </div>
                  </Link>
                );
              },
            },
            {
              label: `Огноо`,
              sort: true,
              key: "created",
              filter: {
                type: "date",
              },
              render: ({ _id, created }) => {
                return (
                  // <Link to={`view/${_id}`}>
                  <div className="">{moment(created).format(DATE_FORMAT)}</div>
                  // </Link>
                );
              },
            },
            {
              label: `URL`,
              key: `originalUrl`,
              sort: true,
              filter: {
                type: "text",
              },
            },
            {
              label: `Method`,
              key: `method`,
              sort: true,
              filter: {
                type: "select",
                items: [
                  {
                    label: "POST",
                    value: "POST",
                  },
                  {
                    label: "GET",
                    value: "GET",
                  },
                  {
                    label: "PUT",
                    value: "PUT",
                  },
                  {
                    label: "DELETE",
                    value: "DELETE",
                  },
                ],
              },
            },
            {
              label: `IP`,
              key: `ip`,
              sort: true,
              filter: {
                type: "text",
              },
            },
            {
              label: `Хэрэглэгч`,
              key: `createdby`,
              sort: true,
              filter: {
                type: "text",
              },
              render: ({ createdby }) => {
                return (
                  <div className="">
                    {objectPath.get(createdby, "username")}
                  </div>
                );
              },
            },
          ]}
        />
      </div>
    </div>
  );
};

export default index;
