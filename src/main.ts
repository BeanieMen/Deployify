import express, { Response } from "express";
import {
  buildDockerImage,
  createAndStartContainer,
  waitForContainer,
  copyFilesFromContainer,
  deleteContainer,
} from "./helpers/docker";
const app = express();
const port = 80;

app.use(express.json());


app.post("/", async (req, res: Response) => {
  const { github }: { github: string } = req.body;
  if (!github) {
    return res.status(400).send("Please provide a GitHub link.");
  }
  res.send("GitHub link received successfully!");

  try {
    await buildDockerImage();
    const container = await createAndStartContainer("ex1", github, github.split("/")[3]+github.split("/")[4]);
    await waitForContainer(container);
    await copyFilesFromContainer(
      container,
      github.split("/")[3] + github.split("/")[4],
    );
    await deleteContainer(container);
  } catch (err) {
    console.error("An error occurred:", err);
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
