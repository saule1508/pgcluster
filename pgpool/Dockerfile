FROM centos:latest
MAINTAINER ptim007@yahoo.com
ENV PGVER=11
ENV PGPOOLMAJOR=4.0
ENV PGPOOLVER=4.0.3
RUN yum update -y ; yum clean all ; rm -rf /var/cache/yum
RUN groupadd -g 50010 postgres && useradd -u 50010 -g postgres postgres 
RUN usermod -G wheel -a postgres && echo "postgres" | passwd --stdin postgres
RUN yum install -y http://www.pgpool.net/yum/rpms/${PGPOOLMAJOR}/redhat/rhel-7-x86_64/pgpool-II-release-${PGPOOLMAJOR}-1.noarch.rpm
RUN yum install -y https://download.postgresql.org/pub/repos/yum/${PGVER}/redhat/rhel-7-x86_64/pgdg-centos${PGVER}-${PGVER}-2.noarch.rpm
RUN yum install -y postgresql${PGVER} pgpool-II-pg${PGVER}-${PGPOOLVER} pgpool-II-pg${PGVER}-extensions-${PGPOOLVER} \
    pgpool-II-pg${PGVER}-debuginfo-${PGPOOLVER} epel-release sudo vi openssh openssh-clients iproute ; \
     yum clean all ; rm -rf /var/cache/yum
# postgres can do sudo
RUN echo "Defaults:postgres !requiretty" > /etc/sudoers.d/postgres && \
    echo "postgres ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/postgres
RUN sed -i -e "s/^%wheel/#%wheel/" -e "/^#.*%wheel.*NOPASSWD/s/^#.*%wheel/%wheel/" /etc/sudoers
RUN echo root:postgres | chpasswd
# Make ssh connection easier
RUN echo "StrictHostKeyChecking no" >> /etc/ssh/ssh_config && \
    echo "UserKnownHostsFile /dev/null" >> /etc/ssh/ssh_config && \
    echo "LogLevel QUIET" >> /etc/ssh/ssh_config
ADD ssh_keys /home/postgres/.ssh 
RUN chown -R postgres:postgres /home/postgres/.ssh && chmod 700 /home/postgres/.ssh \
    && chmod 644 /home/postgres/.ssh/* && chmod 600 /home/postgres/.ssh/id_rsa \
    && chown postgres:postgres /var/run/pgpool
ADD pool_hba.conf /etc/pgpool-II/
# pcp user is postgres and password is postgres (hard-coded)
# note that this user has nothing to do with postgres or linux, it is purely for pcp
RUN echo "postgres:e8a48653851e28c69d0506508fb27fc5" >> /etc/pgpool-II/pcp.conf
RUN echo "*:*:postgres:postgres" > /home/postgres/.pcppass && \
  chown postgres:postgres /home/postgres/.pcppass && \
  chmod 600 /home/postgres/.pcppass && \
  chown -R postgres:postgres /etc/pgpool-II && \
  chmod +s /usr/sbin/arping /usr/sbin/ip
# put a file on /tmp so that we can determine if /tmp is host mounted or not (for pgpool_status file)
RUN touch /tmp/.not_host_mounted
ADD scripts /scripts
ADD bin/entrypoint.sh /
RUN chown postgres:postgres /entrypoint.sh /scripts/* && chmod +x /entrypoint.sh /scripts/*.sh
EXPOSE 9999
USER postgres
CMD ["/entrypoint.sh"]
