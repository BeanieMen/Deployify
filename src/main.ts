import express, { Response } from "express";
import Dockerode from "dockerode";
import fs from "fs";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

const docker = new Dockerode();
const app = express();
const port = 3000;
app.use(express.json());

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
    { t: "ex1" },
    (err, stream) => {
      if (err) {
        console.error("Error building Docker image:", err);
        return;
      }

      // Log output from the build process
      if (stream) {
        docker.modem.followProgress(stream, (error, result) => {
          if (error) {
            console.error("Error during build:", error);
          } else {
            console.log("Docker image built successfully");

            docker.createContainer(
              {
                Image: "ex1",
                Cmd: [
                  '/bin/bash',
                  '-c',
                  `cd /source && git clone ${github} . && npm install && npm run build`
                ]
              },
              (err, container) => {
                if (err) {
                  console.error("Error creating container:", err);
                  return;
                }

                if (!container) {
                  console.error("Couldnt start container successfully");
                  return;
                }

                // Start the container
                container.start((err) => {
                  if (err) {
                    console.error("Error starting container:", err);
                    return;
                  }
                  console.log("Container started successfully");

                  container.attach(
                    {
                      stream: true,
                      stdout: true,
                      stderr: true,
                      logs: true,
                    },
                    (err, stream) => {
                      if (err) {
                        console.error(
                          "Error attaching to container output:",
                          err
                        );
                        return;
                      }
                      stream!.pipe(process.stdout);
                    }
                  );

                  container.wait(async (err, data) => {
                    if (err) {
                      console.error("Error waiting for container:", err);
                      return;
                    }

                    const containerDistPath = `${__dirname}/hostDist`;
                    fs.mkdirSync(containerDistPath, { recursive: true });

                    try {

                      const { stdout, stderr } = await execAsync(
                        `docker cp ${container.id}:/source/out ${containerDistPath}`
                      );
                      if (stderr) {
                        console.error(
                          "Error copying files from container:",
                          stderr
                        );
                        return;
                      }
                      console.log(stdout)
                      console.log("Files copied successfully!");

                    } catch (cpErr) {
                      console.error(
                        "Error copying files from container:",
                        cpErr
                      )

                    }
                  });
                });
              }
            );
          }
        });
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
