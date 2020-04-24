FROM centos:8 as builder
MAINTAINER p.timmermans@evs.com
RUN dnf upgrade -y && dnf clean all && rm -rf /var/cache/dnf
ADD https://nodejs.org/dist/v12.16.2/node-v12.16.2-linux-x64.tar.xz ./
RUN tar xvf /node-v12.16.2-linux-x64.tar.xz && rm /node-v12.16.2-linux-x64.tar.xz 
ENV PATH $PATH:/node-v12.16.2-linux-x64/bin
RUN npm install -g yarn
#RUN yum install -y git && yum clean all && mkdir /root/.ssh
ADD ssh_keys /root/.ssh
RUN chmod 700 /root/.ssh && chmod 600 /root/.ssh/* && chmod 644 /root/.ssh/known_hosts
ADD server /opt/server
RUN cd /opt/server && yarn install --production=true
RUN mv /opt/server /opt/manager
ADD client /tmp/client
RUN cd /tmp/client && yarn install 
#RUN find /tmp/client/src -name "*.js" -exec sed -i -e "s/ console.log/ \/\/console.log/" {} \; && \
#    find /tmp/client/src -name "*.js" -exec sed -i -e "s/^console.log/\/\/console.log/" {} \;
RUN cd /tmp/client && yarn build
RUN mv /tmp/client/build /opt/manager/app

FROM centos:8 
RUN dnf upgrade -y && dnf install -y openssh-clients && dnf clean all && rm -rf /var/cache/dnf
COPY --from=builder /node-v12.16.2-linux-x64 /node-v12.16.2-linux-x64
ENV PATH $PATH:/node-v12.16.2-linux-x64/bin
ADD ssh_keys /root/.ssh
RUN chmod 700 /root/.ssh && chmod 600 /root/.ssh/* && chmod 644 /root/.ssh/known_hosts
COPY --from=builder /opt/manager /opt/manager
WORKDIR /opt/manager
VOLUME /var/run/docker.sock
EXPOSE 8080
CMD ["node", "server.js"]
