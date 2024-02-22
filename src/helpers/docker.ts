import Dockerode from "dockerode";
import fs from "fs";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);
const docker = new Dockerode();
let logsFileStream: fs.WriteStream;

export async function buildDockerImage(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    docker.buildImage(
      {
        context: "./",
        src: ["Dockerfile"],
      },
      { t: "ex1" },
      (err, stream) => {
        if (err) {
          reject(err);
        }
        if (stream) {
          docker.modem.followProgress(stream, (error) => {
            if (error) {
              reject(error);
            } else {
              console.log("Docker image built successfully");
              resolve();
            }
          });
        }
      },
    );
  });
}

export async function createAndStartContainer(
  imageName: string,
  github: string,
  logFile?: string,
) {
  if (logFile) {
    logsFileStream = fs.createWriteStream(`./logs/${logFile}`, {
      flags: "a",
    });
  }

  const container = await docker.createContainer({
    Image: imageName,
    Cmd: [
      "/bin/bash",
      "-c",
      `cd /source && git clone ${github} . && yarn install && yarn run build`,
    ],
  });

  console.log("Container created successfully");

  await container.start();

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
        console.error("Error attaching to container output:", err);
        return;
      }
      stream!.on("data", (chunk) => {
        const filteredChunk = chunk.toString().replace(/[^\x20-\x7E]+/g, "");
        process.stdout.write(filteredChunk + "\n");
        if (logFile) logsFileStream.write(filteredChunk + "\n");
      });
    },
  );

  return container;
}

export async function waitForContainer(container: Dockerode.Container) {
  return new Promise<void>((resolve, reject) => {
    container.wait((err) => {
      if (err) {
        reject(err);
      } else {
        console.log("Container finished execution");
        resolve();
      }
    });
  });
}

export async function copyFilesFromContainer(
  container: Dockerode.Container,
  to: string,
) {
  const containerDistPath = `build-warehouse/${to}`;
  fs.mkdirSync(containerDistPath, { recursive: true });

  try {
    const { stdout, stderr } = await execAsync(
      `docker cp ${container.id}:/source/out ${containerDistPath}`,
    );
    if (stderr) {
      throw new Error(`Error copying files from container: ${stderr}`);
    }
    console.log(stdout);
    console.log("Files copied successfully!");
  } catch (cpErr) {
    throw new Error(`Error copying files from container: ${cpErr}`);
  }
}

export async function deleteContainer(container: Dockerode.Container) {
  try {
    const { stdout, stderr } = await execAsync(
      `docker container rm ${container.id}`,
    );
    if (stderr) {
      throw new Error(`Error removing container: ${stderr}`);
    }
    console.log(stdout);
    console.log("Container removed successfully!");
  } catch (cpErr) {
    throw new Error(`Error removing container: ${cpErr}`);
  }
}
