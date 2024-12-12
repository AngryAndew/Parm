FROM amazonlinux:latest

# Install Node.js and npm
RUN curl -fsSL https://rpm.nodesource.com/setup_22.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN yum install -y nodejs
RUN yum install -y git
RUN npm install -g aws-cdk

# Install AwS Cli
RUN yum install -y zip
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install

# Set the working directory
WORKDIR /app

VOLUME /app

EXPOSE 3000