import PDFDocument from "pdfkit";
import fs from "fs";
import { mkdirp } from "mkdirp";
import { format } from "date-fns";
import axios from "axios";
import { PHOTO_ROOT } from "../consts";
import { verify } from "crypto";
const checkDir = () => {
  const dir = "uploads/generated/" + format(new Date(), "yyyyMMdd");
  mkdirp(dir);

  return dir;
};

const downloadDir = (_id) => {
  const dir = "uploads/generated/" + format(new Date(), "yyyyMMdd") + "/" + _id;
  mkdirp.sync(dir);

  return dir;
};

const downloadImage = async (url, path) => {
  try {
    const writer = fs.createWriteStream(path);
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    await response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(path));
      writer.on("error", () => reject(null));
    });
  } catch (err) {
    console.log("Download PDF image", err.toString());
    return null;
  }
};

const startWithTab = (doc, size = 5) => {
  let ul = "";

  for (let i = 0; i < size; i++) {
    ul += "_";
  }

  return doc
    .fillColor("white")
    .text(ul, { continued: true })
    .fillColor("black");
};

const italic = (doc, text, opt) => {
  return doc.font("fonts/ARIALI 1.TTF").text(text, opt).font("fonts/ARIAL.TTF");
};

const drawTable = (
  doc,
  {
    fullname,
    org_name,
    register,
    date,
    time,
    location,
    mark,
    model,
    number,
    violation,
    law_name,
    owner_phone,
    photo_1,
    photo_2,
  }
) => {
  const h = 17;
  const w1 = 180;
  const w2 = 180;
  const w3 = 140;

  const Y = 70;
  const X = 70;
  const P = 3;

  let x = X;
  let y = doc.y;

  doc.fontSize(9);

  doc.rect(x, y, w1 + w2, h).stroke();
  doc.text(
    "Тээврийн хэрэгсэл эзэмшигч /өмчлөгч/-ийн мэдээлэл, гаргасан зөрчил",
    x + P,
    y + P
  );
  x += w1 + w2;

  doc.rect(x, y, w3, h * 11).stroke();

  if (photo_1) doc.image(photo_1, x, y, { width: w3 });
  if (photo_2) doc.image(photo_2, x, y + 79, { width: w3 });
  // doc.image("images/stamp_low.png", 290, 680, { width: 100 });
  // doc.image("images/sign.png", 290, 710, { width: 100 });

  y += h;
  x = X;

  [
    ["Овог, нэр", fullname],
    ["Хуулийн этгээдийн нэр", org_name],
    ["Регистрийн дугаар", register],
    ["Зөрчил гаргасан огноо", date],
    ["Цаг, минут", time],
    ["Байршил", location],
    ["Тээврийн хэрэгслийн марк, улсын дугаар", `${mark} ${model} ${number}`],
    ["Гаргасан зөрчил", violation],
    ["Зөрчлийн тухай хуулийн зүйл, заалт", law_name],
    ["Холбоо барих", owner_phone],
  ].map(([label, value]) => {
    doc.text(label, x + P, y + P);
    doc.rect(x, y, w1, h).stroke();
    x += w1;

    doc.text(value, x + P, y + P);
    doc.rect(x, y, w2, h).stroke();
    x += w2;

    y += h;
    x = X;
  });

  doc.text("", X, doc.y);
  doc.fontSize(11);
};

