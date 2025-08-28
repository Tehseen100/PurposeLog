import multer from "multer";
import crypto from "crypto";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "src/temp/uploads"));
  },
  filename: function (req, file, cb) {
    const fileName =
      crypto.randomBytes(8).toString("hex") + path.extname(file.originalname);

    cb(null, fileName);
  },
});

export const upload = multer({ storage: storage });
