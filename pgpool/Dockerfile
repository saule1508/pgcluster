FROM centos:8
MAINTAINER ptim007@yahoo.com
ENV PGVER=11
ENV PGPOOLMAJOR=4.1
ENV PGPOOLVER=4.1.1
RUN dnf update -y ; dnf install -y passwd sudo ; dnf clean all ; rm -rf /var/cache/dnf 
RUN groupadd -g 50010 postgres && useradd -u 50010 -g postgres postgres 
RUN usermod -G wheel -a postgres && echo "postgres" | passwd --stdin postgres
#RUN yum install -y http://www.pgpool.net/yum/rpms/${PGPOOLMAJOR}/redhat/rhel-8-x86_64/pgpool-II-pg11-${PGPOOLVER}-1pgdg.rhel8.x86_64.rpm
RUN dnf install -y https://www.pgpool.net/yum/rpms/4.1/redhat/rhel-8-x86_64/pgpool-II-release-4.1-1.noarch.rpm
#RUN yum install -y https://download.postgresql.org/pub/repos/yum/${PGVER}/redhat/rhel-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm
# Postgres repository
RUN dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm epel-release
# Disable module postgresql, needed on Centos 8
RUN dnf module disable -y postgresql
RUN dnf install -y postgresql${PGVER} pgpool-II-pg${PGVER}-${PGPOOLVER} pgpool-II-pg${PGVER}-extensions-${PGPOOLVER} \
    pgpool-II-pg${PGVER}-debuginfo-${PGPOOLVER} epel-release sudo vi openssh openssh-clients iproute ; \
     dnf clean all ; rm -rf /var/cache/dnf
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
