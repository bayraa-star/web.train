import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { RiDeleteBin2Line, RiUploadLine } from "react-icons/ri";
import { mainApi } from "../providers/api";
import ProgressBar from "../template/Progress";
import Loader from "../template/Loader";
import { FaFileVideo, FaFileImage, FaFile, FaFileAudio } from "react-icons/fa";
import { translateError } from "../providers/alert";
import { getAbsolutePath } from "../providers/format";

const renderVideo = (url) => {
  return (
    <video
      key={url}
      className="w-full"
      controls="controls"
      crossOrigin="anonymous"
    >
      <source src={url}></source>
    </video>
  );
};

export const renderMedia = (file, preview = true) => {
  if (!file) return null;

  const { mime, name } = file;
  const url = getAbsolutePath(file);
  const type = mime && mime.split("/")[0];

  if (!preview) {
    return (
      <div className="flex">
        <div className={iconClass}>{renderIcon(type)}</div>
        <a
          key={url}
          className="link self-center"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          {name}
        </a>
      </div>
    );
  }

  switch (type) {
    case "image":
      return (
        <img
          key={url}
          className="w-full"
          src={url}
          alt={name}
          crossOrigin="anonymous"
        ></img>
      );
    case "audio":
      return (
        <audio
          key={url}
          className="w-full"
          controls="controls"
          crossOrigin="anonymous"
        >
          <source src={url}></source>
        </audio>
      );
    case "application":
      if (mime === "application/pdf")
        return (
          <iframe
            key={url}
            title={name}
            src={url}
            type="application/pdf"
            className="w-full"
            height="800"
          ></iframe>
        );
      if (mime === "application/octet-stream") return renderVideo(url);
      return;
    case "video":
      return renderVideo(url);
    default:
      return;
  }
};

const renderIcon = (type) => {
  switch (type) {
    case "audio":
      return <FaFileAudio></FaFileAudio>;
    case "video":
      return <FaFileVideo></FaFileVideo>;
    case "image":
      return <FaFileImage></FaFileImage>;
    default:
      return <FaFile></FaFile>;
  }
};

const iconClass = "text-2xl mr-2";
const FileUpload = ({
  root,
  accept = "image/*",
  limit = 8,
  count = 1,
  disabled,
  form,
  field,
  value,
  onChange,
  preview = true,
  submited,
  link,
}) => {
  const { t } = useTranslation();

  const [progress, setProgress] = useState(100);
  const [loading, setLoading] = useState(false);
  const [deleteds, setDeleteds] = useState([]);

  const sizeLimit = limit * 1024 * 1024;

  useEffect(() => {
    const deleteFiles = async () => {
      await mainApi({
        method: "DELETE",
        url: `/file/fs/${root || field.name}`,
        data: { deleteds },
      });
      setDeleteds([]);
    };

    if (submited && deleteds.length > 0) {
      deleteFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submited]);

  const onDrop = async (files) => {
    if (!disabled) {
      try {
        if (
          count &&
          count < ((field.value && field.value.length) || 0) + files.length
        ) {
          throw new Error(`action.count_${count}`);
        }

        let data = new FormData();

        files.forEach((file) => {
          if (file.size > sizeLimit) throw new Error(`action.limit_${limit}`);
          data.append("upload", file);
        });

        setLoading(true);
        setProgress(0);
        const response = await mainApi({
          url: `/file/fs/${root || field.name}`,
          method: "POST",
          data: data,
          onUploadProgress: (event) => {
            setProgress(Math.round((event.loaded * 100) / event.total));
          },
        });
        console.log("🚀 ~ onDrop ~ response:", response.data);
        if (response) {
          let tmp = [...(field.value || []), ...response.data];
          form ? form.setFieldValue(field.name, tmp) : onChange(tmp);
        }
      } catch (error) {
        translateError(t(`${error.message}`));
      } finally {
        setLoading(false);
        setProgress(100);
      }
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept,
    multiple: true,
    onDrop,
  });

  const val = (form ? field.value : value) || [];
  const full = val.length === count;

  const deleteFile = async ({ id }) => {
    try {
      setProgress(0);

      let tmp = field.value.filter((item) => item.id !== id);

      form ? form.setFieldValue(field.name, tmp) : onChange(tmp);

      setDeleteds([...deleteds, id]);
    } catch (error) {
      translateError(error);
    } finally {
      setProgress(100);
    }
  };

  const renderItem = (file, index, last) => {
    const { id, name } = file;
    const url = getAbsolutePath(file);

    if (!id) return null;

    return (
      <div
        key={index}
        className={`relative pb-2 mb-2 ${last ? "" : "border-b"}`}
      >
        <div className="flex items-start">
          <div
            className={`flex flex-1 ${preview ? "flex-col" : "items-center"}`}
          >
            <div className={` ${preview ? "order-1" : "order-0"}`}>
              {renderMedia(file, preview)}
            </div>
            {link && (
              <a
                className={`underline cursor text-xs leading-tight ${
                  preview ? "order-0" : "order-1"
                }`}
                href={url}
                target="_blank"
                rel="noreferrer"
                alt={name}
              >
                {name}
              </a>
            )}
          </div>
          {!disabled && (
            <div
              onClick={() => {
                deleteFile(file);
              }}
              className="cursor p-2 absolute top-0 right-0 z-10 text-white bg-dark-100 shadow-lg"
            >
              <RiDeleteBin2Line></RiDeleteBin2Line>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative w-full ${disabled ? "disabled" : ""}`}>
      <div className="gird grid-cols-1 md:grid-cols-3 gap-8">
        {val.map((item, index) =>
          renderItem(item, index, val.length - 1 === index)
        )}
      </div>
      {loading && <Loader overlay />}
      {progress < 100 && <ProgressBar progress={progress}></ProgressBar>}
      {!full && !disabled && (
        <div {...getRootProps()}>
          <input {...getInputProps()} disabled={disabled} />
          <div
            className={`border rounded flex flex-col items-center justify-center ${
              disabled ? "" : "cursor"
            }`}
            style={{ padding: 40 }}
          >
            <div className="text-6xl">
              <RiUploadLine />
            </div>
            <div className="text-center mt-2 select-none text-sm">
              {t("action.select")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
