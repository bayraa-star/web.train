import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReactPaginate from "react-paginate";
import objectPath from "object-path";

import {
  RiArrowUpLine,
  RiArrowDownLine,
  RiArrowUpDownLine,
} from "react-icons/ri";

import Row from "./row";
import { mainApi } from "../../providers/api";
import { DEBUG } from "../../defines";

import TableFilter from "../TableFilter";
import { Loader } from "../../template";

const LIMITS = [3, 5, 10, 13, 50, 100];

const paginationItemclass =
  "h-10 w-10 flex items-center justify-center m-1 cursor border text-sm rounded";
const thClass = "py-3 px-2 border text-sm font-normal leading-none";
const tdClass = "py-3 px-2 border-b";

const Index = ({
  url,
  find: propsFind,
  sort: propsSort,
  limit: propsLimit = 13,
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
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(propsLimit);
  const [find, setFind] = useState({});
  const [sort, setSort] = useState({});
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
        setItems(response.data.items);
        setTotal(response.data.total);
      }

      setLoading(false);

      //   DEBUG && console.log(url, response.data);
    };

    fetchData({ find, sort, offset, limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, find, sort, offset, limit]);

  useEffect(() => {
    setLimit(propsLimit);
  }, [propsLimit]);

  const renderTableHeader = (
    { key, label, sortable, center, width },
    index
  ) => {
    return (
      <th
        key={index}
        className={`${thClass} bg-def-gray  pointer border-none ${
          width ? width : `w-36 text-center items-center flex `
        } `}
      >
        <div
          className={`flex items-center select-none ${
            sort[key] ? "font-bold underline" : ""
          } ${sortable ? "cursor" : ""} ${center ? "justify-center" : ""}`}
          onClick={() => {
            sortable && sortChange(key);
          }}
        >
          <div className="font-semibold text-black ">{t(label)} </div>
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

  return (
    <div className="relative">
      {loading && <Loader size={50} />}
      {renderHeader && renderHeader({ total })}
      {children && children({ filterChange, sortChange })}
      <div
        className={`w-full overflow-x-auto text-sm bg-white  rounded-2xl shadow border-none ${
          renderItem ? containerClassName : "border-l border-r"
        }`}
        style={{ minHeight: height }}
      >
        {columns.length > 0 ? (
          <table className="min-w-full leading-none text-left">
            <thead>
              <div className="flex">
                <th
                  className={`${thClass} bg-def-gray text-center w-36 border-none text-black `}
                >
                  #
                </th>
                {columns.map(renderTableHeader)}
              </div>
              <div className="flex">
                <td className={`${thClass} bg-white   w-36`}></td>
                {columns.map(({ key, filter, dependents, width }, index) => (
                  <td
                    key={index}
                    className={`border bg-white    ${width ? width : `w-36`}`}
                  >
                    {filter && (
                      <TableFilter
                        filterChange={filterChange}
                        field={key}
                        columns={columns}
                        dependents={dependents}
                        {...filter}
                      />
                    )}
                  </td>
                ))}
              </div>
            </thead>
            <tbody>
              {items.map((row, index) => {
                return (
                  <Row
                    key={index}
                    index={index}
                    data={row}
                    columns={columns}
                    offset={offset}
                    limit={limit}
                    selected={selected}
                    tdClass={tdClass}
                    setSelected={setSelected}
                  />
                );
              })}
            </tbody>
          </table>
        ) : (
          renderItem && items.map((item, index) => renderItem(item, index))
        )}
        {items.length === 0 && (
          <div className="text-center leading-none p-4">{t("list.empty")}</div>
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
            containerClassName="flex flex-wrap justify-center  items-center select-none mx-2"
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
            <div className=" ">
              {`Нийт `}: {total}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Index;
