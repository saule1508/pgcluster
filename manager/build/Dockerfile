FROM centos:latest
MAINTAINER p.timmermans@evs.com
RUN yum upgrade -y && yum install -y openssh-clients && yum clean all
ADD https://nodejs.org/dist/v8.5.0/node-v8.5.0-linux-x64.tar.xz / 
RUN tar xvf /node-v8.5.0-linux-x64.tar.xz && rm /node-v8.5.0-linux-x64.tar.xz 
ENV PATH $PATH:/node-v8.5.0-linux-x64/bin
RUN npm install -g yarn
#RUN yum install -y git && yum clean all && mkdir /root/.ssh
ADD ssh_keys /root/.ssh
RUN chmod 700 /root/.ssh && chmod 600 /root/.ssh/* && chmod 644 /root/.ssh/known_hosts
ADD server /tmp/server
RUN cd /tmp/server && yarn install
RUN mv /tmp/server /opt/manager
ADD client /tmp/client
RUN cd /tmp/client && yarn install
RUN find /tmp/client/src -name "*.js" -exec sed -i -e "s/ console.log/ \/\/console.log/" {} \; && \
    find /tmp/client/src -name "*.js" -exec sed -i -e "s/^console.log/\/\/console.log/" {} \;
RUN cd /tmp/client && yarn run build
RUN mv /tmp/client/build /opt/manager/app
RUN cp /opt/manager/config/config.prod.js /opt/manager/config/config.js
WORKDIR /opt/manager
VOLUME /var/run/docker.sock
EXPOSE 8080
CMD ["yarn", "start"]
