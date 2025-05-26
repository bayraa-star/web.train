import { useState, useEffect } from "react";
import { Select, DatePicker } from "../inputs";
import { Pulse } from "../template";
import { addDays } from "date-fns";
import { useTranslation } from "react-i18next";

const EQUALITY = [
  {
    value: null,
    label: "",
  },
  {
    label: "≥",
    value: "$lte",
  },
  {
    value: "$gte",
    label: "≤",
  },
  {
    value: "$eq",
    label: "=",
  },
];

const Conditions = ({ error, value, setCondition, disabled }) => {
  return (
    <div className="flex relative ml-1">
      {error && <Pulse />}
      <select
        value={value || ""}
        className={`w-12 text-center`}
        onChange={(e) => {
          setCondition(e.target.value);
        }}
        disabled={disabled}
      >
        {EQUALITY.map(({ value, label }, index) => (
          <option key={index} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
};

const TableFilter = ({
  filterChange,
  field,
  columns,
  dependents,
  label,
  ...restProps
}) => {
  const { type } = restProps;
  const [error, setError] = useState(false);
  const [value, setValue] = useState();
  const [condition, setCondition] = useState();
  const hasCondition = ["date", "number"].includes(type);
  const { t } = useTranslation();
  useEffect(() => {
    const error = hasCondition && !condition && value;
    const fetchCondition =
      value !== undefined && (hasCondition ? condition !== undefined : true);

    if (!error && fetchCondition) {
      value ? queryBuilder(value, condition) : filterChange(field, null);
    }

    if (!value) {
      setCondition();
    }

    setError(error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, condition]);

  const queryBuilder = (value, condition) => {
    if (hasCondition) {
      if (type === "date" && condition === "$eq") {
        let start = new Date(value);
        let end = addDays(start, 1);

        return filterChange(field, {
          $gte: start,
          $lt: end,
        });
      }
      return filterChange(field, { [condition]: value });
    } else {
      if (type === "select") {
        return filterChange(
          field,
          (Array.isArray(value) && value.length === 0) || !value
            ? null
            : Array.isArray(value)
            ? { $in: value }
            : value
        );
      } else {
        return filterChange(field, { $regex: value, $options: "i" });
      }
    }
  };

  const onChange = (value) => {
    setValue(value);

    if (value !== undefined && dependents) {
      columns
        .filter((column) => dependents.includes(column.key))
        .forEach((column) => {
          const { newFilter } = column;
          if (newFilter) {
            if (value) {
              column.default = {
                ...column.filter,
                key: "backup" + Date.now(),
              };
              column.filter = {
                ...column.filter,
                ...newFilter(value),
                key: "current" + Date.now(),
              };
            } else {
              column.filter = {
                ...column.default,
                key: "restore" + Date.now(),
              };
              column.default = null;
            }
          }
        });
    }
  };

  const Control = ({ type }) => {
    switch (type) {
      case "date":
        return (
          <DatePicker
            className="border-none rounded"
            isClearable={true}
            onChange={(value) => {
              onChange(value);
            }}
            {...restProps}
          />
        );
      case "select":
        return (
          <Select
            className="border-none rounded"
            onChange={(value) => {
              onChange(value);
            }}
            {...restProps}
          />
        );
      default:
        return (
          <div className="mt-4">
            <div>{label}</div>
            <input
              className="border-none rounded"
              placeholder={t("button.write")}
              onBlur={(e) => {
                onChange(e.target.value);
              }}
              onWheel={(e) => {
                e.target.blur();
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") onChange(e.target.value);
              }}
              {...restProps}
            />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col">
      {Control(restProps)}
      {hasCondition && (
        <Conditions
          className="border-none rounded"
          error={error}
          value={condition}
          setCondition={setCondition}
          {...restProps}
        />
      )}
    </div>
  );
};

export default TableFilter;
