import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReactPaginate from "react-paginate";
import objectPath from "object-path";
import Loader from "../components/TableLoader";
import {
  RiArrowUpLine,
  RiArrowDownLine,
  RiArrowUpDownLine,
} from "react-icons/ri";
import { mainApi } from "../providers/api";
import TableFilterCustom from "./TableFilterCustom";
import { DEBUG } from "../defines";

const LIMITS = [3, 5, 10, 20, 50, 100];

const paginationItemclass =
  "h-10 w-10 flex items-center justify-center m-1 cursor border text-sm rounded";
const thClass = "text-sm font-normal leading-none";
const tdClass = "py-3 px-2 border-b";

const Table = ({
  url,
  find: propsFind,
  sort: propsSort,
  limit: propsLimit = 5,
  defaultFind,
  children,
  columns: propsColumns = [],
  paginationHide,
  totalHide,
  renderItem,
  renderHeader,
  renderFooter,
  singleSort,
  height = 600,
  containerClassName,
  showfilter,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(propsLimit);
  const [find, setFind] = useState({});
  const [sort, setSort] = useState({ no: 1, price: 1 });
  const [selected, setSelected] = useState();
  const columns = propsColumns.filter((c) => c);

  useEffect(() => {
    const fetchData = async ({ find, sort, offset, limit }) => {
      setLoading(true);

      const data = {
        find: { ...find, ...propsFind, ...defaultFind },
        sort: { ...sort, ...propsSort },
        offset,
        limit: limit || propsLimit,
      };

      const response = await mainApi({
        url,
        method: "POST",
        data,
      });

      if (response) {
        setItems(response.data.item);
        setTotal(response.data.total);
      }

      setLoading(false);
    };

    fetchData({ find, sort, offset, limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, find, sort, offset, limit]);

  useEffect(() => {
    setLimit(propsLimit);
  }, [propsLimit]);

  const renderTableHeader = ({ key, label, sortable, center }, index) => {
    return (
      <th key={index} className={`${thClass} bg-def-gray pointer`}>
        <div
          className={`flex items-center select-none ${
            sort[key] ? "font-bold underline" : ""
          } ${sortable ? "cursor" : ""} ${center ? "justify-center" : ""}`}
          onClick={() => {
            sortable && sortChange(key);
          }}
        >
          <div className="">{t(label)} </div>
          <div>
            {sortable &&
              (sort[key] ? (
                sort[key] === 1 ? (
                  <RiArrowUpLine className="ml-1"></RiArrowUpLine>
                ) : (
                  <RiArrowDownLine className="ml-1"></RiArrowDownLine>
                )
              ) : (
                <RiArrowUpDownLine className="ml-1"></RiArrowUpDownLine>
              ))}
          </div>
        </div>
      </th>
    );
  };

  const filterChange = (key, value) => {
    let tmp = { ...find };

    if (value) {
      tmp[key] = value;
    } else {
      delete tmp[key];
    }

    setFind(tmp);
    setOffset(0);
  };

  const sortChange = (key) => {
    let tmp = { ...sort };

    if (singleSort) {
      if (tmp[key]) {
        if (tmp[key] === 1) {
          tmp[key] = -1;
        } else if (tmp[key] === -1) {
          tmp = {};
        }
      } else {
        tmp = { [key]: 1 };
      }
    } else {
      if (tmp[key] === 1) {
        tmp[key] = -1;
      } else if (tmp[key] === -1) {
        delete tmp[key];
      } else tmp[key] = 1;
    }

    setSort(tmp);
  };
  const customCol = [
    {
      key: "mark",
      label: t("button.mark"),
      filter: "text",
    },
    {
      key: "model",
      label: t("button.model"),
      filter: "text",
    },
    {
      key: "color",
      label: t("button.color"),
      filter: "text",
    },
    {
      key: "year",
      label: t("button.year"),
      filter: "text",
    },
    {
      key: "damage",
      label: t("button.damage"),
      filter: "text",
    },
  ];

  return (
    <div className="flex flex-row">
      {showfilter && (
        <div className="flex flex-col  bg-white mr-4">
          <div className="bg-secondary-100 text-white font-medium p-2">
            {t("button.search")}
          </div>

          <div className="flex flex-col p-4">
            {customCol?.map(
              ({ key, filter, label, dependents, width = 170 }, index) => (
                <td
                  key={index}
                  className={` bg-white`}
                  style={{ minWidth: width }}
                >
                  {filter && (
                    <TableFilterCustom
                      filterChange={filterChange}
                      field={key}
                      label={label}
                      columns={columns}
                      dependents={dependents}
                      {...filter}
                    />
                  )}
                </td>
              )
            )}
          </div>
        </div>
      )}
      <div className="relative">
        {loading && <Loader size={50} />}

        {children && children({ filterChange, sortChange })}
        <div
          className={`w-full overflow-x-auto text-sm bg-white  shadow rounded-2xl border-none ${
            renderItem ? containerClassName : "border-l border-r"
          }`}
          style={{ minHeight: height }}
        >
          {columns.length > 0 ? (
            <table className="min-w-full leading-none text-left">
              <thead className="bg-odt-primary text-white">
                <tr>
                  <th
                    className={`${thClass} bg-def-gray text-center border-none `}
                  >
                    #
                  </th>
                  {columns.map(renderTableHeader)}
                </tr>
                <tr>
                  <td className={`${thClass} bg-white `}></td>
                  {columns.map(
                    ({ key, filter, dependents, width = 170 }, index) => (
                      <td
                        key={index}
                        className={`border bg-white`}
                        style={{ minWidth: width }}
                      ></td>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`border bg-white`}
                    onClick={() => {
                      setSelected(selected === row._id ? null : row._id);
                    }}
                  >
                    <td className={`${tdClass} px-4 text-center text-black `}>
                      {offset * limit + rowIndex + 1}
                    </td>
                    {columns.map(({ key, render, center }, columnIndex) => (
                      <td
                        key={columnIndex}
                        className={`text-black   ${tdClass} ${
                          center ? "text-center" : ""
                        }`}
                      >
                        {render ? render(row) : objectPath.get(row, key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            renderItem && items.map((item, index) => renderItem(item, index))
          )}
          {items.length === 0 && (
            <div className="text-center leading-none p-4">{t("noresult")}</div>
          )}
        </div>
        {renderFooter && renderFooter()}
        {!paginationHide && (
          <div className="flex flex-wrap justify-center items-center mt-5 text-sm">
            <div className="flex items-center">
              {t("list.limit")}:
              <select
                className="text-center h-10 ml-1 cursor"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              >
                {LIMITS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <ReactPaginate
              onPageChange={(e) => setOffset(e.selected)}
              pageCount={Math.ceil(total / limit)}
              containerClassName="flex flex-wrap justify-center items-center select-none mx-2"
              nextLabel=">"
              previousLabel="<"
              nextLinkClassName={paginationItemclass}
              previousLinkClassName={paginationItemclass}
              pageLinkClassName={paginationItemclass}
              breakLinkClassName={paginationItemclass}
              activeLinkClassName="bg-secondary-100 text-white"
              disabledClassName="cursor-not-allowed"
            />
            {!totalHide && (
              <div>
                {t("list.total")}: {total}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Table;
