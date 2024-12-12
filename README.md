# Parm
Recipe app

## Developing
To develop on this project, we created a Dockerfile that will create a development environment that will be consistent across all devs. To use this, follow these steps:

1. Navigate to the top level project directory `Parm`.
2. Execute `docker build . -t development` to build the image
3. Execute `docker run -p 3000:3000 -v <local path to project>:/app -it --name development development:latest` to create a container