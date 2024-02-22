import express, { Response } from "express";
import {
  buildDockerImage,
  createAndStartContainer,
  waitForContainer,
  copyFilesFromContainer,
} from "./helpers/docker";

const app = express();
const port = 3000;
app.use(express.json());

app.post("/", async (req, res: Response) => {
  const { github }: { github: string } = req.body;
  if (!github) {
    return res.status(400).send("Please provide a GitHub link.");
  }
  res.send("GitHub link received successfully!");

  try {
    await buildDockerImage();
    const container = await createAndStartContainer("ex1", github);
    await waitForContainer(container);
    await copyFilesFromContainer(container);
  } catch (err) {
    console.error("An error occurred:", err);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
