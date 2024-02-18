import express, { Response } from "express";
import Dockerode from "dockerode";

const docker = new Dockerode();
const app = express();
const port = 3000;
app.use(express.json());

// Define a POST route
app.post("/", (req, res: Response) => {
  const { github }: { github: string } = req.body;
  if (!github) {
    return res.status(400).send("Please provide a GitHub link.");
  }
  res.send("GitHub link received successfully!");

  docker.buildImage(
    {
      context: __dirname + "/docker",
      src: ["Dockerfile"],
    },
    { t: "hey" },
    (err, stream) => {
      if (err) {
        console.error("Error building Docker image:", err);
        return;
      }

      // Log output from the build process
      docker.modem.followProgress(stream!, (error, result) => {
        if (error) {
          console.error("Error during build:", error);
        } else {
          console.log("Docker image built successfully");
        }
      });
    },
  );
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
