import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import colors from "colors";
import crypto from "crypto";
import expressAsyncHandler from "express-async-handler";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const app = express();

const port = process.env.PORT || 8080;
// middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

//routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});
// shorten the url
app.post(
  "/api/shorten",
  expressAsyncHandler(async (req, res) => {
    const longUrl: string = req.body.url;
    const hash = crypto.createHash("sha256");
    hash.update(longUrl);
    const shortUrl = hash.digest("hex").slice(0, 6);
    // find if the short url already exists in the database
    const urlExists = await prisma.url.findUnique({
      where: {
        short: shortUrl,
      },
    });
    if (urlExists) {
      res.json({
        msg: "Url already exists",
      });
      return;
    }
    // save the short url to the database
    try {
      const url = await prisma.url.create({
        data: {
          url: longUrl,
          short: shortUrl,
        },
      });
      console.log(url);
    } catch (error) {
      console.log(error);
    }

    res.json({
      msg: "Url shortened successfully",
      shortUrl: shortUrl,
    });
  })
);

// redirect to the original url

app.get("/:shortUrl", async (req, res) => {
  const shortUrl = req.params.shortUrl;
  const url = await prisma.url.findUnique({
    where: {
      short: shortUrl,
    },
  });
  if (!url) {
    res.json({
      msg: "Url not found",
    });
    return;
  }
  console.log(url);

  res.redirect(url.url);
});

app.listen(port, () => {
  console.log(
    colors.bgGreen(`Server is running on port http://localhost:${port}`)
  );
});
