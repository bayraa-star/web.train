import fs from "fs";
import { v4 as uuid } from "uuid";
import path from "path";
import { mkdirp } from "mkdirp";
import multer from "multer";
import { format } from "date-fns";
import utf8 from "utf8";

import File from "../models/file";
import objectPath from "object-path";

const dirDate = () => format(new Date(), "yyyyMMdd");

const fsMulter = multer({
  storage: multer.diskStorage({
    destination: ({ params }, file, cb) => {
      const dir = `uploads/${params.root}/`;
      try {
        mkdirp.sync(dir);
        cb(null, dir);
      } catch (err) {
        cb(err, dir);
      }
    },
    filename: ({}, file, cb) => {
      cb(null, uuid() + path.extname(file.originalname));
    },
  }),
});

const fsMultiUpload = fsMulter.array("upload");

const fileProcessor = async (file, { user, params }) => {
  const { path, originalname, mimetype, size, encoding, filename } = file;

  let type = mimetype.split("/")[0];

  if (["application/octet-stream"].includes(mimetype)) {
    type = "video";
  }
  if (["application/pdf"].includes(mimetype)) {
    type = "pdf";
  }

  const meta = {
    id: path,
    name: utf8.decode(originalname),
    mime: mimetype,
    size,
    encoding,
    type,
  };

  new File({
    ...meta,
    created: new Date(),
    createdby: user?.id,
  }).save();
  const txtName = filename.replace(".jpg", "");
  const plate = utf8.decode(originalname).replace(".jpg", "");
  const root = params.root;
  await saveAndAddTtxt(plate, txtName, root);

  return meta;
};
const saveAndAddTtxt = async (plate, id, root) => {
  const dir = `../../uploads/${root}`;
  const savePath = path.join(__dirname, dir, `${id}.txt`);

  fs.mkdirSync(path.dirname(savePath), { recursive: true });

  fs.writeFile(savePath, plate, (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return;
    }
    // console.log(`File created successfully at: ${savePath}`);
  });

  const folderPath = path.resolve(__dirname, dir);
  const filePath = path.join(folderPath, "labels.csv");

  fs.mkdirSync(folderPath, { recursive: true });

  const valueToAdd = `${id},${plate}\n`;

  console.log("🚀 ~ saveAndAddTtxt ~ valueToAdd:", valueToAdd);
  fs.appendFile(filePath, valueToAdd, (err) => {
    if (err) {
      console.error("Failed to write to file:", err);
    }
  });
  return true;
};

export const saveToFs = async (request, response) => {
  fsMultiUpload(request, response, async (err) => {
    try {
      if (err) throw err;

      const result = await Promise.all(
        request.files &&
          request.files.map(async (file) => fileProcessor(file, request))
      );

      return response.json(result);
    } catch (error) {
      return response.status(500).json(error.toString());
    }
  });
};

export const removeFromFs = async (request, response) => {
  const { deleteds } = request.body;

  deleteFilesByIds(deleteds);

  return response.json({ deleteds });
};

export const deleteFilesByIds = async (deleteds) => {
  if (Array.isArray(deleteds)) {
    deleteds.map((file) => {
      try {
        fs.unlinkSync(file);
      } catch {}
    });
    await File.deleteMany({ id: { $in: deleteds } });
  }
};

export const deleteFilesByField = async (field) => {
  if (!field) return;
  if (!Array.isArray(field)) return;
  if (field.length < 1) return;

  await deleteFilesByIds(field.map(({ id }) => id));
};