export const createPenaltyPdf = async ({
  _id,
  bno,
  date,
  position,
  fullname,
  mark,
  model,
  number,
  law_name,
  law_section,
  amount_text,
  account,
  police,
  org_name,
  register,
  time,
  location,
  violation,
  owner_phone,
  photo_1,
  photo_2,
  verifiedby_name,
}) => {
  const doc = new PDFDocument({
    size: "A4",
    margins: {
      top: 35,
      bottom: 25,
      left: 70,
      right: 50,
    },
  });
  const dir = checkDir();

  const download = downloadDir(_id);
  const photo_1_local = await downloadImage(
    PHOTO_ROOT + photo_1,
    `${download}/photo1.png`
  );
  const photo_2_local = await downloadImage(
    PHOTO_ROOT + photo_2,
    `${download}/photo2.png`
  );
  const pdf_url = `${dir}/${_id}.pdf`;

  doc.pipe(fs.createWriteStream(pdf_url));
  doc.font("fonts/ARIAL.TTF");
  doc.fontSize(11);

  doc.text("ШИЙТГЭЛИЙН ХУУДАС (маягт 4)", { align: "center" });
  doc.moveDown();
  doc.text(`Бүртгэлийн дугаар: ${bno}`, {
    align: "left",
  });
  doc.moveDown(-1);
  doc.text(`Шийтгэл оногдуулсан огноо: ${date}`, {
    align: "right",
  });
  doc.moveDown();
  doc.text("ЗӨРЧЛИЙН ТАЛААРХ МЭДЭЭЛЭЛ", { align: "center" });
  doc.moveDown(0.5);

  drawTable(doc, {
    fullname,
    org_name,
    register,
    date,
    time,
    location,
    mark,
    model,
    number,
    violation,
    law_name,
    owner_phone,
    photo_1: photo_1_local,
    photo_2: photo_2_local,
  });

  doc.moveDown(2);

  doc.text("ЗӨРЧИЛД ШИЙТГЭЛ ОНОГДУУЛАХ ТУХАЙ", { align: "center" });

  startWithTab(doc).text(
    `Зөрчил шалган шийдвэрлэх тухай хуулийн 6.1 дүгээр зүйлийн 2.3-т заасны дагуу ${position} би замын хөдөлгөөний аюулгүй байдлын тухай хууль, тогтоомжийг зөрчсөн гэх асуудлыг шалгаад ОЛСОН нь:`,
    { align: "justify" }
  );

  startWithTab(doc).text(
    `Холбогдогч ${fullname} нь Монгол Улсын Замын хөдөлгөөний дүрмийн заалтыг зөрчсөн болох нь автомат ажиллагаатай хяналтын төхөөрөмжид бүртгэгдсэн баримтаар нотлогдон тогтоогдож байх бөгөөд Зөрчил шалган шийдвэрлэх тухай хуулийн 3.1 дүгээр зүйлд заасан эрх эдэлж, үүрэг хүлээнэ.`,
    { align: "justify" }
  );

  startWithTab(doc).text(
    `Иймд ${mark} ${model} маркийн ${number} улсын дугаартай тээврийн хэрэгслийн өмчлөгч, эзэмшигч Н.Дорж /хүн, хуулийн этгээдийн нэр/-д торгох шийтгэл оногдуулах үндэслэлтэй байх тул Зөрчлийн тухай хуулийн 3.8 дугаар зүйл, Зөрчил шалган шийдвэрлэх тухай хуулийн 7.2 дугаар зүйлд заасныг тус тус үндэслэн ШИЙДВЭРЛЭХ НЬ:`,
    { align: "justify" }
  );

  startWithTab(doc).text(
    `1. ${mark} ${model} тээврийн хэрэгслийн өмчлөгч, эзэмшигч ${fullname} /хүн, хуулийн этгээдийн нэр/-ийн үйлдсэн зөрчилд ${law_name} ${law_section}-д заасны дагуу ${amount_text}өөр торгох шийтгэл оногдуулсугай.`,
    { align: "justify" }
  );
  startWithTab(doc).text(
    `2. Оногдуулсан шийтгэлийн ${amount_text}ийг энэхүү шийтгэлийн хуудсыг хүлээн авсан өдрөөс хойш 15 хоногийн дотор Төрийн сангийн ${account} тоот дансанд сайн дураараа биелүүлэхийг даалгасугай.`,
    { align: "justify" }
  );
  startWithTab(doc)
    .text(
      `3. Шийдвэрийг зөрчил үйлдсэн хүн, хуулийн этгээд /удирдах албан тушаалтан, хууль ёсны төлөөлөгч, өмгөөлөгч/-д биечлэн танилцуулах, эсхүл `,
      { align: "justify", continued: true }
    )
    .text(`харилцаа холбооны хэрэгслээр дамжуулан мэдэгдэхээр`, {
      continued: true,
      underline: true,
    })
    .text(` тогтсугай. `, {
      continued: true,
      underline: false,
    });

  italic(doc, `/аль тохирох хэлбэрийн доогуур зурах/`);

  startWithTab(doc).text(
    `4. Шийдвэрийг эс зөвшөөрвөл Зөрчил шалган шийдвэрлэх тухай хуулийн 7.6 дугаар зүйлийн 1 дэх хэсэгт заасны дагуу ажлын 5 хоногийн дотор харьяалах шүүхэд гомдол гаргах эрхтэй.`,
    { align: "justify" }
  );

  italic(
    startWithTab(doc),
    `Тайлбар: Зөрчлийн тухай хуулийн Арвандөрөвдүгээр бүлэгт заасан зөрчлийг тээврийн хэрэгсэл ашиглан үйлдсэн хүнийг олж тогтоосон бол Зөрчлийн тухай хуулийн 3.8 дугаар зүйлийн 2 дахь хэсэгт заасан үндэслэлээр тээврийн хэрэгслийн өмчлөгч, эзэмшигчийг шийтгэлээс чөлөөлнө.`,
    { align: "justify" }
  );

  doc.moveDown();

  startWithTab(doc)
    .text("Зөвлөмж: ", { continued: true })
    .fillColor("blue")
    .text("http://torguuli.police.gov.mn/", {
      underline: true,
      continued: true,
    })
    .fillColor("black")
    .text(" цахим хуудсаар дэлгэрэнгүй мэдээлэл авна уу.", {
      underline: false,
    });

  doc.moveDown(2);
  startWithTab(doc, 10).text("ШИЙДВЭР ГАРГАСАН:");
  doc.moveDown();
  startWithTab(doc, 10).text(
    `Эрх бүхий албан тушаалтан                                            /${verifiedby_name}/`
  );
  doc.moveDown(3);
  doc.text("---о0о---", { align: "center" });
  doc.end();

  fs.rmSync(download, { recursive: true, force: true });

  return pdf_url;
};
