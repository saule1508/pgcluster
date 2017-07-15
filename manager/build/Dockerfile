FROM centos:latest
MAINTAINER p.timmermans@evs.com
ADD https://nodejs.org/dist/v8.1.4/node-v8.1.4-linux-x64.tar.xz /
ENV PATH $PATH:/node-v8.1.4-linux-x64/bin
#RUN yum install -y git && yum clean all && mkdir /root/.ssh
ADD ssh_keys /root/.ssh
RUN chmod 700 /root/.ssh && chmod 600 /root/.ssh/* && chmod 644 /root/.ssh/known_hosts
ADD server /tmp/server
RUN cd /tmp/server && npm install
RUN mv /tmp/server /opt/manager
ADD client /tmp/client
RUN cd /tmp/client && npm install
RUN find /tmp/client/src -name "*.js" -exec sed -i -e "s/ console.log/ \/\/console.log/" {} \; && \
    find /tmp/client/src -name "*.js" -exec sed -i -e "s/^console.log/\/\/console.log/" {} \;
RUN cd /tmp/client && npm run build
RUN mv /tmp/client/build /opt/manager/app
RUN cp /opt/manager/config/config.prod.js /opt/manager/config/config.js
WORKDIR /opt/manager
VOLUME /var/run/docker.sock
EXPOSE 8080
CMD ["npm", "start"]
