import Dockerode from "dockerode";
import fs from "fs";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);
const docker = new Dockerode();

export async function buildDockerImage(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
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
                    docker.modem.followProgress(stream, (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            console.log("Docker image built successfully");
                            resolve("ex1");
                        }
                    });
                }
            }
        );
    });
}

export async function createAndStartContainer(imageName: string, github: string) {
    const container = await docker.createContainer({
        Image: imageName,
        Cmd: [
            '/bin/bash',
            '-c',
            `cd /source && git clone ${github} . && npm install && npm run build`
        ]
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
            stream!.pipe(process.stdout);
        }
    );

    return container;
}

export async function waitForContainer(container: Dockerode.Container) {
    return new Promise<void>((resolve, reject) => {
        container.wait((err, data) => {
            if (err) {
                reject(err);
            } else {
                console.log("Container finished execution");
                resolve();
            }
        });
    });
}

export async function copyFilesFromContainer(container: Dockerode.Container) {
    const containerDistPath = `hostDist`;
    fs.mkdirSync(containerDistPath, { recursive: true });

    try {
        const { stdout, stderr } = await execAsync(
            `docker cp ${container.id}:/source/out ${containerDistPath}`
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