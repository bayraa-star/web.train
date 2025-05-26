import moment from "moment";
import objectPath from "object-path";
import { useState } from "react";
import { FaPlus, FaMinus } from "react-icons/fa6";

const checkTax = (val) => {
  const current = val?.filter((row) => row.year == moment().year().toString());
  console.log("🚀 ~ checkTax ~ current:", current);
  const air = objectPath.get(current, "0.airPollAmount");
  const tax = objectPath.get(current, "0.taxAmount");
  const trafic = objectPath.get(current, "0.trafficAmount");
  const year = objectPath.get(current, "0.year");
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="flex">
        {year && <div className="font-bold">{`${year}`}</div>}
        <div
          className={`font-bold pl-2 ${
            year ? "text-green-500" : "text-red-500"
          }`}
        >{`${year ? "Төлсөн" : "Төлөөгүй"}`}</div>
      </div>
      {year && (
        <div className="flex justify-center items-center flex-col">
          <div className="flex">
            <div>АЗАТөлбөр :</div>
            <div className="flex pl-1">
              <div className="font-bold">{`${trafic}₮`}</div>
            </div>
          </div>
          <div className="flex">
            <div>АБТөлбөр :</div>
            <div className="flex pl-1">
              <div className="font-bold">{`${air}₮`}</div>
            </div>
          </div>
          <div className="flex">
            <div>АТБӨЯХТатвар :</div>
            <div className="flex pl-1">
              <div className="font-bold">{`${tax}₮`}</div>
            </div>
          </div>
          <div className="flex">
            <div>Нийт :</div>
            <div className="flex pl-1">
              <div className="font-bold">{`${
                parseInt(tax) + parseInt(trafic) + parseInt(air)
              }₮`}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const checkPenalty = (val) => {
  let notPaidAmount = 0;
  let PaidAmount = 0;
  let total = 0;
  let paid = 0;
  let notPaid = 0;
  val?.map((row) => {
    total = total + 1;
    if (row.paid == true) {
      PaidAmount = PaidAmount + row.amount;
      paid++;
    }
    if (row.paid == false) {
      notPaid++;
      notPaidAmount = notPaidAmount + row.amount;
    }
  });
  return (
    <div className="flex justify-center items-center flex-col">
      <div className="flex">
        <div>Нийт : </div>
        <div className="pl-1 font-bold">{total}</div>
      </div>
      <div className="flex">
        <div>Төлсөн :</div>
        <div className="flex pl-1">
          <div className="font-bold">{paid}</div>
          <div className="pl-2 text-green-500 font-semibold">{`/ ${PaidAmount}₮ /`}</div>
        </div>
      </div>
      <div className="flex">
        <div>Төлөөгүй :</div>
        <div className="flex pl-1">
          <div className="font-bold">{notPaid}</div>
          <div className="pl-2 text-red-500 font-semibold">{`/ ${notPaidAmount} ₮/`}</div>
        </div>
      </div>
    </div>
  );
};
const checkLimit = (limitResponse) => {
  const limit = objectPath.get(limitResponse, "violation");
  const day = objectPath.get(limitResponse, "day");
  const plateNumber = objectPath.get(limitResponse, "plateNumber");
  return (
    <div style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <div
        className={`font-bold text-center text-xs ${
          limit ? "text-red-500" : "text-green-500"
        }`}
      >
        {limit ? "Зөрчилтэй" : "Зөрчилгүй"}
      </div>
      <div className={`font-bold text-center text-xs `}>{`${day}-өдөр`}</div>
      <div className={`font-bold text-center text-xs `}>{`${plateNumber}`}</div>
    </div>
  );
  console.log("🚀 ~ checkLimit ~ limitResponse:", limitResponse);
};
const Row = ({ data, columns, index, limit, offset, tdClass, width }) => {
  const [isOpen, setisOpen] = useState(false);
  const insurer_state = objectPath.get(
    data,
    "insuranceResponse.Contracts.0.insurer_state"
  );
  const insurance_company = objectPath.get(
    data,
    "insuranceResponse.Contracts.0.insurance_company"
  );
  const passed =
    moment(new Date()) <
    moment(objectPath.get(data, "inspectionResponse.response.expireDate"));

  const checkDate = objectPath.get(
    data,
    "inspectionResponse.response.checkDate"
  );
  const expireDate = objectPath.get(
    data,
    "inspectionResponse.response.expireDate"
  );
  const listData = objectPath.get(
    data,
    "penaltyResponse.return.response.listData"
  );

  const penalty = objectPath.get(data, "penalty");

  const asap = objectPath.get(data, "asap");
  const asapResponse = objectPath.get(data, "asapResponse");

  const drunk = objectPath.get(data, "drunk");
  const drunkResponse = objectPath.get(data, "drunkResponse");

  const taxResponse = objectPath.get(
    data,
    "taxResponse.return.response.listData"
  );
  const limitResponse = objectPath.get(data, "limitResponse");

  return [
    <div
      key={index}
      className={`hover:cursor-pointer w-full flex`}
      onClick={() => {
        setisOpen(!isOpen);
      }}
    >
      <td
        className={`${tdClass} px-4 text-center items-center flex justify-center text-black  ${
          width ? width : `w-36`
        }`}
      >
        <div className="flex justify-center items-center  text-black">
          {isOpen ? <FaMinus size={14} /> : <FaPlus size={14} />}
          <div className="font-medium ml-4 text-base  text-black  ">
            {offset * limit + index + 1}
          </div>
        </div>
      </td>
      {columns.map(({ key, render, center }, columnIndex) => {
        return (
          <td
            key={columnIndex}
            className={`${tdClass} ${center ? "text-center" : ""} ${
              width ? width : `w-36`
            } items-center flex  text-black `}
          >
            {render ? render(data) : objectPath.get(data, key)}
          </td>
        );
      })}
    </div>,
    isOpen && (
      <tr className="flex bg-background p-2">
        <div className="flex flex-col p-2 border-r w-full">
          <div className="text-center font-bold">Дугаарын хязгаарлалт</div>
          <div className="flex flex-col">{checkLimit(limitResponse)}</div>
        </div>
        <div className="flex flex-col p-2 border-r w-full">
          <div className="text-center font-bold">Татвар</div>
          <div className="flex flex-col">{checkTax(taxResponse)}</div>
        </div>
        <div className="flex flex-col p-2 border-r w-full">
          <div className="text-center font-bold">Даатгал</div>
          <div className="flex flex-col">
            <div className="flex flex-col justify-center items-center">
              <div
                className={`font-bold text-xs ${
                  insurer_state == "Active" ? "text-green-500" : "text-red-500"
                }`}
              >
                {insurer_state == "Active" ? "Идэвхтэй" : "Идэвхгүй"}
              </div>
              <div className="text-base text-center">{insurance_company}</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col p-2 border-r w-full">
          <div className="text-center font-bold">Оншилгоо</div>
          <div className="flex flex-col">
            <div className="flex flex-col justify-center items-center">
              <div
                className={`font-bold text-xs ${
                  passed == true ? "text-green-500" : "text-red-500"
                }`}
              >
                {passed == true ? "Тэнцсэн" : "Тэнцээгүй"}
              </div>
              <div className="flex">
                <div>Орсон : </div>
                <div className="pl-2 text-center">
                  {moment(checkDate).format("yyyy-MM-DD")}
                </div>
              </div>
              <div className="flex">
                <div>Дуусах : </div>
                <div className="pl-2 text-center">
                  {moment(expireDate).format("yyyy-MM-DD")}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col p-2 border-r w-full">
          <div className="text-center font-bold">Торгууль</div>
          <div
            className={`font-bold text-center text-xs ${
              penalty ? "text-red-500" : "text-green-500"
            }`}
          >
            {penalty ? "Зөрчилтэй" : "Зөрчилгүй"}
          </div>
          <div className="flex flex-col">{checkPenalty(listData)}</div>
        </div>
        <div className="flex flex-col p-2 border-r w-full">
          <div className="text-center font-bold">Эрэн сурвалжлалт</div>
          <div
            className={`font-bold text-center text-xs ${
              !asap ? "text-green-500" : "text-red-500"
            }`}
          >
            {!asap ? "Хэвийн" : "Эрэн сурвалжлагдаж байгаа"}
          </div>
          <div className="text-center">
            {objectPath.get(asapResponse, "description")}
          </div>
        </div>
        <div className="flex flex-col p-2 border-r w-full">
          <div className="text-center font-bold">Согтуу жолооч</div>
          <div
            className={`font-bold text-center text-xs ${
              !drunk ? "text-green-500" : "text-red-500"
            }`}
          >
            {!drunk ? "Хэвийн" : "Бүртгэгдсэн"}
          </div>
          <div className="text-center">{drunkResponse}</div>
        </div>
      </tr>
    ),
  ];
};
export default Row;
