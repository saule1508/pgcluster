FROM centos:8
MAINTAINER ptim007@yahoo.com
ENV MAJORVER=12
ENV MINORVER=7
ENV PGVER=12
ENV REPMGRVER=5.1.0
ENV PGPOOLMAJOR=4.1
ENV PGPOOLVER=4.1.1
ENV docker=yes
RUN dnf update -y ; dnf clean all && rm -rf /var/cache/dnf
RUN dnf install -y epel-release libxslt sudo openssh-server openssh-clients jq passwd rsync && \
    dnf install -y systemd-sysv iproute python3 hostname inotify-tools dnf-utils which && \
    dnf clean all && rm -rf /var/cache/dnf
RUN dnf -qy module disable postgresql
#RUN easy_install supervisor
RUN pip3 install supervisor
RUN mkdir /var/run/sshd
RUN ssh-keygen -t rsa -f /etc/ssh/ssh_host_rsa_key -N ''
RUN useradd -u 50010 postgres
RUN dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm
RUN dnf install -y postgresql${MAJORVER} postgresql${MAJORVER}-server  postgresql${MAJORVER}-contrib ; dnf clean all
RUN dnf install -y https://www.pgpool.net/yum/rpms/4.1/redhat/rhel-8-x86_64/pgpool-II-release-4.1-1.noarch.rpm
# pgpool extensions
RUN dnf install -y pgpool-II-pg${MAJORVER}-${PGPOOLVER} pgpool-II-pg${MAJORVER}-extensions-${PGPOOLVER}; dnf clean all; rm -rf /var/cache/dnf
# repmgr: installed from 2ndquadrant repo will install repmgr4
RUN curl https://dl.2ndquadrant.com/default/release/get/${MAJORVER}/rpm | bash
RUN dnf install -y --enablerepo=2ndquadrant-dl-default-release-pg${MAJORVER} --disablerepo=pgdg${MAJORVER} repmgr${MAJORVER}-${REPMGRVER} && dnf clean all && rm -rf /var/cache/dnf
RUN chown postgres:postgres /var/log/repmgr
RUN mkdir -p /data /backup /archive && chown -R postgres:postgres /data /backup /archive && chmod 755 /data /archive
ENV PGDATA /data
ENV PATH=$PATH:/usr/pgsql-${MAJORVER}/bin
ENV LANG=en_US.UTF-8
RUN usermod -G wheel -a postgres 
RUN echo "Defaults:postgres !requiretty" > /etc/sudoers.d/postgres && \
    echo "postgres ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/postgres
RUN sed -i -e "s/^%wheel/#%wheel/" -e "/^#.*%wheel.*NOPASSWD/s/^#.*%wheel/%wheel/" /etc/sudoers
RUN echo postgres:postgres | chpasswd
RUN echo root:postgres | chpasswd
# .bashrc is needed for connections via ssh
RUN  echo "export PATH=\$PATH:/usr/pgsql-${MAJORVER}/bin" >  /etc/profile.d/postgres.sh
RUN  echo "[ -f /etc/profile ] && source /etc/profile" >> /home/postgres/.bashrc && \
     echo "export PGDATA=/data PGVER=${PGVER} " >> /home/postgres/.bashrc
#
# this localedef command is needed because of bug in centos docker image?
#
#RUN localedef -i en_US -f UTF-8 en_US.UTF-8
RUN echo "*:*:postgres:postgres" > /home/postgres/.pcppass && chown postgres:postgres /home/postgres/.pcppass && chmod 600 /home/postgres/.pcppass
ADD scripts /scripts
ADD pgconfig /opt/pgconfig
RUN chown -R postgres:postgres /scripts 
#ADD ./bin/entrypoint.supervisor /entrypoint.sh
#RUN chmod +x /entrypoint.sh
ADD get_master.sh /home/postgres/get_master.sh
RUN chown postgres:postgres /home/postgres/get_master.sh && chmod 750 /home/postgres/get_master.sh
ADD supervisord.conf /etc/supervisor/supervisord.conf
# Make ssh connection easier
RUN echo "StrictHostKeyChecking no" >> /etc/ssh/ssh_config && \
    echo "UserKnownHostsFile /dev/null" >> /etc/ssh/ssh_config 
#    echo "LogLevel QUIET" >> /etc/ssh/ssh_config
# ssh listen on port 222
RUN sed -i -e "s/^#Port 22/Port 222/" /etc/ssh/sshd_config
ADD ssh_keys /home/postgres/.ssh 
RUN chown -R postgres:postgres /home/postgres/.ssh && chmod 700 /home/postgres/.ssh && chmod 644 /home/postgres/.ssh/* && chmod 600 /home/postgres/.ssh/id_rsa
RUN rm /run/nologin
ENV PATH=$PATH:/usr/pgsql-${MAJORVER}/bin
ADD initdb.sh /scripts/initdb.sh
EXPOSE 5432
EXPOSE 222
VOLUME ["/data","/archive","/backup"]
# if the file $PGDATA/postgres.conf does not exist initdb will initialize the cluster and create db phoenix
#  and db users (two per microservice)
CMD ["/usr/local/bin/supervisord","--configuration=/etc/supervisor/supervisord.conf"]
#CMD ["tail","-f","/etc/supervisor/supervisord.conf"]
